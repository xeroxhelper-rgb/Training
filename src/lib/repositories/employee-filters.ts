export type EmployeeFilters = { query?: string; department?: string; status?: string };

export function normalizeEmployeeFilters(filters: EmployeeFilters): EmployeeFilters {
  const query = filters.query?.trim();
  const department = filters.department && filters.department !== "전체 부서" ? filters.department : undefined;
  const status = filters.status && filters.status !== "재직 상태 전체" ? filters.status : undefined;
  return { ...(query ? { query } : {}), ...(department ? { department } : {}), ...(status ? { status } : {}) };
}

export function buildEmployeeSearchFilter(query: string): string | null {
  const value = query.trim().replace(/[,*()]/g, "");
  if (!value) return null;
  const conditions = [`name.ilike.*${value}*`];
  const employeeNumber = value.match(/\d{4,}/)?.[0];
  if (employeeNumber) conditions.push(`employee_number.eq.${employeeNumber}`);
  return conditions.join(",");
}
