import { describe, expect, it } from "vitest";
import { evaluateRuleGroups, type EligibilityEmployee } from "./eligibility";

const employee: EligibilityEmployee = { id: 7, departmentId: 3, position: "주임", jobFunction: "engineer", status: "재직", hireDate: "2020-01-10" };

describe("evaluateRuleGroups", () => {
  it("OR 그룹 사이에서는 하나만 충족해도 대상이다", () => {
    expect(evaluateRuleGroups(employee, [
      { id: 1, rules: [{ field: "department", operator: "in", value: [1, 2] }] },
      { id: 2, rules: [{ field: "job_function", operator: "equals", value: "engineer" }] },
    ], [], "2026-09-17")).toEqual({ eligible: true, source: "rule", matchedGroup: 2 });
  });

  it("직원 제외 예외가 일반 규칙보다 우선한다", () => {
    expect(evaluateRuleGroups(employee, [], [{ employeeId: 7, mode: "exclude" }], "2026-09-17"))
      .toEqual({ eligible: false, source: "exception" });
  });

  it("규칙이 없으면 미설정으로 판정한다", () => {
    expect(evaluateRuleGroups(employee, [], [], "2026-09-17")).toEqual({ eligible: false, source: "not-configured" });
  });

  it("그룹 안의 규칙은 AND로 평가한다", () => {
    expect(evaluateRuleGroups(employee, [{ id: 3, rules: [
      { field: "department", operator: "equals", value: 3 },
      { field: "employment_status", operator: "equals", value: "재직" },
    ] }], [], "2026-09-17")).toEqual({ eligible: true, source: "rule", matchedGroup: 3 });
  });
});
