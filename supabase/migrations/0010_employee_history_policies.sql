-- Allow HR administrators to manage employee career history.
grant insert, update, delete on public.employment_history to authenticated;
grant usage, select on sequence public.employment_history_employment_history_id_seq to authenticated;

drop policy if exists employment_history_write_authorized on public.employment_history;
create policy employment_history_write_authorized on public.employment_history
  for all to authenticated
  using (private.has_role('system_admin') or private.has_role('hr') or private.has_role('manager'))
  with check (private.has_role('system_admin') or private.has_role('hr') or private.has_role('manager'));

notify pgrst, 'reload schema';
