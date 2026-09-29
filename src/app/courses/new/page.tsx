import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { createCourseAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewCoursePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return <div><PageHeader title="과정 등록" description="반복 운영되는 교육 과정을 등록합니다." action={<Link href="/courses" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 과정 목록</Link>} /><div className="page-content"><section className="card p-6">{error ? <div className="notice warning mb-5">{error}</div> : null}<form action={createCourseAction} className="form-grid"><label>과정 코드<input name="course_code" placeholder="예: SEC-001" required /></label><label>과정명<input name="course_name" required /></label><label>대상 모델<input name="target_model" placeholder="예: 전 직원" /></label><label>유효기간(개월)<input type="number" name="validity_months" min="1" /></label><label>상태<select name="status" defaultValue="draft"><option value="draft">초안</option><option value="active">활성</option><option value="archived">보관</option></select></label><label>수료 기준률(%)<input type="number" name="threshold_percent" min="0" max="100" defaultValue="80" required /></label><label className="md:col-span-2">과정 설명<textarea name="description" rows={4} /></label><div className="flex gap-2 md:col-span-2"><button className="btn-primary" type="submit">과정 등록</button><Link href="/courses" className="btn-secondary">취소</Link></div></form></section></div></div>;
}
