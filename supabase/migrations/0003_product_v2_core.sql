-- SkillFlow v2 core domain schema.
-- This migration extends the prototype tables without deleting legacy data.

create extension if not exists btree_gist;

do $$ begin
  create type public.employment_status as enum ('active', 'leave', 'resigned');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.course_status as enum ('draft', 'active', 'archived');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.session_status as enum ('planned', 'open', 'closed', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.completion_status as enum ('completed', 'failed', 'absent', 'cancelled');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rule_field as enum ('department', 'position', 'employment_status', 'competency_tag');
exception when duplicate_object then null; end $$;
do $$ begin
  create type public.rule_operator as enum ('equals', 'not_equals', 'contains', 'in');
exception when duplicate_object then null; end $$;

do $$ begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'employees'
      and column_name = 'employee_number' and data_type = 'text'
  ) then
    alter table public.employees
      alter column employee_number type bigint
      using case
        when employee_number like 'LEGACY-%' then 2000000000 + employee_id
        else nullif(regexp_replace(employee_number, '[^0-9]', '', 'g'), '')::bigint
      end;
  end if;
end $$;
alter table public.employees add column if not exists employee_number bigint;
update public.employees
set employee_number = 2000000000 + employee_id
where employee_number is null;
alter table public.employees alter column employee_number set not null;
alter table public.employees drop constraint if exists employees_employee_number_range;
alter table public.employees add constraint employees_employee_number_range
  check (employee_number between 1000000000 and 9999999999);
create unique index if not exists employees_employee_number_key
  on public.employees(employee_number);

alter table public.employees drop constraint if exists employees_status_check;
update public.employees set status = '재직' where status = '신입';
alter table public.employees add constraint employees_status_check
  check (status in ('재직', '휴직', '퇴사'));

