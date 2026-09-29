"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createCourse } from "@/lib/repositories/course-repository";
import { validateCourseInput } from "@/lib/validation/training-admin";

export async function createCourseAction(formData: FormData) {
  const input = {
    courseCode: String(formData.get("course_code") ?? ""),
    courseName: String(formData.get("course_name") ?? ""),
    targetModel: String(formData.get("target_model") ?? ""),
    description: String(formData.get("description") ?? ""),
    validityMonths: String(formData.get("validity_months") ?? "") ? Number(formData.get("validity_months")) : null,
    status: String(formData.get("status") ?? "draft"),
    thresholdPercent: Number(formData.get("threshold_percent") ?? 80),
  };
  const validation = validateCourseInput(input);
  if (!validation.success) redirect(`/courses/new?error=${encodeURIComponent(validation.error.issues[0]?.message ?? "입력값을 확인해 주세요.")}`);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login?next=/courses/new");
  try {
    await createCourse(validation.data, data.user.id);
  } catch (error) {
    const message = error instanceof Error && error.message.includes("duplicate") ? "이미 등록된 과정 코드입니다." : error instanceof Error ? error.message : "과정 등록에 실패했습니다.";
    redirect(`/courses/new?error=${encodeURIComponent(message)}`);
  }
  redirect("/courses?created=1");
}
