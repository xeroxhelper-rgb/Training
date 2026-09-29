"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSession } from "@/lib/repositories/session-repository";
import { validateSessionInput } from "@/lib/validation/training-admin";

export async function createSessionAction(formData: FormData) {
  const input = {
    courseId: Number(formData.get("course_id")),
    sessionNumber: Number(formData.get("session_number")),
    startsAt: String(formData.get("starts_at") ?? ""),
    endsAt: String(formData.get("ends_at") ?? ""),
    location: String(formData.get("location") ?? ""),
    instructorName: String(formData.get("instructor_name") ?? ""),
    capacity: String(formData.get("capacity") ?? "") ? Number(formData.get("capacity")) : null,
    status: String(formData.get("status") ?? "planned"),
  };
  const validation = validateSessionInput(input);
  if (!validation.success) redirect(`/sessions/new?error=${encodeURIComponent(validation.error.issues[0]?.message ?? "입력값을 확인해 주세요.")}`);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/sessions/new");
  try {
    const sessionId = await createSession(validation.data, data.user.id);
    redirect(`/sessions/${sessionId}?created=1`);
  } catch (error) {
    const message = error instanceof Error && error.message.includes("duplicate") ? "같은 과정의 차수 번호가 이미 존재합니다." : error instanceof Error ? error.message : "차수 개설에 실패했습니다.";
    redirect(`/sessions/new?error=${encodeURIComponent(message)}`);
  }
}
