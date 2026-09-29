import Link from "next/link";
import { FileSpreadsheet, FileUp, Download } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getSessionDetail } from "@/lib/repositories/session-repository";
import { getCourseOptions } from "@/lib/repositories/course-repository";
import { getDepartments } from "@/lib/repositories/employee-repository";
import { importCompletionBackup } from "./actions";

export const dynamic = "force-dynamic";

export default async function CompletionImportPage({ searchParams }: { searchParams: Promise<{ session?: string; imported?: string; rejected?: string; error?: string }> }) {
  const query = await searchParams;
  const sessionId = Number(query.session);
  const [session, courses, departments] = await Promise.all([sessionId ? getSessionDetail(sessionId) : Promise.resolve(null), getCourseOptions(), getDepartments()]);
  return <div><PageHeader title="CSV 가져오기/내보내기" description="조건을 선택해 직원 수료 결과를 백업하거나 CSV로 일괄 반영합니다." />
    <div className="page-content space-y-6">{query.imported ? <div className="notice success"><FileSpreadsheet size={17} /> 변경된 {query.imported}건을 반영했습니다.{query.rejected ? ` ${query.rejected}건은 제외되었습니다.` : ""}</div> : null}{query.error ? <div className="notice warning">{query.error}</div> : null}
      <section className="card import-panel"><div className="section-heading"><div><span className="eyebrow">EXPORT</span><h2>수료 결과 내보내기</h2><p>전체 또는 팀·과정·직원·차수 조건으로 백업 파일을 다운로드합니다.</p></div></div>
        <form method="get" action="/imports/completions/export" className="form-grid"><label>팀<select name="department"><option value="">전체 팀</option>{departments.map((department) => <option key={department.department_id} value={department.name}>{department.name}</option>)}</select></label><label>교육 과정<select name="course_id"><option value="">전체 과정</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.code} · {course.name}</option>)}</select></label><label>특정 직원 사번<input name="employee_number" inputMode="numeric" pattern="[0-9]{10}" placeholder="선택 입력" /></label><label>특정 차수 ID<input name="session_id" inputMode="numeric" placeholder="선택 입력" /></label><div className="flex items-end md:col-span-2"><button className="btn-primary flex items-center gap-2" type="submit"><Download size={15} /> CSV 다운로드</button></div></form>
      </section>
      <section className="card import-panel"><div className="section-heading"><div><span className="eyebrow">IMPORT</span><h2>백업 CSV 가져오기</h2><p>내보낸 백업 CSV를 다시 업로드하면 변경된 수료 결과만 반영합니다.</p></div></div><form action={importCompletionBackup} className="space-y-5"><label className="drop-zone block cursor-pointer"><FileUp size={26} /><strong>CSV 파일 선택</strong><p>UTF-8 CSV · 표준 백업 헤더 9개</p><input required type="file" name="file" accept=".csv,text/csv" className="mt-3" /></label><button className="btn-primary" type="submit">검증 후 일괄 반영</button></form></section>
      {session ? <section className="card import-panel"><div className="section-heading"><div><span className="eyebrow">SELECTED SESSION</span><h2>{session.courseName} · {session.round}</h2><p>{session.startsAt.slice(0, 10)} · 참여자 {session.participantCount}명</p></div></div><p className="muted">기존 차수별 업로드가 필요하면 차수 상세에서 참여자 결과를 직접 저장할 수 있습니다.</p><Link href={`/sessions/${session.id}`} className="text-link">차수 상세로 이동</Link></section> : null}
      <section className="card"><h2>CSV 표준 예시</h2><pre className="mt-3 overflow-x-auto rounded bg-slate-50 p-4 text-sm">employee_number,employee_name,department_name,course_code,course_name,session_id,session_number,status,completion_date{"\n"}2000000001,홍길동,A팀,SEC-001,보안 교육,3,1,completed,2026-09-01</pre><p className="muted mt-3">상태 값은 completed, failed, absent, cancelled 중 하나이며 수료 상태에는 수료일이 필요합니다.</p></section>
    </div>
  </div>;
}
