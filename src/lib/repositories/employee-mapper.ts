export type EmployeeListItem = {
  id: number;
  employeeNumber: number;
  name: string;
  departmentId: number | null;
  departmentName: string;
  position: string;
  jobFunction: string;
  status: string;
  hireDate: string;
  email: string | null;
};

export type EmployeeRow = {
  employee_id: number;
  employee_number: number | string;
  name: string;
  position: string | null;
  svc_team: string | null;
  hire_date: string | null;
  status: string;
  email: string | null;
};

export type DepartmentRow = { department_id: number; name: string };

export function mapEmployeeRows(rows: EmployeeRow[], departments: DepartmentRow[]): EmployeeListItem[] {
  const departmentByName = new Map(departments.map((department) => [department.name, department]));

  return rows.map((employee) => {
    const department = employee.svc_team ? departmentByName.get(employee.svc_team) : undefined;
    return {
      id: employee.employee_id,
      employeeNumber: Number(employee.employee_number),
      name: employee.name,
      departmentId: department?.department_id ?? null,
      departmentName: employee.svc_team ?? "미지정",
      position: employee.position ?? "미등록",
      jobFunction: employee.position ?? "미등록",
      status: employee.status,
      hireDate: employee.hire_date ?? "-",
      email: employee.email,
    };
  });
}
