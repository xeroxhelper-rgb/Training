import Link from "next/link";
import { ArrowLeft, CircleAlert, SlidersHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getCourseList } from "@/lib/repositories/course-repository";

export const dynamic = "force-dynamic";

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const course = (await getCourseList()).find((item) => item.id === Number(id));
  if (!course) notFound();
  const summary = course.summary;
  return <div>
    <PageHeader title={course.name} description={`${course.code} · Supabase 실시간 과정 정보`} action={<Link href="/courses" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 과정 목록</Link>} />
    <div className="page-content space-y-6">
      <section className="course-detail-hero card"><div><div className="tag-row"><span className="tag">{course.targetModel}</span>{course.validityMonths ? <span className="tag">유효기간 {course.validityMonths}개월</span> : null}</div><p>{course.description}</p><small>상태: {course.status}</small></div><div className="eligibility-box"><span><SlidersHorizontal size={16} /> 대상 조건</span><strong>{summary.targetCount > 0 ? "조건에 따라 자동 산정" : "대상 조건 미설정"}</strong><span className="text-link">관리 기능은 다음 단계에서 연결합니다.</span></div></section>
      {summary.targetCount === 0 ? <div className="notice warning"><CircleAlert size={17} /><span>현재 대상자가 없습니다. Supabase의 규칙 그룹 또는 기존 training_targets 데이터를 확인하세요.</span></div> : <section className="metric-grid three"><div className="metric-block"><small>현재 대상자</small><strong>{summary.targetCount}<em>명</em></strong></div><div className="metric-block success"><small>수료자</small><strong>{summary.completedCount}<em>명</em></strong></div><div className="metric-block warning"><small>미수료자 · 다음 차수 후보</small><strong>{summary.incompleteCount}<em>명</em></strong></div></section>}
      <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">COMPLETION SUMMARY</span><h2>누적 수료율</h2></div><strong className="large-rate">{summary.completionRate.toFixed(1)}%</strong></div><div className="progress-track"><span style={{ width: `${summary.completionRate}%` }} /></div><p className="muted mt-3">대상자 {summary.targetCount}명 중 {summary.completedCount}명이 수료했습니다.</p></section>
    </div>
  </div>;
}
