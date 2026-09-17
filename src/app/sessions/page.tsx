import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getSessionList, type SessionListItem } from "@/lib/repositories/session-repository";

export const dynamic = "force-dynamic";

export default async function SessionsPage() {
  let sessions: SessionListItem[] = []; let loadError = "";
  try { sessions = await getSessionList(); } catch (error) { loadError = error instanceof Error ? error.message : "교육 차수 정보를 불러오지 못했습니다."; }
  const closed = sessions.filter((session) => session.status === "마감").length;
  return <div><PageHeader title="교육 차수" description="실제 시행 단위의 일정, 참여자와 수료 결과를 관리합니다." action={<button className="btn-primary flex items-center gap-2"><Plus size={15} /> 차수 개설</button>} />
    <div className="page-content"><section className="card table-card">{loadError ? <div className="notice warning m-5">{loadError} Supabase의 training_sessions 권한과 0005 이후 스키마를 확인하세요.</div> : null}<div className="table-toolbar"><div><strong>전체 차수 {sessions.length}개</strong><span>마감 {closed}개</span></div><select aria-label="차수 상태"><option>전체 상태</option><option>예정</option><option>진행 중</option><option>마감</option></select></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>과정 / 차수</th><th>기간</th><th>강사</th><th>장소</th><th>참여</th><th>수료</th><th>상태</th><th></th></tr></thead><tbody>{sessions.map((session) => <tr key={session.id}><td><Link href={`/sessions/${session.id}`} className="stacked-link"><strong>{session.courseName}</strong><small>{session.round}</small></Link></td><td className="tabular">{session.startsAt.slice(0, 10)}<br />{session.endsAt.slice(0, 10)}</td><td>{session.instructorName}</td><td>{session.location}</td><td>{session.participantCount}명</td><td>{session.completedCount}명</td><td><span className={`status-pill ${session.status === "마감" ? "success" : session.status === "예정" ? "info" : "warning"}`}>{session.status}</span></td><td><Link aria-label={`${session.courseName} ${session.round} 상세`} href={`/sessions/${session.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table></div></section></div>
  </div>;
}
