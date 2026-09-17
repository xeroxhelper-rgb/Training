"use server";

import { createClient } from "@/lib/supabase/server";
import { getSafeNextPath } from "@/lib/auth/guards";
import { getLoginErrorMessage } from "@/lib/auth/login-error";
import { redirect } from "next/navigation";
import { z } from "zod";

export type LoginState = {
  fieldErrors?: { email?: string[]; password?: string[] };
  formError?: string;
};

const loginSchema = z.object({
  email: z.string().trim().email("올바른 이메일을 입력하세요."),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다."),
  next: z.string().optional(),
});

export async function login(_state: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    next: formData.get("next") ?? undefined,
  });

  if (!parsed.success) {
    return { fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    console.error("[auth.login] Supabase sign-in failed", {
      code: error.code,
      status: error.status,
    });
    return { formError: getLoginErrorMessage(error) };
  }

  redirect(getSafeNextPath(parsed.data.next));
}
