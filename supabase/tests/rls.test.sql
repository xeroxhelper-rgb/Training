begin;

select plan(5);
select has_schema('private', 'private schema exists');
select has_function('private', 'can_view_employee(bigint)', 'employee scope helper exists');
select policies_are('public', 'employees', ARRAY['employees_select_scoped'], 'employees have scoped select policy');
select policies_are('public', 'departments', ARRAY['departments_select_authenticated'], 'departments require authentication');
select policies_are('public', 'user_role_scopes', ARRAY['role_scopes_self_select'], 'role scopes are self-scoped');

select * from finish();
rollback;
