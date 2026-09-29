import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCourseOptions } from "@/lib/repositories/course-repository";
import { createSessionAction } from "./actions";

export const dynamic = "force-dynamic";

export default async function NewSessionPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, courses] = await Promise.all([searchParams, getCourseOptions()]);
  return <div><PageHeader title="차수 개설" description="교육 과정의 실제 시행 차수를 개설합니다." action={<Link href="/sessions" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 차수 목록</Link>} /><div className="page-content"><section className="card p-6">{error ? <div className="notice warning mb-5">{error}</div> : null}{courses.length === 0 ? <div className="notice warning">먼저 교육 과정을 등록해 주세요.</div> : <form action={createSessionAction} className="form-grid"><label>교육 과정<select name="course_id" required><option value="">과정 선택</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label><label>차수 번호<input type="number" name="session_number" min="1" defaultValue="1" required /></label><label>시작일<input type="date" name="starts_at" required /></label><label>종료일<input type="date" name="ends_at" required /></label><label>장소<input name="location" placeholder="예: 온라인" /></label><label>강사<input name="instructor_name" /></label><label>정원<input type="number" name="capacity" min="1" /></label><label>상태<select name="status" defaultValue="planned"><option value="planned">예정</option><option value="open">모집중</option><option value="closed">종료</option><option value="cancelled">취소</option></select></label><div className="flex gap-2 md:col-span-2"><button className="btn-primary" type="submit">차수 개설</button><Link href="/sessions" className="btn-secondary">취소</Link></div></form>}</section></div></div>;
}
