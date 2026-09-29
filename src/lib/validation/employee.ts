export type EmployeeInput = {
  name: string;
  employeeNumber: string;
  hireDate: string;
  department: string;
  status: string;
  position: string;
  email: string;
};

export type EmployeeEditableFields = Pick<EmployeeInput, "name" | "hireDate" | "department" | "status" | "position" | "email">;

export function buildChangedEmployeeFields(current: Record<string, string | null>, next: Record<string, string | null>): Record<string, string | null> {
  const changed: Record<string, string | null> = {};
  for (const key of Object.keys(next)) if (current[key] !== next[key]) changed[key] = next[key];
  return changed;
}

export function validateEmployeeInput(input: EmployeeInput): { ok: true } | { ok: false; error: string } {
  if (!input.name.trim() || !input.employeeNumber.trim() || !input.hireDate.trim() || !input.department.trim() || !input.status.trim()) {
    return { ok: false, error: "이름, 사번, 입사일, 부서, 상태는 필수입니다." };
  }
  if (!/^\d{10}$/.test(input.employeeNumber.trim())) return { ok: false, error: "사번은 10자리 숫자여야 합니다." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.hireDate.trim())) return { ok: false, error: "입사일 형식이 올바르지 않습니다." };
  if (!["재직", "휴직", "퇴사"].includes(input.status)) return { ok: false, error: "재직 상태가 올바르지 않습니다." };
  if (input.email.trim() && !/^\S+@\S+\.\S+$/.test(input.email.trim())) return { ok: false, error: "이메일 형식이 올바르지 않습니다." };
  return { ok: true };
}
