begin;

select plan(6);

select has_table('public', 'departments', 'departments table exists');
select has_table('public', 'employment_history', 'employment history table exists');
select has_table('public', 'training_sessions', 'training sessions table exists');
select has_table('public', 'course_completions', 'course completions table exists');
select has_index('public', 'employees', 'employees_employee_number_key', 'employee number is unique');
select has_index('public', 'training_courses', 'training_courses_course_code_key', 'course code is unique');

select * from finish();
rollback;
