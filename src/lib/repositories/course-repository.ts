import "server-only";

import { createClient } from "@/lib/supabase/server";

export type CourseSummary = {
  targetCount: number;
  completedCount: number;
  incompleteCount: number;
  completionRate: number;
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
