-- Role-scoped access control. No employee data is exposed to anon.

create schema if not exists private;
revoke all on schema private from public;

alter table public.user_role_scopes add column if not exists employee_id bigint references public.employees(employee_id);
alter table public.user_role_scopes add column if not exists course_id bigint references public.training_courses(course_id);
alter table public.user_role_scopes drop constraint if exists user_role_scopes_role_check;
alter table public.user_role_scopes add constraint user_role_scopes_role_check
  check (role in ('system_admin', 'hr', 'manager', 'instructor', 'employee', 'executive'));

create or replace function private.is_authenticated()
returns boolean
language sql stable security definer set search_path = ''
as $$ select auth.uid() is not null $$;

create or replace function private.has_role(required_role text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_role_scopes scope
    where scope.user_id = auth.uid()
      and (scope.role = required_role or scope.role = 'system_admin')
  )
$$;

create or replace function private.can_view_employee(target_employee_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_role_scopes scope
    where scope.user_id = auth.uid()
      and (
        scope.role in ('system_admin', 'hr', 'executive')
        or (scope.role = 'employee' and scope.employee_id = target_employee_id)
        or (
          scope.role = 'manager'
          and exists (
            select 1
            from public.employees employee
            join public.departments department on department.name = employee.svc_team
            where employee.employee_id = target_employee_id
              and department.department_id = scope.department_id
          )
        )
      )
  )
$$;

create or replace function private.can_manage_course(target_course_id bigint)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1
    from public.user_role_scopes scope
    where scope.user_id = auth.uid()
      and (
        scope.role in ('system_admin', 'hr')
        or (scope.role = 'instructor' and scope.course_id = target_course_id)
      )
  )
$$;

revoke all on all tables in schema public from anon;
revoke all on all sequences in schema public from anon;

grant select on public.employees, public.departments, public.employment_history,
  public.training_courses, public.training_sessions, public.session_participants,
  public.course_completions, public.competency_tags, public.course_competency_tags,
  public.course_prerequisites, public.eligibility_rule_groups, public.eligibility_rules,
  public.eligibility_employee_exceptions, public.import_batches, public.import_rows,
  public.metric_snapshots to authenticated;
grant select on public.user_role_scopes to authenticated;

grant execute on function private.is_authenticated() to authenticated;
grant execute on function private.has_role(text) to authenticated;
grant execute on function private.can_view_employee(bigint) to authenticated;
grant execute on function private.can_manage_course(bigint) to authenticated;

alter table public.employees enable row level security;
alter table public.departments enable row level security;
alter table public.employment_history enable row level security;
alter table public.training_courses enable row level security;
alter table public.training_sessions enable row level security;
alter table public.session_participants enable row level security;
alter table public.course_completions enable row level security;
alter table public.user_role_scopes enable row level security;

drop policy if exists employees_select_scoped on public.employees;
create policy employees_select_scoped on public.employees
  for select to authenticated using (private.can_view_employee(employee_id));

drop policy if exists departments_select_authenticated on public.departments;
create policy departments_select_authenticated on public.departments
  for select to authenticated using (private.is_authenticated());

drop policy if exists employment_history_select_scoped on public.employment_history;
create policy employment_history_select_scoped on public.employment_history
  for select to authenticated using (private.can_view_employee(employee_id));

drop policy if exists courses_select_authenticated on public.training_courses;
create policy courses_select_authenticated on public.training_courses
  for select to authenticated using (private.is_authenticated());

drop policy if exists sessions_select_authenticated on public.training_sessions;
create policy sessions_select_authenticated on public.training_sessions
  for select to authenticated using (private.is_authenticated());

drop policy if exists participants_select_authenticated on public.session_participants;
create policy participants_select_authenticated on public.session_participants
  for select to authenticated using (private.can_view_employee(employee_id));

drop policy if exists completions_select_authenticated on public.course_completions;
create policy completions_select_authenticated on public.course_completions
  for select to authenticated using (private.can_view_employee(employee_id));

drop policy if exists role_scopes_self_select on public.user_role_scopes;
create policy role_scopes_self_select on public.user_role_scopes
  for select to authenticated using (user_id = auth.uid() or private.has_role('system_admin'));

create or replace function private.audit_row_change()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  insert into public.audit_logs(actor_user_id, action, entity_name, entity_id, before_data, after_data)
  values (
    auth.uid(),
    tg_op,
    tg_table_name,
    coalesce(to_jsonb(new)->>'employee_id', to_jsonb(new)->>'course_id', to_jsonb(old)->>'employee_id', to_jsonb(old)->>'course_id'),
    case when tg_op = 'INSERT' then null else to_jsonb(old) end,
    case when tg_op = 'DELETE' then null else to_jsonb(new) end
  );
  return coalesce(new, old);
end
$$;

drop trigger if exists employees_audit on public.employees;
create trigger employees_audit after insert or update or delete on public.employees
for each row execute function private.audit_row_change();

drop trigger if exists courses_audit on public.training_courses;
create trigger courses_audit after insert or update or delete on public.training_courses
for each row execute function private.audit_row_change();

notify pgrst, 'reload schema';
