"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getChangedCompletionRows, type CompletionRow } from "@/lib/completions/changed-rows";

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

export async function saveCompletionStatuses(formData: FormData) {
  const sessionId = Number(formData.get("session_id"));
  const employeeIds = formData.getAll("employee_id").map(Number).filter(Boolean);
  const completedIds = new Set(formData.getAll("completed_employee_id").map(Number));
  if (!sessionId || employeeIds.length === 0) redirect(`/sessions/${sessionId}?error=저장할 참여자가 없습니다`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/sessions/${sessionId}`);
  const today = new Date().toISOString().slice(0, 10);
  const submittedRows: CompletionRow[] = employeeIds.map((employeeId) => ({ employee_id: employeeId, status: completedIds.has(employeeId) ? "completed" : "failed", completion_date: completedIds.has(employeeId) ? today : null }));
  const { data: existingRows, error: existingError } = await supabase.from("course_completions").select("employee_id, status, completion_date").eq("session_id", sessionId).in("employee_id", employeeIds);
  if (existingError) redirect(`/sessions/${sessionId}?error=${encodeURIComponent(existingError.message)}`);
  const changedRows = getChangedCompletionRows(submittedRows, (existingRows ?? []).map((row) => ({ employee_id: Number(row.employee_id), status: row.status, completion_date: row.completion_date })));
  if (changedRows.length === 0) redirect(`/sessions?saved=0`);
  const { error } = await supabase.from("course_completions").upsert(
    changedRows.map((row) => ({ session_id: sessionId, ...row })),
    { onConflict: "session_id,employee_id" },
  );
  if (error) redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/sessions?saved=${changedRows.length}`);
}

export async function removeParticipant(formData: FormData) {
  const sessionId = Number(formData.get("session_id"));
  const employeeId = Number(formData.get("remove_employee_id"));
  if (!sessionId || !employeeId) redirect(`/sessions/${sessionId}?error=삭제할 참여자가 없습니다`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/login?next=/sessions/${sessionId}`);
  const { error: completionError } = await supabase.from("course_completions").delete().eq("session_id", sessionId).eq("employee_id", employeeId);
  if (completionError) redirect(`/sessions/${sessionId}?error=${encodeURIComponent(completionError.message)}`);
  const { error } = await supabase.from("session_participants").delete().eq("session_id", sessionId).eq("employee_id", employeeId);
  if (error) redirect(`/sessions/${sessionId}?error=${encodeURIComponent(error.message)}`);
  redirect(`/sessions/${sessionId}?removed=1`);
}
