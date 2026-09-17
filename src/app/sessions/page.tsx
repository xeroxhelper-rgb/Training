import Link from "next/link";
import { ArrowUpRight, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { courses, sessions } from "@/lib/demo/data";
import { getSessionOverview } from "@/lib/demo/selectors";

export default function SessionsPage() {
  return <div><PageHeader title="교육 차수" description="실제 시행 단위의 일정, 참여자와 수료 결과를 관리합니다." action={<button className="btn-primary flex items-center gap-2"><Plus size={15} /> 차수 개설</button>} />
    <div className="page-content"><section className="card table-card"><div className="table-toolbar"><div><strong>전체 차수 {sessions.length}개</strong><span>예정 1 · 결과 입력 1 · 마감 2</span></div><select><option>전체 상태</option><option>예정</option><option>결과 입력</option><option>마감</option></select></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>과정 / 차수</th><th>기간</th><th>강사</th><th>진행 방식</th><th>참여</th><th>수료</th><th>상태</th><th></th></tr></thead><tbody>{sessions.map((session) => { const course = courses.find((item) => item.id === session.courseId)!; const overview = getSessionOverview(session.id); return <tr key={session.id}><td><Link href={`/sessions/${session.id}`} className="stacked-link"><strong>{course.name}</strong><small>{session.round}</small></Link></td><td className="tabular">{session.startDate}<br />{session.endDate}</td><td>{session.instructor}</td><td>{session.mode}</td><td>{overview.participantCount}명</td><td>{overview.completedCount}명</td><td><span className={`status-pill ${session.status === "마감" ? "success" : session.status === "예정" ? "info" : "warning"}`}>{session.status}</span></td><td><Link href={`/sessions/${session.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>; })}</tbody></table></div></section></div>
  </div>;
}
