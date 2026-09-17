import Link from "next/link";
import { ArrowUpRight, CalendarClock, CircleAlert, UsersRound } from "lucide-react";
import FlowOverview from "@/components/dashboard/FlowOverview";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import { courses, departments, employees, sessions } from "@/lib/demo/data";
import { getCourseOverview, getDepartmentOverview } from "@/lib/demo/selectors";

export default function DashboardPage() {
  const activeEmployees = employees.filter((employee) => employee.status !== "퇴사");
  const courseRows = courses.map((course) => getCourseOverview(course.id));
  const configured = courseRows.filter((row) => row.rate !== null);
  const totalEligible = configured.reduce((sum, row) => sum + row.eligibleCount, 0);
  const totalCompleted = configured.reduce((sum, row) => sum + row.completedCount, 0);
  const overallRate = totalEligible ? Math.round((totalCompleted / totalEligible) * 1000) / 10 : 0;
  const upcoming = sessions.filter((session) => session.status === "예정");

  return (
    <div>
      <PageHeader title="기술교육 운영 현황" description="현재 재직자와 과정별 대상 조건을 기준으로 오늘의 현황을 보여줍니다." action={<Link className="btn-primary" href="/courses/101">미수료자 확인</Link>} />
      <div className="page-content space-y-7">
        <FlowOverview />
        <section className="metric-grid" aria-label="핵심 지표">
          <StatCard label="현재 관리 인원" value={activeEmployees.length} suffix="명" tone="primary" sub="재직 8명 · 휴직 1명" />
          <StatCard label="전체 과정 수료율" value={overallRate.toFixed(1)} suffix="%" tone="green" sub={`${totalCompleted}/${totalEligible} 과정-직원 기준`} />
          <StatCard label="현재 미수료 건" value={totalEligible - totalCompleted} suffix="건" tone="amber" sub="다음 차수 후보 산정 대상" />
          <StatCard label="예정 교육 차수" value={upcoming.length} suffix="개" sub="가장 가까운 일정 10.20" />
        </section>
        <div className="dashboard-grid">
          <section className="card panel-span-2">
            <div className="section-heading panel-heading"><div><span className="eyebrow">COURSES</span><h2>과정별 현재 이수 현황</h2></div><Link href="/courses" className="text-link">전체 과정 <ArrowUpRight size={14} /></Link></div>
            <div className="course-stack">
              {courseRows.map((row) => <Link className="course-progress-row" href={`/courses/${row.course.id}`} key={row.course.id}>
                <div className="course-progress-copy"><span className="course-code">{row.course.code}</span><strong>{row.course.name}</strong><small>{row.course.eligibilityLabel}</small></div>
                <div className="progress-cell">
                  {row.rate === null ? <span className="status-pill warning"><CircleAlert size={13} /> 대상 조건 미설정</span> : <><div className="progress-meta"><span>{row.completedCount}/{row.eligibleCount}명</span><strong>{row.rate.toFixed(1)}%</strong></div><div className="progress-track"><span style={{ width: `${row.rate}%` }} /></div></>}
                </div>
              </Link>)}
            </div>
          </section>
          <section className="card">
            <div className="section-heading panel-heading"><div><span className="eyebrow">NEXT ACTION</span><h2>다가오는 교육</h2></div><CalendarClock size={19} /></div>
            {upcoming.map((session) => { const course = courses.find((item) => item.id === session.courseId)!; return <Link href={`/sessions/${session.id}`} className="upcoming-card" key={session.id}><span className="date-box"><strong>20</strong><small>OCT</small></span><span><strong>{course.name}</strong><small>{session.round} · {session.participantIds.length}명 배정</small></span></Link>; })}
            <Link className="outline-action" href="/sessions">차수 운영 흐름 보기 <ArrowUpRight size={14} /></Link>
          </section>
        </div>
        <section className="card">
          <div className="section-heading panel-heading"><div><span className="eyebrow">DEPARTMENTS</span><h2>부서별 교육 준비도</h2></div><span className="muted-note"><UsersRound size={14} /> 현재 소속 기준</span></div>
          <div className="department-grid">
            {departments.map((department) => { const row = getDepartmentOverview(department.id); return <div className="department-card" key={department.id}><div className="department-top"><span className="dept-icon">{department.code.slice(0, 1)}</span><div><strong>{department.name}</strong><small>{row.employeeCount}명</small></div><b>{row.rate?.toFixed(1)}%</b></div><div className="progress-track"><span style={{ width: `${row.rate ?? 0}%` }} /></div><p>완료 {row.completedCount} · 미수료 {row.incompleteCount}</p></div>; })}
          </div>
        </section>
      </div>
    </div>
  );
}
