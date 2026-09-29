-- Authorized employee registration and profile editing.

grant insert, update on public.employees to authenticated;
grant usage, select on sequence public.employees_employee_id_seq to authenticated;

drop policy if exists employees_insert_authorized on public.employees;
create policy employees_insert_authorized on public.employees
  for insert to authenticated
  with check (
    private.has_role('system_admin')
    or private.has_role('hr')
    or private.has_role('manager')
  );

drop policy if exists employees_update_authorized on public.employees;
create policy employees_update_authorized on public.employees
  for update to authenticated
  using (
    private.has_role('system_admin')
    or private.has_role('hr')
    or private.has_role('manager')
  )
  with check (
    private.has_role('system_admin')
    or private.has_role('hr')
    or private.has_role('manager')
  );
