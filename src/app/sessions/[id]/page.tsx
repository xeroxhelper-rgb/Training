import Link from "next/link";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { notFound } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { getSessionDetail } from "@/lib/repositories/session-repository";
import { saveCompletionStatuses } from "../actions";

export const dynamic = "force-dynamic";

export default async function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const row = await getSessionDetail(Number(id)); if (!row) notFound();
  return <div><PageHeader title={`${row.courseName} · ${row.round}`} description={`${row.startsAt.slice(0, 10)} — ${row.endsAt.slice(0, 10)} · ${row.instructorName}`} action={<Link href="/sessions" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 차수 목록</Link>} />
    <div className="page-content space-y-6"><section className="session-hero card"><div><span className={`status-pill ${row.status === "마감" ? "success" : row.status === "예정" ? "info" : "warning"}`}>{row.status}</span><h2>{row.location}</h2><p>이 차수에 실제 배정된 참여자 기준으로 수료 현황을 집계합니다.</p></div><div className="session-metrics"><div><small>참여자</small><strong>{row.participantCount}명</strong></div><div><small>수료</small><strong>{row.completedCount}명</strong></div><div><small>차수 수료율</small><strong>{row.rate === null ? "-" : `${row.rate.toFixed(1)}%`}</strong></div></div></section>
      <section className="card table-card"><form action={saveCompletionStatuses}><div className="section-heading panel-heading"><div><span className="eyebrow">PARTICIPANTS</span><h2>참여자 및 결과</h2><p className="muted">토글을 변경한 뒤 상단 저장 버튼으로 일괄 반영합니다.</p></div><div className="flex items-center gap-3"><CheckCircle2 size={19} /><button className="btn-primary" type="submit">전체 저장</button></div></div><input type="hidden" name="session_id" value={row.id} /><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>부서</th><th>직급·직무</th><th>수료 여부</th></tr></thead><tbody>{row.participants.map((employee) => <tr key={employee.id}><td><input type="hidden" name="employee_id" value={employee.id} /><Link href={`/employees/${employee.id}`} className="font-semibold text-link">{employee.name}</Link><small className="table-sub">{employee.employeeNumber}</small></td><td>{employee.department}</td><td>{employee.position} · {employee.jobFunction}</td><td><label className="inline-flex cursor-pointer items-center gap-3"><input type="checkbox" name="completed_employee_id" value={employee.id} defaultChecked={employee.result === "수료"} className="peer sr-only" /><span className="relative h-7 w-14 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-7" /><span className="text-sm font-medium peer-checked:text-emerald-700">{employee.result === "수료" ? "수료" : "미수료"}</span></label></td></tr>)}</tbody></table></div></form></section>
    </div>
  </div>;
}
