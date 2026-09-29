import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getSessionDetail } from "@/lib/repositories/session-repository";
import { updateCompletionStatus } from "../actions";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const row = await getSessionDetail(Number(id)); if (!row) notFound();
  return <div><PageHeader title={`${row.courseName} · ${row.round}`} description={`${row.startsAt.slice(0, 10)} — ${row.endsAt.slice(0, 10)} · ${row.instructorName}`} action={<Link href="/sessions" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 차수 목록</Link>} />
    <div className="page-content space-y-6"><section className="session-hero card"><div><span className={`status-pill ${row.status === "마감" ? "success" : row.status === "예정" ? "info" : "warning"}`}>{row.status}</span><h2>{row.location}</h2><p>이 차수에 실제 배정된 참여자 기준으로 수료 현황을 집계합니다.</p></div><div className="session-metrics"><div><small>참여자</small><strong>{row.participantCount}명</strong></div><div><small>수료</small><strong>{row.completedCount}명</strong></div><div><small>차수 수료율</small><strong>{row.rate === null ? "-" : `${row.rate.toFixed(1)}%`}</strong></div></div></section>
      <section className="card table-card"><div className="section-heading panel-heading"><div><span className="eyebrow">PARTICIPANTS</span><h2>참여자 및 결과</h2><p className="muted">CSV 업로드 대신 직원별 결과를 직접 입력합니다.</p></div><CheckCircle2 size={19} /></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>부서</th><th>직급·직무</th><th>결과 입력</th></tr></thead><tbody>{row.participants.map((employee) => <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="font-semibold text-link">{employee.name}</Link><small className="table-sub">{employee.employeeNumber}</small></td><td>{employee.department}</td><td>{employee.position} · {employee.jobFunction}</td><td><form action={updateCompletionStatus} className="flex items-center gap-2"><input type="hidden" name="session_id" value={row.id} /><input type="hidden" name="employee_id" value={employee.id} /><select name="status" defaultValue={employee.result === "수료" ? "completed" : employee.result === "예정" ? "failed" : "failed"} aria-label={`${employee.name} 결과`}><option value="completed">수료</option><option value="failed">미수료</option><option value="absent">결석</option><option value="cancelled">취소</option></select><button className="btn-secondary" type="submit">저장</button></form></td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}
