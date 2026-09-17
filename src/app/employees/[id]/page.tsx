import Link from "next/link";
import { ArrowLeft, BriefcaseBusiness, CheckCircle2, CircleAlert, History } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { employees } from "@/lib/demo/data";
import { getEmployeeProfile } from "@/lib/demo/selectors";

export function generateStaticParams() { return employees.map((employee) => ({ id: String(employee.id) })); }

export default async function EmployeeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const employeeId = Number(id);
  if (!employees.some((employee) => employee.id === employeeId)) notFound();
  const profile = getEmployeeProfile(employeeId);
  return <div>
    <PageHeader title={profile.employee.name} description={`${profile.employee.employeeNumber} · ${profile.department.name}`} action={<Link href="/employees" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 직원 목록</Link>} />
    <div className="page-content space-y-6">
      <div className="notice"><CircleAlert size={16} /><span>교육 수료 이력은 실제 숙련도 또는 업무 적합성을 단독으로 보증하지 않습니다.</span></div>
      <section className="profile-hero card">
        <span className="profile-avatar">{profile.employee.name.slice(-2)}</span>
        <div className="profile-name"><div className="flex items-center gap-2"><h2>{profile.employee.name}</h2><StatusBadge status={profile.employee.status} /></div><p>{profile.employee.jobFunction} · {profile.employee.position}</p></div>
        <div className="profile-facts"><div><small>현재 부서</small><strong>{profile.department.name}</strong></div><div><small>입사일</small><strong>{profile.employee.hireDate}</strong></div><div><small>이메일</small><strong>{profile.employee.email}</strong></div></div>
      </section>
      <div className="two-column">
        <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">TRAINING</span><h2>교육 수료 이력</h2></div><CheckCircle2 size={19} /></div><div className="timeline-list">{profile.completions.map((completion) => <Link href={`/courses/${completion.courseId}`} className="timeline-item" key={completion.courseId}><span className="timeline-dot success" /><div><strong>{completion.courseName}</strong><p>{completion.round} · {completion.completionDate}</p><div className="tag-row">{completion.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></div></Link>)}</div></section>
        <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">REQUIRED</span><h2>현재 미수료 대상 과정</h2></div><CircleAlert size={19} /></div>{profile.incompleteCourses.length ? <div className="action-list">{profile.incompleteCourses.map((course) => <Link href={`/courses/${course.id}`} key={course.id}><span><strong>{course.name}</strong><small>{course.eligibilityLabel}</small></span><span className="status-pill warning">미수료</span></Link>)}</div> : <div className="empty-state">현재 미수료 대상 과정이 없습니다.</div>}</section>
      </div>
      <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">CAREER</span><h2>부서 근무 이력</h2></div><History size={19} /></div><div className="career-timeline">{profile.departmentHistory.map((history) => <div className="career-row" key={`${history.departmentId}-${history.startDate}`}><span className="career-icon"><BriefcaseBusiness size={16} /></span><div><strong>{history.departmentName}</strong><p>{history.position} · {history.reason}</p></div><time>{history.startDate} — {history.endDate ?? "현재"}</time></div>)}</div></section>
    </div>
  </div>;
}
