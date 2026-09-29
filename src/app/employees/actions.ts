"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { buildChangedEmployeeFields, validateEmployeeInput, type EmployeeInput } from "@/lib/validation/employee";

function readEmployeeInput(formData: FormData): EmployeeInput {
  return {
    name: String(formData.get("name") ?? ""),
    employeeNumber: String(formData.get("employee_number") ?? ""),
    hireDate: String(formData.get("hire_date") ?? ""),
    department: String(formData.get("department") ?? ""),
    status: String(formData.get("status") ?? ""),
    position: String(formData.get("position") ?? ""),
    email: String(formData.get("email") ?? ""),
  };
}

export async function createEmployee(formData: FormData) {
  const input = readEmployeeInput(formData);
  const validation = validateEmployeeInput(input);
  if (!validation.ok) redirect(`/employees/new?error=${encodeURIComponent(validation.error)}`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/employees/new");
  const { error } = await supabase.from("employees").insert({
    name: input.name.trim(), employee_number: Number(input.employeeNumber), hire_date: input.hireDate, svc_team: input.department.trim(), status: input.status, position: input.position.trim() || null, email: input.email.trim() || null,
  });
  if (error) {
    const message = error.code === "23505" ? "이미 등록된 사번입니다." : error.message;
    redirect(`/employees/new?error=${encodeURIComponent(message)}`);
  }
  redirect("/employees?created=1");
}

export async function updateEmployee(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const input = readEmployeeInput(formData);
  const validation = validateEmployeeInput(input);
  if (!employeeId || !validation.ok) redirect(`/employees/${employeeId}?edit=1&error=${encodeURIComponent(validation.ok ? "잘못된 직원입니다." : validation.error)}`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/employees/${employeeId}`);
  const { data: current, error: currentError } = await supabase.from("employees").select("employee_number, name, hire_date, svc_team, status, position, email").eq("employee_id", employeeId).maybeSingle();
  if (currentError || !current) redirect(`/employees/${employeeId}?error=${encodeURIComponent(currentError?.message ?? "직원을 찾을 수 없습니다.")}`);
  const changed = buildChangedEmployeeFields(
    { employee_number: String(current.employee_number), name: current.name, hire_date: current.hire_date, svc_team: current.svc_team, status: current.status, position: current.position, email: current.email },
    { employee_number: input.employeeNumber.trim(), name: input.name.trim(), hire_date: input.hireDate, svc_team: input.department.trim(), status: input.status, position: input.position.trim() || null, email: input.email.trim() || null },
  );
  if (Object.keys(changed).length === 0) redirect(`/employees/${employeeId}`);
  const payload = { ...changed, ...(changed.employee_number ? { employee_number: Number(changed.employee_number) } : {}) };
  const { error } = await supabase.from("employees").update(payload).eq("employee_id", employeeId);
  if (error) {
    const message = error.code === "23505" ? "이미 등록된 사번입니다." : error.message;
    redirect(`/employees/${employeeId}?edit=1&error=${encodeURIComponent(message)}`);
  }
  redirect(`/employees/${employeeId}?saved=1`);
}

function employeeRedirect(employeeId: number, message: string): never {
  redirect(`/employees/${employeeId}?error=${encodeURIComponent(message)}`);
}

export async function saveEmployeeCompletion(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const sessionId = Number(formData.get("session_id"));
  const status = String(formData.get("status") ?? "");
  const completionDate = String(formData.get("completion_date") ?? "") || null;
  if (!employeeId || !sessionId || !["completed", "failed", "absent", "cancelled"].includes(status)) employeeRedirect(employeeId, "수료 이력 입력값이 올바르지 않습니다.");
  if (status === "completed" && !completionDate) employeeRedirect(employeeId, "수료 상태에는 수료일이 필요합니다.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/employees/${employeeId}`);
  const { error } = await supabase.from("course_completions").upsert({ session_id: sessionId, employee_id: employeeId, status, completion_date: status === "completed" ? completionDate : null }, { onConflict: "session_id,employee_id" });
  if (error) employeeRedirect(employeeId, error.message);
  redirect(`/employees/${employeeId}?saved=1`);
}

export async function removeEmployeeCompletion(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const completionId = Number(formData.get("completion_id"));
  if (!employeeId || !completionId) employeeRedirect(employeeId, "삭제할 수료 이력이 없습니다.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/employees/${employeeId}`);
  const { error } = await supabase.from("course_completions").delete().eq("completion_id", completionId).eq("employee_id", employeeId);
  if (error) employeeRedirect(employeeId, error.message);
  redirect(`/employees/${employeeId}?saved=1`);
}

export async function saveEmploymentHistory(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const historyId = Number(formData.get("history_id"));
  const departmentId = Number(formData.get("department_id"));
  const startDate = String(formData.get("start_date") ?? "");
  const endDate = String(formData.get("end_date") ?? "") || null;
  const position = String(formData.get("position") ?? "").trim() || null;
  const reason = String(formData.get("reason") ?? "").trim() || null;
  if (!employeeId || !departmentId || !startDate || (endDate && endDate < startDate)) employeeRedirect(employeeId, "부서 이력 입력값이 올바르지 않습니다.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/employees/${employeeId}`);
  const payload = { employee_id: employeeId, department_id: departmentId, start_date: startDate, end_date: endDate, position, reason };
  const result = historyId ? await supabase.from("employment_history").update(payload).eq("employment_history_id", historyId).eq("employee_id", employeeId) : await supabase.from("employment_history").insert(payload);
  if (result.error) employeeRedirect(employeeId, result.error.message);
  redirect(`/employees/${employeeId}?saved=1`);
}

export async function removeEmploymentHistory(formData: FormData) {
  const employeeId = Number(formData.get("employee_id"));
  const historyId = Number(formData.get("history_id"));
  if (!employeeId || !historyId) employeeRedirect(employeeId, "삭제할 부서 이력이 없습니다.");
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/employees/${employeeId}`);
  const { error } = await supabase.from("employment_history").delete().eq("employment_history_id", historyId).eq("employee_id", employeeId);
  if (error) employeeRedirect(employeeId, error.message);
  redirect(`/employees/${employeeId}?saved=1`);
}
