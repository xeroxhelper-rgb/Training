"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseCompletionCsv } from "@/lib/imports/completion-csv";

export async function importCompletionCsv(formData: FormData) {
  const sessionId = Number(formData.get("session_id"));
  const file = formData.get("file");
  if (!sessionId || !(file instanceof File) || file.size === 0) redirect(`/imports/completions?session=${sessionId}&error=파일을 선택하세요`);
  const rows = parseCompletionCsv(await file.text());
  const supabase = await createClient();
  const { data: session } = await supabase.from("training_sessions").select("session_id").eq("session_id", sessionId).maybeSingle();
  if (!session) redirect(`/imports/completions?session=${sessionId}&error=차수를 찾을 수 없습니다`);
  const numbers = rows.flatMap((row) => row.employeeNumber === null ? [] : [row.employeeNumber]);
  const { data: employees } = await supabase.from("employees").select("employee_id, employee_number").in("employee_number", numbers);
  const employeeMap = new Map((employees ?? []).map((employee) => [Number(employee.employee_number), Number(employee.employee_id)]));
  const validRows = rows.filter((row) => !row.error && row.employeeNumber !== null && employeeMap.has(row.employeeNumber));
  const { data: batch, error: batchError } = await supabase.from("import_batches").insert({ session_id: sessionId, file_name: file.name, row_count: rows.length, accepted_count: validRows.length, rejected_count: rows.length - validRows.length, status: "applied" }).select("import_batch_id").single();
  if (batchError || !batch) redirect(`/imports/completions?session=${sessionId}&error=${encodeURIComponent(batchError?.message ?? "업로드 기록 저장 실패")}`);
  await supabase.from("import_rows").insert(rows.map((row) => ({ import_batch_id: batch.import_batch_id, row_number: row.rowNumber, employee_number: row.employeeNumber, raw_data: row, normalized_data: row.error ? null : { employee_id: employeeMap.get(row.employeeNumber ?? 0), completion_date: row.completionDate, status: row.status }, error_code: row.error ? "VALIDATION" : null, error_message: row.error })));
  const completionRows = validRows.map((row) => ({ session_id: sessionId, employee_id: employeeMap.get(row.employeeNumber ?? 0), status: row.status, completion_date: row.status === "completed" ? row.completionDate : null }));
  if (completionRows.length) await supabase.from("course_completions").upsert(completionRows, { onConflict: "session_id,employee_id" });
  redirect(`/imports/completions?session=${sessionId}&imported=${validRows.length}`);
}
