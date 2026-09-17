"use client";

import { useActionState } from "react";
import { login, type LoginState } from "./actions";

const initialState: LoginState = {};

export function LoginForm({ next }: { next: string }) {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <form action={formAction} className="login-form">
      <input type="hidden" name="next" value={next} />
      <label>
        이메일
        <input name="email" type="email" autoComplete="email" required />
        {state.fieldErrors?.email?.map((message) => <small key={message}>{message}</small>)}
      </label>
      <label>
        비밀번호
        <input name="password" type="password" autoComplete="current-password" required />
        {state.fieldErrors?.password?.map((message) => <small key={message}>{message}</small>)}
      </label>
      {state.formError ? <p className="form-error">{state.formError}</p> : null}
      <button type="submit" disabled={pending} className="primary-button">
        {pending ? "로그인 중..." : "로그인"}
      </button>
    </form>
  );
}
