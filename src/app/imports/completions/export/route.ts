import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { serializeCompletionBackup, type CompletionBackupFilters, type CompletionBackupRow } from "@/lib/imports/completion-backup";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  const url = new URL(request.url);
  const filters: CompletionBackupFilters = {
    department: url.searchParams.get("department") || undefined,
    courseId: Number(url.searchParams.get("course_id")) || undefined,
    employeeNumber: Number(url.searchParams.get("employee_number")) || undefined,
    sessionId: Number(url.searchParams.get("session_id")) || undefined,
  };
  let sessionQuery = supabase.from("training_sessions").select("session_id, course_id, session_number").order("session_id");
  if (filters.sessionId) sessionQuery = sessionQuery.eq("session_id", filters.sessionId);
  if (filters.courseId) sessionQuery = sessionQuery.eq("course_id", filters.courseId);
  const { data: sessions, error: sessionError } = await sessionQuery;
  if (sessionError) return NextResponse.json({ error: sessionError.message }, { status: 500 });
  const sessionIds = (sessions ?? []).map((session) => Number(session.session_id));
  if (!sessionIds.length) return csvResponse("");
  const [{ data: completions, error: completionError }, { data: courses, error: courseError }] = await Promise.all([
    supabase.from("course_completions").select("session_id, employee_id, status, completion_date").in("session_id", sessionIds).is("cancelled_at", null),
    supabase.from("training_courses").select("course_id, course_code, course_name").in("course_id", (sessions ?? []).map((session) => session.course_id)),
  ]);
  if (completionError || courseError) return NextResponse.json({ error: completionError?.message ?? courseError?.message }, { status: 500 });
  const employeeIds = Array.from(new Set((completions ?? []).map((row) => row.employee_id)));
  if (!employeeIds.length) return csvResponse("");
  let employeeQuery = supabase.from("employees").select("employee_id, employee_number, name, svc_team").in("employee_id", employeeIds);
  if (filters.employeeNumber) employeeQuery = employeeQuery.eq("employee_number", filters.employeeNumber);
  const { data: employees, error: employeeError } = await employeeQuery;
  if (employeeError) return NextResponse.json({ error: employeeError.message }, { status: 500 });
  const employeeMap = new Map((employees ?? []).map((employee) => [Number(employee.employee_id), employee]));
  const courseMap = new Map((courses ?? []).map((course) => [Number(course.course_id), course]));
  const sessionMap = new Map((sessions ?? []).map((session) => [Number(session.session_id), session]));
  const rows: CompletionBackupRow[] = (completions ?? []).flatMap((completion) => {
    const employee = employeeMap.get(Number(completion.employee_id));
    const session = sessionMap.get(Number(completion.session_id));
    const course = session ? courseMap.get(Number(session.course_id)) : null;
    if (!employee || !session || !course || (filters.department && employee.svc_team !== filters.department)) return [];
    return [{ employeeNumber: Number(employee.employee_number), employeeName: employee.name, departmentName: employee.svc_team ?? "", courseCode: course.course_code, courseName: course.course_name, sessionId: Number(session.session_id), sessionNumber: Number(session.session_number), status: completion.status, completionDate: completion.completion_date }];
  });
  return csvResponse(serializeCompletionBackup(rows));
}

function csvResponse(csv: string) {
  return new NextResponse(`\uFEFF${csv}`, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="completion-backup-${new Date().toISOString().slice(0, 10)}.csv"` } });
}
