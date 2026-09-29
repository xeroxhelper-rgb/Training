"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCompletionCsv } from "@/lib/imports/completion-csv";
import { applyCompletionBackup, matchesCompletionBackupFilters, parseCompletionBackup, type CompletionBackupFilters } from "@/lib/imports/completion-backup";
import { getChangedCompletionRows, type CompletionRow } from "@/lib/completions/changed-rows";

export async function importCompletionCsv(formData: FormData) {
  const sessionId = Number(formData.get("session_id"));
  const file = formData.get("file");
  if (!sessionId || !(file instanceof File) || file.size === 0) redirect(`/imports/completions?session=${sessionId}&error=파일을 선택하세요`);
  const rows = parseCompletionCsv(await file.text());
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect(`/imports/completions?session=${sessionId}&error=업로드 세션이 없습니다. 로그아웃 후 다시 로그인하세요.`);
  const { data: session } = await supabase.from("training_sessions").select("session_id").eq("session_id", sessionId).maybeSingle();
  if (!session) redirect(`/imports/completions?session=${sessionId}&error=차수를 찾을 수 없습니다`);
  const numbers = rows.flatMap((row) => row.employeeNumber === null ? [] : [row.employeeNumber]);
  const { data: employees } = await supabase.from("employees").select("employee_id, employee_number").in("employee_number", numbers);
  const employeeMap = new Map((employees ?? []).map((employee) => [Number(employee.employee_number), Number(employee.employee_id)]));
  const validRows = rows.filter((row) => !row.error && row.employeeNumber !== null && employeeMap.has(row.employeeNumber));
  const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ session_id: sessionId, file_name: file.name, row_count: rows.length, accepted_count: validRows.length, rejected_count: rows.length - validRows.length, status: "applied" }).select("import_batch_id").single();
  if (batchError || !batch) redirect(`/imports/completions?session=${sessionId}&error=${encodeURIComponent(batchError?.message ?? "업로드 기록 저장 실패")}`);
  const { error: rowsError } = await supabase.from("import_rows").insert(rows.map((row) => ({ import_batch_id: batch.import_batch_id, row_number: row.rowNumber, employee_number: row.employeeNumber, raw_data: row, normalized_data: row.error ? null : { employee_id: employeeMap.get(row.employeeNumber ?? 0), completion_date: row.completionDate, status: row.status }, error_code: row.error ? "VALIDATION" : null, error_message: row.error })));
  if (rowsError) redirect(`/imports/completions?session=${sessionId}&error=${encodeURIComponent(rowsError.message)}`);
  const submittedRows: CompletionRow[] = validRows.flatMap((row) => {
    const employeeId = employeeMap.get(row.employeeNumber ?? 0);
    return employeeId ? [{ employee_id: employeeId, status: row.status, completion_date: row.status === "completed" ? row.completionDate : null }] : [];
  });
  const employeeIds = Array.from(new Set(submittedRows.map((row) => row.employee_id)));
  const { data: existingRows, error: existingError } = employeeIds.length
    ? await supabase.from("course_completions").select("employee_id, status, completion_date").eq("session_id", sessionId).in("employee_id", employeeIds)
    : { data: [], error: null };
  if (existingError) redirect(`/imports/completions?session=${sessionId}&error=${encodeURIComponent(existingError.message)}`);
  const changedRows = getChangedCompletionRows(submittedRows, (existingRows ?? []).map((row) => ({ employee_id: Number(row.employee_id), status: row.status, completion_date: row.completion_date })));
  if (changedRows.length) {
    const { error: completionError } = await supabase.from("course_completions").upsert(changedRows.map((row) => ({ session_id: sessionId, ...row })), { onConflict: "session_id,employee_id" });
    if (completionError) redirect(`/imports/completions?session=${sessionId}&error=${encodeURIComponent(completionError.message)}`);
  }
  redirect(`/imports/completions?session=${sessionId}&imported=${validRows.length}`);
}

