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