create table if not exists public.departments (
  department_id bigint generated always as identity primary key,
  department_code text not null unique,
  name text not null,
  parent_department_id bigint references public.departments(department_id),
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.departments (department_code, name)
select distinct 'LEGACY-' || md5(coalesce(svc_team, '미지정')), coalesce(svc_team, '미지정')
from public.employees
where not exists (
  select 1 from public.departments d where d.name = coalesce(public.employees.svc_team, '미지정')
);

create table if not exists public.employment_history (
  employment_history_id bigint generated always as identity primary key,
  employee_id bigint not null references public.employees(employee_id) on delete cascade,
  department_id bigint not null references public.departments(department_id),
  position text,
  start_date date not null,
  end_date date,
  reason text,
  created_at timestamptz not null default now(),
  check (end_date is null or end_date >= start_date),
  exclude using gist (
    employee_id with =,
    daterange(start_date, coalesce(end_date + 1, 'infinity'::date), '[)') with &&
  )
);

insert into public.employment_history (employee_id, department_id, position, start_date, end_date, reason)
select ch.employee_id, d.department_id, ch.position, ch.start_date, ch.end_date, ch.reason
from public.career_history ch
join public.employees e on e.employee_id = ch.employee_id
join public.departments d on d.name = coalesce(ch.svc_team, e.svc_team, '미지정')
where not exists (
  select 1 from public.employment_history h
  where h.employee_id = ch.employee_id
    and h.start_date = ch.start_date
    and h.department_id = d.department_id
);

create table if not exists public.competency_tags (
  competency_tag_id bigint generated always as identity primary key,
  tag text not null unique,
  description text,
  created_at timestamptz not null default now()
);

create table if not exists public.course_competency_tags (
  course_id bigint not null references public.training_courses(course_id) on delete cascade,
  competency_tag_id bigint not null references public.competency_tags(competency_tag_id) on delete cascade,
  primary key (course_id, competency_tag_id)
);

create table if not exists public.course_prerequisites (
  course_id bigint not null references public.training_courses(course_id) on delete cascade,
  prerequisite_course_id bigint not null references public.training_courses(course_id),
  primary key (course_id, prerequisite_course_id),
  check (course_id <> prerequisite_course_id)
);

create table if not exists public.eligibility_rule_groups (
  rule_group_id bigint generated always as identity primary key,
  course_id bigint not null references public.training_courses(course_id) on delete cascade,
  name text not null,
  match_all boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.eligibility_rules (
  rule_id bigint generated always as identity primary key,
  rule_group_id bigint not null references public.eligibility_rule_groups(rule_group_id) on delete cascade,
  field public.rule_field not null,
  operator public.rule_operator not null,
  value text not null
);

create table if not exists public.eligibility_employee_exceptions (
  rule_group_id bigint not null references public.eligibility_rule_groups(rule_group_id) on delete cascade,
  employee_id bigint not null references public.employees(employee_id) on delete cascade,
  is_included boolean not null,
  reason text,
  primary key (rule_group_id, employee_id)
);

alter table public.training_courses add column if not exists course_code text;
update public.training_courses set course_code = 'LEGACY-' || course_id where course_code is null;
alter table public.training_courses alter column course_code set not null;
create unique index if not exists training_courses_course_code_key
  on public.training_courses(course_code);
alter table public.training_courses add column if not exists status public.course_status not null default 'active';
alter table public.training_courses add column if not exists validity_months integer;
alter table public.training_courses add column if not exists owner_user_id uuid references auth.users(id);

create table if not exists public.training_sessions (
  session_id bigint generated always as identity primary key,
  course_id bigint not null references public.training_courses(course_id) on delete restrict,
  session_number integer not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  location text,
  instructor_name text,
  status public.session_status not null default 'planned',
  capacity integer,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (course_id, session_number),
  check (ends_at >= starts_at),
  check (capacity is null or capacity > 0)
);

create table if not exists public.session_participants (
  session_id bigint not null references public.training_sessions(session_id) on delete cascade,
  employee_id bigint not null references public.employees(employee_id) on delete cascade,
  registered_at timestamptz not null default now(),
  registered_by uuid references auth.users(id),
  primary key (session_id, employee_id)
);

create table if not exists public.course_completions (
  completion_id bigint generated always as identity primary key,
  session_id bigint not null references public.training_sessions(session_id),
  employee_id bigint not null references public.employees(employee_id),
  status public.completion_status not null,
  completion_date date,
  score numeric,
  note text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  unique (session_id, employee_id),
  check ((status = 'completed' and completion_date is not null) or status <> 'completed'),
  check ((cancelled_at is null and cancellation_reason is null) or
         (cancelled_at is not null and cancellation_reason is not null)),
  check (score is null or (score >= 0 and score <= 100))
);

create table if not exists public.import_batches (
  import_batch_id bigint generated always as identity primary key,
  session_id bigint not null references public.training_sessions(session_id),
  file_name text not null,
  row_count integer not null default 0,
  accepted_count integer not null default 0,
  rejected_count integer not null default 0,
  status text not null default 'validated' check (status in ('validated', 'applied', 'failed')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.import_rows (
  import_row_id bigint generated always as identity primary key,
  import_batch_id bigint not null references public.import_batches(import_batch_id) on delete cascade,
  row_number integer not null,
  employee_number bigint,
  raw_data jsonb not null,
  normalized_data jsonb,
  error_code text,
  error_message text,
  unique (import_batch_id, row_number)
);

create table if not exists public.user_role_scopes (
  scope_id bigint generated always as identity primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('system_admin', 'hr', 'manager', 'instructor', 'employee', 'executive')),
  employee_id bigint references public.employees(employee_id),
  department_id bigint references public.departments(department_id),
  created_at timestamptz not null default now(),
  unique (user_id, role, department_id)
);

create table if not exists public.audit_logs (
  audit_log_id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id),
  action text not null,
  entity_name text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.metric_snapshots (
  metric_snapshot_id bigint generated always as identity primary key,
  snapshot_date date not null,
  course_id bigint references public.training_courses(course_id),
  department_id bigint references public.departments(department_id),
  target_count integer not null default 0,
  completed_count integer not null default 0,
  completion_rate numeric(5, 2) not null default 0,
  created_at timestamptz not null default now(),
  unique (snapshot_date, course_id, department_id)
);

create index if not exists employment_history_employee_idx on public.employment_history(employee_id);
create index if not exists employment_history_department_idx on public.employment_history(department_id);
create index if not exists training_sessions_course_idx on public.training_sessions(course_id);
create index if not exists session_participants_employee_idx on public.session_participants(employee_id);
create index if not exists course_completions_employee_idx on public.course_completions(employee_id);
create index if not exists import_rows_batch_idx on public.import_rows(import_batch_id);
