"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { validateEmployeeInput, type EmployeeInput } from "@/lib/validation/employee";

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
