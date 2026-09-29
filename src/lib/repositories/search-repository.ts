import "server-only";

import { createClient } from "@/lib/supabase/server";
import { parseSearchTerms, rankEmployeeMatches, type SearchResult } from "@/lib/search/ranking";

export async function searchEmployees(query: string, options: { courseId?: number; department?: string } = {}): Promise<SearchResult[]> {
  const supabase = await createClient();
  const selectedCourseId = options.courseId;
  const [{ data: employees, error: employeeError }, { data: departments, error: departmentError }, { data: history, error: historyError }, { data: completions, error: completionError }, { data: sessions, error: sessionError }, { data: courses, error: courseError }] = await Promise.all([
    supabase.from("employees").select("employee_id, employee_number, name, svc_team, position, job_function, status"),
    supabase.from("departments").select("department_id, name"),
    supabase.from("employment_history").select("employee_id, department_id"),
    supabase.from("course_completions").select("employee_id, session_id, status").eq("status", "completed").is("cancelled_at", null),
    supabase.from("training_sessions").select("session_id, course_id"),
    supabase.from("training_courses").select("course_id, course_name, is_active, status"),
  ]);
  const firstError = employeeError ?? departmentError ?? historyError ?? completionError ?? sessionError ?? courseError;
  if (firstError) throw new Error(`통합 검색 데이터를 불러오지 못했습니다: ${firstError.message}`);
  const departmentMap = new Map((departments ?? []).map((department) => [Number(department.department_id), department.name]));
  const sessionMap = new Map((sessions ?? []).map((session) => [Number(session.session_id), Number(session.course_id)]));
  const courseMap = new Map((courses ?? []).map((course) => [Number(course.course_id), course]));
  const historyByEmployee = new Map<number, string[]>();
  for (const item of history ?? []) { const values = historyByEmployee.get(Number(item.employee_id)) ?? []; const name = departmentMap.get(Number(item.department_id)); if (name) values.push(name); historyByEmployee.set(Number(item.employee_id), values); }
  const completedByEmployee = new Map<number, Set<number>>();
  const courseNamesByEmployee = new Map<number, string[]>();
  for (const completion of completions ?? []) { const employeeId = Number(completion.employee_id); const courseId = sessionMap.get(Number(completion.session_id)); if (courseId == null) continue; const course = courseMap.get(courseId); if (!course || (selectedCourseId && courseId !== selectedCourseId)) continue; const ids = completedByEmployee.get(employeeId) ?? new Set<number>(); ids.add(courseId); completedByEmployee.set(employeeId, ids); const names = courseNamesByEmployee.get(employeeId) ?? []; names.push(course.course_name); courseNamesByEmployee.set(employeeId, names); }
  const incompleteNamesByEmployee = new Map<number, string[]>();
  const activeCourses = (courses ?? []).filter((course) => course.is_active && course.status !== "archived" && (!selectedCourseId || Number(course.course_id) === selectedCourseId));
  const eligibility = await Promise.all(activeCourses.map(async (course) => ({ courseId: Number(course.course_id), courseName: course.course_name, data: (await supabase.rpc("course_eligibility", { p_course_id: Number(course.course_id) })).data ?? [] })));
  for (const item of eligibility) for (const eligible of item.data as { employee_id: number }[]) { const employeeId = Number(eligible.employee_id); if (completedByEmployee.get(employeeId)?.has(item.courseId)) continue; const names = incompleteNamesByEmployee.get(employeeId) ?? []; names.push(item.courseName); incompleteNamesByEmployee.set(employeeId, names); }
  const candidates = (employees ?? []).filter((employee) => employee.status !== "퇴사" && (!options.department || employee.svc_team === options.department)).map((employee) => ({ id: Number(employee.employee_id), employeeNumber: Number(employee.employee_number), name: employee.name, departmentName: employee.svc_team ?? "미지정", position: employee.position ?? "미등록", jobFunction: employee.job_function ?? employee.position ?? "미등록", historyDepartments: historyByEmployee.get(Number(employee.employee_id)) ?? [], courseNames: courseNamesByEmployee.get(Number(employee.employee_id)) ?? [], incompleteCourseNames: incompleteNamesByEmployee.get(Number(employee.employee_id)) ?? [] }));
  return rankEmployeeMatches(candidates, parseSearchTerms(query));
}