export async function importCompletionBackup(formData: FormData) {
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) redirect("/imports/completions?error=파일을 선택하세요");
  const parsed = parseCompletionBackup(await file.text());
  if (!parsed.rows.length && parsed.errors.length) redirect(`/imports/completions?error=${encodeURIComponent(parsed.errors.join(" "))}`);
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  if (!authData.user) redirect("/login?next=/imports/completions");
  const filters: CompletionBackupFilters = {
    department: String(formData.get("department") ?? "") || undefined,
    courseId: Number(formData.get("course_id")) || undefined,
    employeeNumber: Number(formData.get("employee_number")) || undefined,
    sessionId: Number(formData.get("session_id")) || undefined,
  };
  const numbers = Array.from(new Set(parsed.rows.map((row) => row.employeeNumber)));
  const sessionIds = Array.from(new Set(parsed.rows.map((row) => row.sessionId)));
  const [{ data: employees }, { data: sessions }] = await Promise.all([
    supabase.from("employees").select("employee_id, employee_number, svc_team").in("employee_number", numbers),
    supabase.from("training_sessions").select("session_id, course_id, session_number").in("session_id", sessionIds),
  ]);
  const employeeMap = new Map((employees ?? []).map((row) => [Number(row.employee_number), { id: Number(row.employee_id), department: row.svc_team ?? "" }]));
  const sessionMap = new Map((sessions ?? []).map((row) => [Number(row.session_id), row]));
  const rejected = [...parsed.errors];
  const valid = parsed.rows.flatMap((row) => {
    const employee = employeeMap.get(row.employeeNumber);
    const session = sessionMap.get(row.sessionId);
    if (!employee) { rejected.push(`${row.employeeNumber}번 직원이 없습니다.`); return []; }
    if (!session) { rejected.push(`${row.sessionId}번 차수가 없습니다.`); return []; }
    if (!matchesCompletionBackupFilters(row, filters, { courseId: Number(session.course_id) }) || (filters.department && employee.department !== filters.department)) { rejected.push(`${row.employeeNumber}번 행이 선택한 가져오기 조건과 다릅니다.`); return []; }
    return [{ row, employeeId: employee.id }];
  });
  let applied = 0;
  for (const [sessionId, grouped] of Map.groupBy(valid, (item) => item.row.sessionId)) {
    const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ session_id: sessionId, file_name: file.name, row_count: grouped.length, accepted_count: grouped.length, rejected_count: 0, status: "applied", created_by: authData.user.id }).select("import_batch_id").single();
    if (batchError || !batch) redirect(`/imports/completions?error=${encodeURIComponent(batchError?.message ?? "업로드 기록 저장 실패")}`);
    const { error: rowsError } = await supabase.from("import_rows").insert(grouped.map(({ row, employeeId }, index) => ({ import_batch_id: batch.import_batch_id, row_number: index + 2, employee_number: row.employeeNumber, raw_data: row, normalized_data: { employee_id: employeeId, completion_date: row.completionDate, status: row.status } })));
    if (rowsError) redirect(`/imports/completions?error=${encodeURIComponent(rowsError.message)}`);
    const employeeIds = grouped.map((item) => item.employeeId);
    const { data: existingRows, error: existingError } = await supabase.from("course_completions").select("employee_id, status, completion_date").eq("session_id", sessionId).in("employee_id", employeeIds);
    if (existingError) redirect(`/imports/completions?error=${encodeURIComponent(existingError.message)}`);
    const changedRows = applyCompletionBackup(grouped.map(({ row, employeeId }) => ({ employee_id: employeeId, status: row.status, completion_date: row.status === "completed" ? row.completionDate : null })), (existingRows ?? []).map((row) => ({ employee_id: Number(row.employee_id), status: row.status, completion_date: row.completion_date })));
    if (changedRows.length) {
      const { error: completionError } = await supabase.from("course_completions").upsert(changedRows.map((row) => ({ session_id: sessionId, ...row, created_by: authData.user.id })), { onConflict: "session_id,employee_id" });
      if (completionError) redirect(`/imports/completions?error=${encodeURIComponent(completionError.message)}`);
      applied += changedRows.length;
    }
  }
  redirect(`/imports/completions?imported=${applied}&rejected=${rejected.length}`);
}
