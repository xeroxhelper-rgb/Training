-- Eligibility and completion summary RPCs used by the course dashboard.
alter table public.employees add column if not exists job_function text;

do $$ begin alter type public.rule_field add value if not exists 'job_function'; exception when duplicate_object then null; end $$;
do $$ begin alter type public.rule_field add value if not exists 'hire_date'; exception when duplicate_object then null; end $$;

create or replace function public.course_eligibility(p_course_id bigint, p_as_of date default current_date)
returns table(employee_id bigint, source text, matched_group_id bigint)
language sql
security definer
set search_path = public
as $$
with active_employees as (
  select e.employee_id, d.department_id, e.position, e.job_function, e.status, e.hire_date
  from public.employees e
  left join lateral (
    select h.department_id
    from public.employment_history h
    where h.employee_id = e.employee_id
      and h.start_date <= p_as_of
      and (h.end_date is null or h.end_date >= p_as_of)
    order by h.start_date desc
    limit 1
  ) d on true
  where e.status <> '퇴사'
), groups as (
  select g.rule_group_id, g.course_id
  from public.eligibility_rule_groups g where g.course_id = p_course_id
), rule_matches as (
  select ae.employee_id, g.rule_group_id
  from active_employees ae
  join groups g on true
  where exists (select 1 from public.eligibility_rules r where r.rule_group_id = g.rule_group_id)
    and not exists (
      select 1 from public.eligibility_rules r
      where r.rule_group_id = g.rule_group_id
        and not (
          (r.field::text = 'department' and (
             (r.operator::text = 'equals' and ae.department_id::text = r.value) or
             (r.operator::text = 'not_equals' and ae.department_id::text <> r.value) or
             (r.operator::text = 'in' and ae.department_id::text = any(string_to_array(r.value, ','))) or
             (r.operator::text = 'contains' and ae.department_id::text ilike '%' || r.value || '%')
          )) or
          (r.field::text = 'position' and (
             (r.operator::text = 'equals' and coalesce(ae.position, '') = r.value) or
             (r.operator::text = 'not_equals' and coalesce(ae.position, '') <> r.value) or
             (r.operator::text = 'in' and coalesce(ae.position, '') = any(string_to_array(r.value, ','))) or
             (r.operator::text = 'contains' and coalesce(ae.position, '') ilike '%' || r.value || '%')
          )) or
          (r.field::text = 'job_function' and (
             (r.operator::text = 'equals' and coalesce(ae.job_function, '') = r.value) or
             (r.operator::text = 'not_equals' and coalesce(ae.job_function, '') <> r.value) or
             (r.operator::text = 'in' and coalesce(ae.job_function, '') = any(string_to_array(r.value, ','))) or
             (r.operator::text = 'contains' and coalesce(ae.job_function, '') ilike '%' || r.value || '%')
          )) or
          (r.field::text = 'employment_status' and (
             (r.operator::text = 'equals' and ae.status = r.value) or
             (r.operator::text = 'not_equals' and ae.status <> r.value) or
             (r.operator::text = 'in' and ae.status = any(string_to_array(r.value, ',')))
          )) or
          (r.field::text = 'hire_date' and (
             (r.operator::text = 'equals' and ae.hire_date::text = r.value) or
             (r.operator::text = 'not_equals' and ae.hire_date::text <> r.value) or
             (r.operator::text = 'contains' and ae.hire_date::text ilike '%' || r.value || '%')
          ))
        )
    )
), included as (
  select distinct ae.employee_id
  from active_employees ae
  join public.eligibility_employee_exceptions x on x.employee_id = ae.employee_id and x.is_included
  join groups g on g.rule_group_id = x.rule_group_id
), excluded as (
  select distinct ae.employee_id
  from active_employees ae
  join public.eligibility_employee_exceptions x on x.employee_id = ae.employee_id and not x.is_included
  join groups g on g.rule_group_id = x.rule_group_id
), configured as (
  select rm.employee_id, 'rule'::text as source, rm.rule_group_id as matched_group_id from rule_matches rm
  union
  select i.employee_id, 'exception'::text, null::bigint from included i
), legacy_targets as (
  select distinct t.employee_id, 'legacy-target'::text, null::bigint
  from public.training_targets t
  join active_employees ae on ae.employee_id = t.employee_id
  where t.course_id = p_course_id
    and not exists (select 1 from groups)
)
select c.employee_id, c.source, c.matched_group_id from configured c
where not exists (select 1 from excluded x where x.employee_id = c.employee_id)
union
select l.employee_id, l.source, l.matched_group_id from legacy_targets l;
$$;

create or replace function public.course_completion_summary(
  p_course_id bigint,
  p_as_of date default current_date,
  p_department_id bigint default null
)
returns table(target_count bigint, completed_count bigint, incomplete_count bigint, completion_rate numeric)
language sql
security definer
set search_path = public
as $$
with eligible as (
  select ce.employee_id
  from public.course_eligibility(p_course_id, p_as_of) ce
  where p_department_id is null
     or exists (
       select 1 from public.employment_history h
       where h.employee_id = ce.employee_id and h.department_id = p_department_id
         and h.start_date <= p_as_of and (h.end_date is null or h.end_date >= p_as_of)
     )
), completed as (
  select distinct cc.employee_id
  from public.course_completions cc
  join public.training_sessions ts on ts.session_id = cc.session_id
  join eligible e on e.employee_id = cc.employee_id
  where ts.course_id = p_course_id
    and cc.status = 'completed' and cc.cancelled_at is null
    and cc.completion_date <= p_as_of
)
select count(*)::bigint,
       count(c.employee_id)::bigint,
       (count(*) - count(c.employee_id))::bigint,
       case when count(*) = 0 then 0::numeric else round(count(c.employee_id)::numeric * 100 / count(*), 2) end
from eligible e left join completed c on c.employee_id = e.employee_id;
$$;

revoke all on function public.course_eligibility(bigint, date) from public;
revoke all on function public.course_completion_summary(bigint, date, bigint) from public;
grant execute on function public.course_eligibility(bigint, date) to authenticated;
grant execute on function public.course_completion_summary(bigint, date, bigint) to authenticated;

notify pgrst, 'reload schema';
