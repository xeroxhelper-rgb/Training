import { describe, expect, it } from "vitest";
import { mapEmployeeRows } from "./employee-mapper";

describe("employee repository mapping", () => {
  it("maps numeric employee numbers and department names for the UI", () => {
    const result = mapEmployeeRows(
      [
        {
          employee_id: 7,
          employee_number: 2020031234,
          name: "홍길동",
          position: "대리",
          svc_team: "플랫폼기술팀",
          hire_date: "2020-03-01",
          status: "재직",
          email: "hong@example.com",
        },
      ],
      [{ department_id: 3, name: "플랫폼기술팀" }],
    );

    expect(result).toEqual([
      expect.objectContaining({
        id: 7,
        employeeNumber: 2020031234,
        departmentId: 3,
        departmentName: "플랫폼기술팀",
      }),
    ]);
  });
});
