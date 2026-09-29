"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updateCompletionStatus(formData: FormData) {
  const sessionId = Number(formData.get("session_id"));
  const employeeId = Number(formData.get("employee_id"));
  const status = String(formData.get("status"));
  const allowed = ["completed", "failed", "absent", "cancelled"];
  if (!sessionId || !employeeId || !allowed.includes(status)) redirect(`/sessions/${sessionId}?error=잘못된 입력입니다`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/sessions/${sessionId}`);
  const { error } = await supabase.from("course_completions").upsert({
    session_id: sessionId,
    employee_id: employeeId,
    status,
    completion_date: status === "completed" ? new Date().toISOString().slice(0, 10) : null,
  }, { onConflict: "session_id,employee_id" });
  if (error) redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/sessions/${sessionId}?saved=1`);
}
