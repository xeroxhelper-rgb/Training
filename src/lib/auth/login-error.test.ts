import { describe, expect, it } from "vitest";
import { getLoginErrorMessage } from "./login-error";

describe("login error messages", () => {
  it("explains when email confirmation is required", () => {
    expect(getLoginErrorMessage({ code: "email_not_confirmed", message: "Email not confirmed" })).toContain("이메일 인증");
  });

  it("keeps invalid credentials generic", () => {
    expect(getLoginErrorMessage({ code: "invalid_credentials", message: "Invalid login credentials" })).toBe("이메일 또는 비밀번호를 확인하세요.");
  });
});
