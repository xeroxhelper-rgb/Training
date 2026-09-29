import { describe, expect, it } from "vitest";
import { buildEmployeeSearchFilter, normalizeEmployeeFilters } from "./employee-filters";

describe("employee filters", () => {
  it("normalizes empty filter values", () => {
    expect(normalizeEmployeeFilters({ query: " ", department: "전체 부서", status: "재직 상태 전체" })).toEqual({});
  });

  it("builds a name and numeric employee-number search filter", () => {
    expect(buildEmployeeSearchFilter("홍길동 2000000001")).toBe("name.ilike.*홍길동 2000000001*,employee_number.eq.2000000001");
  });
});
