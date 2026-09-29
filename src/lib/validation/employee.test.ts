import { describe, expect, it } from "vitest";
import { validateEmployeeInput } from "./employee";

describe("employee input validation", () => {
  it("accepts a complete employee payload", () => {
    expect(validateEmployeeInput({ name: "홍길동", employeeNumber: "2000000001", hireDate: "2026-01-01", department: "A팀", status: "재직", position: "대리", email: "hong@example.com" })).toEqual({ ok: true });
  });

  it("rejects missing required fields and invalid employee numbers", () => {
    const result = validateEmployeeInput({ name: "", employeeNumber: "123", hireDate: "", department: "", status: "퇴사", position: "", email: "" });
    expect(result).toEqual({ ok: false, error: "이름, 사번, 입사일, 부서, 상태는 필수입니다." });
  });
});
