-- =========================================================
-- 직원 기술 교육 이수 현황 관리 시스템 - 초기 스키마
-- =========================================================

-- 1. employees (직원)
create table if not exists employees (
  employee_id      bigint generated always as identity primary key,
  name              text not null,
  birth_date        date,
  position          text,
  svc_team          text,
  hire_date         date,
  resign_date       date,
  status            text not null default '재직' check (status in ('재직','퇴사','신입')),
  email             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- 2. career_history (인사이동 이력)
create table if not exists career_history (
  history_id        bigint generated always as identity primary key,
  employee_id       bigint not null references employees(employee_id) on delete cascade,
  svc_team          text,
  position          text,
  start_date        date not null,
  end_date          date,
  reason            text,
  created_at        timestamptz not null default now()
);

-- 3. certifications (자격증)
create table if not exists certifications (
  cert_id           bigint generated always as identity primary key,
  employee_id       bigint not null references employees(employee_id) on delete cascade,
  cert_name         text not null,
  acquired_date     date,
  expiry_date       date,
  created_at        timestamptz not null default now()
);

-- 4. awards (수상 이력)
create table if not exists awards (
  award_id          bigint generated always as identity primary key,
  employee_id       bigint not null references employees(employee_id) on delete cascade,
  award_name        text not null,
  award_date        date,
  description       text,
  created_at        timestamptz not null default now()
);

-- 5. training_courses (교육 과정)
create table if not exists training_courses (
  course_id         bigint generated always as identity primary key,
  course_name       text not null,
  target_model      text,
  description       text,
  created_date      date not null default current_date,
  is_active         boolean not null default true,
  threshold_percent numeric not null default 70,  -- 14번 기능: 과정별 알림 임계치
  created_at        timestamptz not null default now()
);

-- 6. training_targets (교육 대상자)
create table if not exists training_targets (
  target_id         bigint generated always as identity primary key,
  course_id         bigint not null references training_courses(course_id) on delete cascade,
  employee_id       bigint not null references employees(employee_id) on delete cascade,
  assigned_date     date not null default current_date,
  unique (course_id, employee_id)
);

-- 7. training_completions (교육 수료 이력)
create table if not exists training_completions (
  completion_id     bigint generated always as identity primary key,
  course_id         bigint not null references training_courses(course_id) on delete cascade,
  employee_id       bigint not null references employees(employee_id) on delete cascade,
  completion_date   date not null default current_date,
  score             int,
  unique (course_id, employee_id)
);

-- 8. email_logs (메일 발송 이력 - 초안 단계)
create table if not exists email_logs (
  log_id            bigint generated always as identity primary key,
  course_id         bigint references training_courses(course_id) on delete set null,
  recipient_ids     jsonb not null default '[]',
  subject           text,
  body              text,
  status            text not null default '초안' check (status in ('초안','발송완료')),
  created_date      timestamptz not null default now()
);

-- =========================================================
-- 인덱스
-- =========================================================
create index if not exists idx_career_history_employee on career_history(employee_id);
create index if not exists idx_certifications_employee on certifications(employee_id);
create index if not exists idx_awards_employee on awards(employee_id);
create index if not exists idx_targets_course on training_targets(course_id);
create index if not exists idx_targets_employee on training_targets(employee_id);
create index if not exists idx_completions_course on training_completions(course_id);
create index if not exists idx_completions_employee on training_completions(employee_id);
create index if not exists idx_employees_svc_team on employees(svc_team);
create index if not exists idx_employees_status on employees(status);

-- =========================================================
-- 뷰: 과정별 수료율
-- =========================================================
create or replace view v_course_completion_rate as
select
  c.course_id,
  c.course_name,
  c.target_model,
  c.is_active,
  c.threshold_percent,
  count(distinct t.employee_id) as target_count,
  count(distinct comp.employee_id) as completed_count,
  case when count(distinct t.employee_id) = 0 then 0
       else round(count(distinct comp.employee_id)::numeric / count(distinct t.employee_id) * 100, 1)
  end as completion_rate
from training_courses c
left join training_targets t on t.course_id = c.course_id
left join training_completions comp
  on comp.course_id = c.course_id and comp.employee_id = t.employee_id
group by c.course_id, c.course_name, c.target_model, c.is_active, c.threshold_percent;

-- =========================================================
-- 뷰: SVC팀별 교육 수료율
-- =========================================================
create or replace view v_team_completion_rate as
select
  e.svc_team,
  count(distinct t.employee_id || '-' || t.course_id) as total_targets,
  count(distinct case when comp.completion_id is not null then t.employee_id || '-' || t.course_id end) as total_completed,
  case when count(distinct t.employee_id || '-' || t.course_id) = 0 then 0
       else round(
         count(distinct case when comp.completion_id is not null then t.employee_id || '-' || t.course_id end)::numeric
         / count(distinct t.employee_id || '-' || t.course_id) * 100, 1)
  end as completion_rate
from employees e
join training_targets t on t.employee_id = e.employee_id
left join training_completions comp
  on comp.course_id = t.course_id and comp.employee_id = t.employee_id
where e.status <> '퇴사'
group by e.svc_team;

-- =========================================================
-- 뷰: SVC팀별 자격증 보유율 (팀 인원 중 자격증 1개 이상 보유 비율)
-- =========================================================
create or replace view v_team_cert_rate as
select
  e.svc_team,
  count(distinct e.employee_id) as team_count,
  count(distinct ce.employee_id) as cert_holder_count,
  case when count(distinct e.employee_id) = 0 then 0
       else round(count(distinct ce.employee_id)::numeric / count(distinct e.employee_id) * 100, 1)
  end as cert_holding_rate
from employees e
left join certifications ce on ce.employee_id = e.employee_id
where e.status <> '퇴사'
group by e.svc_team;

-- =========================================================
-- 뷰: 미수료자 명단 (임계치 초과 과정 기준) - 14번 기능
-- =========================================================
create or replace view v_incomplete_alert as
select
  r.course_id,
  r.course_name,
  r.target_model,
  r.completion_rate,
  r.threshold_percent,
  e.employee_id,
  e.name as employee_name,
  e.svc_team
from v_course_completion_rate r
join training_targets t on t.course_id = r.course_id
join employees e on e.employee_id = t.employee_id
left join training_completions comp
  on comp.course_id = t.course_id and comp.employee_id = t.employee_id
where comp.completion_id is null
  and r.completion_rate > r.threshold_percent
  and r.is_active = true
  and e.status <> '퇴사';
