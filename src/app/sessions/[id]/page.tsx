import Link from "next/link";
import { ArrowLeft, FileUp, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { departments, sessions } from "@/lib/demo/data";
import { getSessionOverview } from "@/lib/demo/selectors";

export function generateStaticParams() { return sessions.map((session) => ({ id: String(session.id) })); }

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const sessionId = Number(id);
  if (!sessions.some((session) => session.id === sessionId)) notFound();
  const row = getSessionOverview(sessionId);
  return <div><PageHeader title={`${row.course.name} · ${row.session.round}`} description={`${row.session.startDate} — ${row.session.endDate} · ${row.session.instructor}`} action={<Link href="/sessions" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 차수 목록</Link>} />
    <div className="page-content space-y-6"><section className="session-hero card"><div><span className={`status-pill ${row.session.status === "마감" ? "success" : row.session.status === "예정" ? "info" : "warning"}`}>{row.session.status}</span><h2>{row.session.mode}</h2><p>과정 수료 현황과 별도로, 이 차수에 실제 배정된 참여자 기준으로 집계합니다.</p></div><div className="session-metrics"><div><small>참여자</small><strong>{row.participantCount}명</strong></div><div><small>수료</small><strong>{row.completedCount}명</strong></div><div><small>차수 수료율</small><strong>{row.rate?.toFixed(1)}%</strong></div></div></section>
      <section className="card table-card"><div className="section-heading panel-heading"><div><span className="eyebrow">PARTICIPANTS</span><h2>참여자 및 결과</h2></div><div className="flex gap-2"><button className="btn-secondary flex items-center gap-2"><UsersRound size={14} /> 참여자 편집</button><Link href={`/imports/completions?session=${row.session.id}`} className="btn-primary flex items-center gap-2"><FileUp size={14} /> 수료 CSV 반영</Link></div></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>부서</th><th>직급·직무</th><th>과정 대상</th><th>결과</th></tr></thead><tbody>{row.participants.map((employee) => { const completed = row.session.completedEmployeeIds.includes(employee.id); return <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="font-semibold text-link">{employee.name}</Link><small className="table-sub">{employee.employeeNumber}</small></td><td>{departments.find((department) => department.id === employee.departmentId)?.name}</td><td>{employee.position} · {employee.jobFunction}</td><td><span className="status-pill neutral">대상</span></td><td><span className={`status-pill ${completed ? "success" : "warning"}`}>{completed ? "수료" : row.session.status === "예정" ? "예정" : "미수료"}</span></td></tr>; })}</tbody></table></div></section>
    </div>
  </div>;
}
