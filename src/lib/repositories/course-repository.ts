import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CourseSummary = {
  targetCount: number;
  completedCount: number;
  incompleteCount: number;
  completionRate: number;
};

export type CourseListItem = {
  id: number;
  code: string;
  name: string;
  description: string;
  targetModel: string;
  status: "운영 중" | "중단" | "종료";
  validityMonths: number | null;
  summary: CourseSummary;
};

export async function getCourseSummary(courseId: number, asOf: string, departmentId?: number): Promise<CourseSummary> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("course_completion_summary", {
    p_course_id: courseId,
    p_as_of: asOf,
    p_department_id: departmentId ?? null,
  });
  if (error) throw new Error(`교육 수료율을 불러오지 못했습니다: ${error.message}`);
  const row = Array.isArray(data) ? data[0] : data;
  return {
    targetCount: Number(row?.target_count ?? 0),
    completedCount: Number(row?.completed_count ?? 0),
    incompleteCount: Number(row?.incomplete_count ?? 0),
    completionRate: Number(row?.completion_rate ?? 0),
  };
}

function mapStatus(status: string | null, isActive: boolean): CourseListItem["status"] {
  if (status === "archived") return "종료";
  if (status === "draft" || !isActive) return "중단";
  return "운영 중";
}

export async function getCourseList(asOf = new Date().toISOString().slice(0, 10)): Promise<CourseListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("training_courses")
    .select("course_id, course_code, course_name, target_model, description, is_active, status, validity_months")
    .order("course_id");
  if (error) throw new Error(`교육 과정 정보를 불러오지 못했습니다: ${error.message}`);
  return Promise.all((data ?? []).map(async (course) => ({
    id: Number(course.course_id),
    code: course.course_code ?? `COURSE-${course.course_id}`,
    name: course.course_name,
    description: course.description ?? "설명이 등록되지 않았습니다.",
    targetModel: course.target_model ?? "대상 조건 미설정",
    status: mapStatus(course.status, course.is_active),
    validityMonths: course.validity_months,
    summary: await getCourseSummary(Number(course.course_id), asOf),
  })));
}
