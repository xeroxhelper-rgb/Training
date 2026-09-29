import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SessionInput } from "@/lib/validation/training-admin";

export type SessionListItem = {
  id: number; courseId: number; courseName: string; round: string; startsAt: string; endsAt: string;
  instructorName: string; location: string; status: "예정" | "진행 중" | "마감" | "취소";
  participantCount: number; completedCount: number; rate: number | null;
};

export type SessionParticipant = { id: number; name: string; employeeNumber: number; department: string; position: string; jobFunction: string; result: "수료" | "미수료" | "예정" };
export type SessionDetail = SessionListItem & { participants: SessionParticipant[] };

export async function createSession(input: SessionInput, createdBy: string | null = null): Promise<number> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_sessions")
    .insert({
      course_id: input.courseId,
      session_number: input.sessionNumber,
      starts_at: input.startsAt,
      ends_at: input.endsAt,
      location: input.location || null,
      instructor_name: input.instructorName || null,
      status: input.status,
      capacity: input.capacity ?? null,
      created_by: createdBy,
    })
    .select("session_id")
    .single();
  if (error) throw new Error(`교육 차수 개설에 실패했습니다: ${error.message}`);
  return Number(data.session_id);
}

function statusLabel(status: string): SessionListItem["status"] {
  if (status === "closed") return "마감";
  if (status === "cancelled") return "취소";
  if (status === "open") return "진행 중";
  return "예정";
}

export async function getSessionList(): Promise<SessionListItem[]> {
  const supabase = await createClient();
  const [{ data: sessions, error }, { data: courses, error: courseError }] = await Promise.all([
    supabase.from("training_sessions").select("session_id, course_id, session_number, starts_at, ends_at, location, instructor_name, status").order("starts_at", { ascending: false }),
    supabase.from("training_courses").select("course_id, course_name"),
  ]);
  if (error) throw new Error(`교육 차수 정보를 불러오지 못했습니다: ${error.message}`);
  if (courseError) throw new Error(`교육 과정 정보를 불러오지 못했습니다: ${courseError.message}`);
  const courseNames = new Map((courses ?? []).map((course) => [Number(course.course_id), course.course_name]));
  const sessionIds = (sessions ?? []).map((session) => session.session_id);
  if (sessionIds.length === 0) return [];
  const [{ data: participants, error: participantsError }, { data: completions, error: completionsError }] = await Promise.all([
    supabase.from("session_participants").select("session_id, employee_id").in("session_id", sessionIds),
    supabase.from("course_completions").select("session_id, employee_id").in("session_id", sessionIds).eq("status", "completed").is("cancelled_at", null),
  ]);
  if (participantsError) throw new Error(`참여자 정보를 불러오지 못했습니다: ${participantsError.message}`);
  if (completionsError) throw new Error(`수료 결과를 불러오지 못했습니다: ${completionsError.message}`);
  const participantCounts = new Map<number, number>();
  for (const participant of participants ?? []) {
    const sessionId = Number(participant.session_id);
    participantCounts.set(sessionId, (participantCounts.get(sessionId) ?? 0) + 1);
  }
  const completedBySession = new Map<number, Set<number>>();
  for (const completion of completions ?? []) {
    const sessionId = Number(completion.session_id);
    const employeeIds = completedBySession.get(sessionId) ?? new Set<number>();
    employeeIds.add(Number(completion.employee_id));
    completedBySession.set(sessionId, employeeIds);
  }
  return (sessions ?? []).map((session) => {
    const sessionId = Number(session.session_id);
    const participantCount = participantCounts.get(sessionId) ?? 0;
    const completedCount = completedBySession.get(sessionId)?.size ?? 0;
    return { id: sessionId, courseId: Number(session.course_id), courseName: courseNames.get(Number(session.course_id)) ?? "알 수 없는 과정", round: `${session.session_number}차`, startsAt: session.starts_at, endsAt: session.ends_at, instructorName: session.instructor_name ?? "미정", location: session.location ?? "미정", status: statusLabel(session.status), participantCount, completedCount, rate: participantCount ? Math.round(completedCount / participantCount * 1000) / 10 : null };
  });
}

export async function getSessionDetail(sessionId: number): Promise<SessionDetail | null> {
  const supabase = await createClient();
  const { data: session, error } = await supabase.from("training_sessions").select("session_id, course_id, session_number, starts_at, ends_at, location, instructor_name, status").eq("session_id", sessionId).maybeSingle();
  if (error) throw new Error(`교육 차수 정보를 불러오지 못했습니다: ${error.message}`);
  if (!session) return null;
  const [{ data: course }, { data: participants }, { data: completions }] = await Promise.all([
    supabase.from("training_courses").select("course_id, course_name").eq("course_id", session.course_id).maybeSingle(),
    supabase.from("session_participants").select("employee_id").eq("session_id", sessionId),
    supabase.from("course_completions").select("employee_id, status").eq("session_id", sessionId).is("cancelled_at", null),
  ]);
  const participantIds = (participants ?? []).map((item) => item.employee_id);
  const { data: employees } = participantIds.length === 0
    ? { data: [] }
    : await supabase.from("employees").select("employee_id, name, employee_number, position, job_function, svc_team").in("employee_id", participantIds);
  const completed = new Set((completions ?? []).filter((item) => item.status === "completed").map((item) => item.employee_id));
  const employeeMap = new Map((employees ?? []).map((employee) => [employee.employee_id, employee]));
  const detailParticipants = (participants ?? []).flatMap((item) => { const employee = employeeMap.get(item.employee_id); if (!employee) return []; return [{ id: Number(employee.employee_id), name: employee.name, employeeNumber: Number(employee.employee_number), department: employee.svc_team ?? "미지정", position: employee.position ?? "미지정", jobFunction: employee.job_function ?? "미지정", result: completed.has(item.employee_id) ? "수료" as const : statusLabel(session.status) === "예정" ? "예정" as const : "미수료" as const }]; });
  const participantCount = detailParticipants.length; const completedCount = detailParticipants.filter((item) => item.result === "수료").length;
  return { id: Number(session.session_id), courseId: Number(session.course_id), courseName: course?.course_name ?? "알 수 없는 과정", round: `${session.session_number}차`, startsAt: session.starts_at, endsAt: session.ends_at, instructorName: session.instructor_name ?? "미정", location: session.location ?? "미정", status: statusLabel(session.status), participantCount, completedCount, rate: participantCount ? Math.round(completedCount / participantCount * 1000) / 10 : null, participants: detailParticipants };
}
