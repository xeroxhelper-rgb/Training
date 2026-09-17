-- Allow authorized administrators/instructors to apply completion imports.
drop policy if exists completion_insert_authorized on public.course_completions;
create policy completion_insert_authorized on public.course_completions
  for insert to authenticated with check (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));
drop policy if exists completion_update_authorized on public.course_completions;
create policy completion_update_authorized on public.course_completions
  for update to authenticated using (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'))
  with check (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));
drop policy if exists import_batches_insert_authorized on public.import_batches;
create policy import_batches_insert_authorized on public.import_batches
  for insert to authenticated with check (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));
drop policy if exists import_rows_insert_authorized on public.import_rows;
create policy import_rows_insert_authorized on public.import_rows
  for insert to authenticated with check (private.has_role('system_admin') or private.has_role('hr') or private.has_role('instructor'));
grant insert on public.course_completions, public.import_batches, public.import_rows to authenticated;
notify pgrst, 'reload schema';
