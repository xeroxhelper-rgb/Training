import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRows, type DepartmentRow, type EmployeeRow } from "./employee-mapper";
import { buildEmployeeSearchFilter, normalizeEmployeeFilters, type EmployeeFilters } from "./employee-filters";
import type { EmployeeListItem } from "./employee-mapper";
export { mapEmployeeRows } from "./employee-mapper";
export type { EmployeeListItem } from "./employee-mapper";

export type EmployeeDetail = EmployeeListItem & {
  birthDate: string | null;
  resignDate: string | null;
  completions: { courseName: string; round: string; completionDate: string | null }[];
  departmentHistory: { departmentName: string; position: string | null; reason: string | null; startDate: string; endDate: string | null }[];
};

export async function getEmployeeList(filters: EmployeeFilters = {}) {
  const supabase = await createClient();
  const normalizedFilters = normalizeEmployeeFilters(filters);
  let employeeQuery = supabase
    .from("employees")
    .select("employee_id, employee_number, name, position, svc_team, hire_date, status, email")
    .order("employee_id");
  const searchFilter = normalizedFilters.query ? buildEmployeeSearchFilter(normalizedFilters.query) : null;
  if (searchFilter) employeeQuery = employeeQuery.or(searchFilter);
  if (normalizedFilters.department) employeeQuery = employeeQuery.eq("svc_team", normalizedFilters.department);
  if (normalizedFilters.status) employeeQuery = employeeQuery.eq("status", normalizedFilters.status);
  const [employeeResult, departmentResult] = await Promise.all([
    employeeQuery,
    supabase.from("departments").select("department_id, name").order("name"),
  ]);

  if (employeeResult.error) throw new Error(`직원 정보를 불러오지 못했습니다: ${employeeResult.error.message}`);
  if (departmentResult.error) throw new Error(`부서 정보를 불러오지 못했습니다: ${departmentResult.error.message}`);

  return mapEmployeeRows(
    (employeeResult.data ?? []) as EmployeeRow[],
    (departmentResult.data ?? []) as DepartmentRow[],
  );
}

export async function getDepartments() {
  const supabase = await createClient();
  const { data, error } = await supabase.from("departments").select("department_id, name").order("name");
  if (error) throw new Error(`부서 정보를 불러오지 못했습니다: ${error.message}`);
  return (data ?? []) as DepartmentRow[];
}

export async function getEmployeeDetail(employeeId: number): Promise<EmployeeDetail | null> {
  const supabase = await createClient();
  const { data: employee, error } = await supabase.from("employees").select("employee_id, employee_number, name, birth_date, position, svc_team, hire_date, resign_date, status, email").eq("employee_id", employeeId).maybeSingle();
  if (error) throw new Error(`직원 정보를 불러오지 못했습니다: ${error.message}`);
  if (!employee) return null;
  const [{ data: departments, error: departmentError }, { data: history, error: historyError }, { data: completions, error: completionError }] = await Promise.all([
    supabase.from("departments").select("department_id, name").order("name"),
    supabase.from("employment_history").select("department_id, position, reason, start_date, end_date").eq("employee_id", employeeId).order("start_date", { ascending: false }),
    supabase.from("course_completions").select("session_id, completion_date, status").eq("employee_id", employeeId).eq("status", "completed").is("cancelled_at", null),
  ]);
  if (departmentError) throw new Error(`부서 정보를 불러오지 못했습니다: ${departmentError.message}`);
  if (historyError) throw new Error(`부서 이력을 불러오지 못했습니다: ${historyError.message}`);
  if (completionError) throw new Error(`수료 이력을 불러오지 못했습니다: ${completionError.message}`);
  const departmentMap = new Map((departments ?? []).map((department) => [Number(department.department_id), department.name]));
  const sessionIds = (completions ?? []).map((completion) => completion.session_id);
  const { data: sessions, error: sessionError } = sessionIds.length ? await supabase.from("training_sessions").select("session_id, course_id, session_number").in("session_id", sessionIds) : { data: [], error: null };
  if (sessionError) throw new Error(`교육 차수 정보를 불러오지 못했습니다: ${sessionError.message}`);
  const courseIds = (sessions ?? []).map((session) => session.course_id);
  const { data: courses, error: courseError } = courseIds.length ? await supabase.from("training_courses").select("course_id, course_name").in("course_id", courseIds) : { data: [], error: null };
  if (courseError) throw new Error(`교육 과정 정보를 불러오지 못했습니다: ${courseError.message}`);
  const sessionMap = new Map((sessions ?? []).map((session) => [Number(session.session_id), session]));
  const courseMap = new Map((courses ?? []).map((course) => [Number(course.course_id), course.course_name]));
  const mapped = mapEmployeeRows([employee as EmployeeRow], (departments ?? []) as DepartmentRow[])[0];
  return {
    ...mapped,
    birthDate: employee.birth_date,
    resignDate: employee.resign_date,
    completions: (completions ?? []).flatMap((completion) => { const session = sessionMap.get(Number(completion.session_id)); if (!session) return []; return [{ courseName: courseMap.get(Number(session.course_id)) ?? "알 수 없는 과정", round: `${session.session_number}차`, completionDate: completion.completion_date }]; }),
    departmentHistory: (history ?? []).map((item) => ({ departmentName: departmentMap.get(Number(item.department_id)) ?? "미지정", position: item.position, reason: item.reason, startDate: item.start_date, endDate: item.end_date })),
  };
}
