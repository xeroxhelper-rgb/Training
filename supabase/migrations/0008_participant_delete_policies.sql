-- Authorized users may remove an employee from a training session.
drop policy if exists participants_delete_authorized on public.session_participants;
create policy participants_delete_authorized on public.session_participants
  for delete to authenticated
  using (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));

drop policy if exists completion_delete_authorized on public.course_completions;
create policy completion_delete_authorized on public.course_completions
  for delete to authenticated
  using (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));

grant delete on public.session_participants, public.course_completions to authenticated;
notify pgrst, 'reload schema';
