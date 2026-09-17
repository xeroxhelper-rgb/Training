type LoginError = { code?: string; message?: string };

export function getLoginErrorMessage(error: LoginError) {
  if (error.code === "email_not_confirmed" || error.message?.toLowerCase().includes("email not confirmed")) {
    return "이메일 인증이 완료되지 않았습니다. Supabase Auth 사용자 상태를 확인하세요.";
  }
  if (error.code === "user_banned" || error.code === "user_disabled") {
    return "이 계정은 현재 로그인할 수 없습니다. 관리자에게 문의하세요.";
  }
  return "이메일 또는 비밀번호를 확인하세요.";
}
