import Link from "next/link";
import { ArrowLeft, ArrowUpRight, CalendarPlus, CheckCircle2, CircleAlert, SlidersHorizontal } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { courses, departments } from "@/lib/demo/data";
import { getCourseOverview, getNextSessionCandidates } from "@/lib/demo/selectors";

export function generateStaticParams() { return courses.map((course) => ({ id: String(course.id) })); }

export default async function CourseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const courseId = Number(id);
  if (!courses.some((course) => course.id === courseId)) notFound();
  const row = getCourseOverview(courseId);
  const candidates = getNextSessionCandidates(courseId);
  return <div>
    <PageHeader title={row.course.name} description={`${row.course.code} · ${row.course.category}`} action={<Link href="/courses" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 과정 목록</Link>} />
    <div className="page-content space-y-6">
      <section className="course-detail-hero card"><div><div className="tag-row">{row.course.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><p>{row.course.description}</p><small>담당 {row.course.owner} · 유효기간 {row.course.validityMonths ? `${row.course.validityMonths}개월` : "무기한"}</small></div><div className="eligibility-box"><span><SlidersHorizontal size={16} /> 대상 조건</span><strong>{row.course.eligibilityLabel}</strong><button className="text-link">조건 미리보기·수정</button></div></section>
      {row.rate === null ? <div className="notice warning"><CircleAlert size={17} /><span>대상 조건이 없어 수료율을 산정하지 않습니다. 조건을 저장하면 예상 대상자를 먼저 확인할 수 있습니다.</span></div> : <section className="metric-grid three"><div className="metric-block"><small>현재 대상자</small><strong>{row.eligibleCount}<em>명</em></strong></div><div className="metric-block success"><small>수료자</small><strong>{row.completedCount}<em>명</em></strong></div><div className="metric-block warning"><small>미수료자 · 다음 차수 후보</small><strong>{row.incompleteCount}<em>명</em></strong></div></section>}
      {row.rate !== null && <div className="two-column wide-left">
        <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">BY DEPARTMENT</span><h2>부서별 수료 현황</h2></div><strong className="large-rate">{row.rate.toFixed(1)}%</strong></div><div className="course-stack">{row.departmentRows.map((departmentRow) => <div className="course-progress-row static" key={departmentRow.department.id}><div className="course-progress-copy"><strong>{departmentRow.department.name}</strong><small>미수료 {departmentRow.incompleteCount}명</small></div><div className="progress-cell"><div className="progress-meta"><span>{departmentRow.completedCount}/{departmentRow.eligibleCount}명</span><strong>{departmentRow.rate?.toFixed(1)}%</strong></div><div className="progress-track"><span style={{ width: `${departmentRow.rate ?? 0}%` }} /></div></div></div>)}</div></section>
        <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">NEXT COHORT</span><h2>다음 차수 후보</h2></div><CalendarPlus size={19} /></div><div className="candidate-list">{candidates.map((employee) => <Link href={`/employees/${employee.id}`} key={employee.id}><span className="avatar light">{employee.name.slice(-2)}</span><span><strong>{employee.name}</strong><small>{departments.find((department) => department.id === employee.departmentId)?.name} · {employee.position}</small></span></Link>)}</div><Link href="/sessions/202" className="outline-action">예정 차수에 배정 <ArrowUpRight size={14} /></Link></section>
      </div>}
      <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">SESSIONS</span><h2>차수별 운영 이력</h2></div><CheckCircle2 size={19} /></div><div className="session-list">{row.courseSessions.map((session) => <Link href={`/sessions/${session.id}`} key={session.id}><span><strong>{session.round}</strong><small>{session.startDate} — {session.endDate} · {session.instructor}</small></span><span className={`status-pill ${session.status === "마감" ? "success" : "info"}`}>{session.status}</span><ArrowUpRight size={15} /></Link>)}</div></section>
    </div>
  </div>;
}
