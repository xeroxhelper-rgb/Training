import "server-only";

import { createClient } from "@/lib/supabase/server";
import { mapEmployeeRows, type DepartmentRow, type EmployeeRow } from "./employee-mapper";
import { buildEmployeeSearchFilter, normalizeEmployeeFilters, type EmployeeFilters } from "./employee-filters";
export { mapEmployeeRows } from "./employee-mapper";
export type { EmployeeListItem } from "./employee-mapper";

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
