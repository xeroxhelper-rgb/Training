-- Training course and session administration write policies.

create unique index if not exists training_sessions_course_round_key
  on public.training_sessions(course_id, session_number);

grant insert, update on public.training_courses to authenticated;
grant usage, select on sequence public.training_courses_course_id_seq to authenticated;
grant insert, update on public.training_sessions to authenticated;
grant usage, select on sequence public.training_sessions_session_id_seq to authenticated;

drop policy if exists courses_insert_authorized on public.training_courses;
create policy courses_insert_authorized on public.training_courses
  for insert to authenticated
  with check (private.has_role('system_admin') or private.has_role('hr'));

drop policy if exists courses_update_authorized on public.training_courses;
create policy courses_update_authorized on public.training_courses
  for update to authenticated
  using (private.has_role('system_admin') or private.has_role('hr'))
  with check (private.has_role('system_admin') or private.has_role('hr'));

drop policy if exists sessions_insert_authorized on public.training_sessions;
create policy sessions_insert_authorized on public.training_sessions
  for insert to authenticated
  with check (private.has_role('system_admin') or private.has_role('hr'));

drop policy if exists sessions_update_authorized on public.training_sessions;
create policy sessions_update_authorized on public.training_sessions
  for update to authenticated
  using (private.has_role('system_admin') or private.has_role('hr'))
  with check (private.has_role('system_admin') or private.has_role('hr'));
