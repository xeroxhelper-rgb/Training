-- Optional demo data for validating the course/session screens.
-- Safe to run repeatedly: natural keys and ON CONFLICT prevent duplicates.

update public.employees
set job_function = case
  when job_function is not null then job_function
  when svc_team ilike '%필드%' then '필드 엔지니어'
  when svc_team ilike '%솔루션%' then '솔루션 엔지니어'
  else '시스템 엔지니어'
end
where job_function is null;

insert into public.training_courses (course_code, course_name, target_model, description, created_date, is_active, threshold_percent, status, validity_months)
select v.code, v.name, v.target_model, v.description, current_date, true, v.threshold, 'active', v.validity_months
from (values
  ('DEMO-BASE', 'Nuvera 314 기본 유지보수 교육', '플랫폼·필드서비스팀', '장비 구조와 기본 장애 대응을 익히는 데모 과정', 70::numeric, null::integer),
  ('DEMO-SAFE', '전기안전 정기교육', '전체 재직자', '연 1회 전기안전 필수 데모 과정', 90::numeric, 12::integer),
  ('DEMO-ADV', 'Nuvera 314 고급 트러블슈팅', '과장 이상·기술 리더', '복합 장애 분석 데모 과정', 70::numeric, 24::integer)
) as v(code, name, target_model, description, threshold, validity_months)
where not exists (select 1 from public.training_courses c where c.course_code = v.code);

insert into public.training_sessions (course_id, session_number, starts_at, ends_at, location, instructor_name, status, capacity)
select c.course_id, 1, '2026-09-01 09:00+09'::timestamptz, '2026-09-02 17:00+09'::timestamptz, '기술교육장 A', '김강사', 'closed', 20
from public.training_courses c
where c.course_code = 'DEMO-BASE'
on conflict (course_id, session_number) do nothing;

insert into public.training_sessions (course_id, session_number, starts_at, ends_at, location, instructor_name, status, capacity)
select c.course_id, 1, '2026-10-20 09:00+09'::timestamptz, '2026-10-21 17:00+09'::timestamptz, '온라인', '박강사', 'planned', 30
from public.training_courses c
where c.course_code = 'DEMO-SAFE'
on conflict (course_id, session_number) do nothing;

insert into public.training_sessions (course_id, session_number, starts_at, ends_at, location, instructor_name, status, capacity)
select c.course_id, 1, '2026-11-10 09:00+09'::timestamptz, '2026-11-11 17:00+09'::timestamptz, '기술교육장 B', '이강사', 'open', 15
from public.training_courses c
where c.course_code = 'DEMO-ADV'
on conflict (course_id, session_number) do nothing;

insert into public.session_participants (session_id, employee_id)
select s.session_id, e.employee_id
from public.training_sessions s
join public.training_courses c on c.course_id = s.course_id
join public.employees e on e.status <> '퇴사'
where c.course_code = 'DEMO-BASE' and s.session_number = 1 and e.employee_id <= 6
on conflict do nothing;

insert into public.session_participants (session_id, employee_id)
select s.session_id, e.employee_id
from public.training_sessions s
join public.training_courses c on c.course_id = s.course_id
join public.employees e on e.status <> '퇴사'
where c.course_code = 'DEMO-SAFE' and s.session_number = 1
on conflict do nothing;

insert into public.session_participants (session_id, employee_id)
select s.session_id, e.employee_id
from public.training_sessions s
join public.training_courses c on c.course_id = s.course_id
join public.employees e on e.status <> '퇴사'
where c.course_code = 'DEMO-ADV' and s.session_number = 1 and e.position in ('팀장', '과장', '대리')
on conflict do nothing;

insert into public.course_completions (session_id, employee_id, status, completion_date, score)
select s.session_id, p.employee_id, 'completed', '2026-09-02', 90
from public.training_sessions s
join public.training_courses c on c.course_id = s.course_id
join public.session_participants p on p.session_id = s.session_id
where c.course_code = 'DEMO-BASE' and p.employee_id in (1, 2, 4)
on conflict (session_id, employee_id) do nothing;

insert into public.course_completions (session_id, employee_id, status, completion_date, score)
select s.session_id, p.employee_id, 'completed', '2026-10-21', 88
from public.training_sessions s
join public.training_courses c on c.course_id = s.course_id
join public.session_participants p on p.session_id = s.session_id
where c.course_code = 'DEMO-SAFE' and p.employee_id in (1, 2, 3, 4)
on conflict (session_id, employee_id) do nothing;

notify pgrst, 'reload schema';
