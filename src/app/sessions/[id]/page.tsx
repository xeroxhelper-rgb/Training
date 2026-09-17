import Link from "next/link";
import { ArrowLeft, FileUp, UsersRound } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getSessionDetail } from "@/lib/repositories/session-repository";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const row = await getSessionDetail(Number(id)); if (!row) notFound();
  return <div><PageHeader title={`${row.courseName} · ${row.round}`} description={`${row.startsAt.slice(0, 10)} — ${row.endsAt.slice(0, 10)} · ${row.instructorName}`} action={<Link href="/sessions" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 차수 목록</Link>} />
    <div className="page-content space-y-6"><section className="session-hero card"><div><span className={`status-pill ${row.status === "마감" ? "success" : row.status === "예정" ? "info" : "warning"}`}>{row.status}</span><h2>{row.location}</h2><p>이 차수에 실제 배정된 참여자 기준으로 수료 현황을 집계합니다.</p></div><div className="session-metrics"><div><small>참여자</small><strong>{row.participantCount}명</strong></div><div><small>수료</small><strong>{row.completedCount}명</strong></div><div><small>차수 수료율</small><strong>{row.rate === null ? "-" : `${row.rate.toFixed(1)}%`}</strong></div></div></section>
      <section className="card table-card"><div className="section-heading panel-heading"><div><span className="eyebrow">PARTICIPANTS</span><h2>참여자 및 결과</h2></div><div className="flex gap-2"><button className="btn-secondary flex items-center gap-2"><UsersRound size={14} /> 참여자 편집</button><Link href={`/imports/completions?session=${row.id}`} className="btn-primary flex items-center gap-2"><FileUp size={14} /> 수료 CSV 반영</Link></div></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>부서</th><th>직급·직무</th><th>결과</th></tr></thead><tbody>{row.participants.map((employee) => <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="font-semibold text-link">{employee.name}</Link><small className="table-sub">{employee.employeeNumber}</small></td><td>{employee.department}</td><td>{employee.position} · {employee.jobFunction}</td><td><span className={`status-pill ${employee.result === "수료" ? "success" : employee.result === "예정" ? "info" : "warning"}`}>{employee.result}</span></td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}
