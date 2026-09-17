import Link from "next/link";
import { AlertTriangle, Check, ChevronRight, FileSpreadsheet, FileUp, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { courses, sessions } from "@/lib/demo/data";

export default async function CompletionImportPage({ searchParams }: { searchParams: Promise<{ session?: string }> }) {
  const query = await searchParams;
  const selected = sessions.find((session) => session.id === Number(query.session)) ?? sessions[2];
  const course = courses.find((item) => item.id === selected.courseId)!;
  return <div><PageHeader title="수료 결과 CSV 가져오기" description="원본을 바로 저장하지 않고 열 매핑과 오류 검증 후 반영합니다." />
    <div className="page-content space-y-6"><div className="import-steps"><div className="active"><span>1</span><strong>차수·파일 선택</strong></div><ChevronRight /><div className="active"><span>2</span><strong>검증 및 미리보기</strong></div><ChevronRight /><div><span>3</span><strong>최종 반영</strong></div></div>
      <div className="two-column wide-left"><section className="card import-panel"><div className="section-heading"><div><span className="eyebrow">SELECTED SESSION</span><h2>{course.name}</h2><p>{selected.round} · {selected.startDate}</p></div><button className="btn-secondary">차수 변경</button></div><div className="drop-zone"><FileUp size={26} /><strong>completion_result_2026.csv</strong><p>CSV · UTF-8 · 6개 행</p><button className="text-link">다른 파일 선택</button></div><div className="mapping-grid"><label>사번<select defaultValue="사번"><option>사번</option></select></label><label>수료일<select defaultValue="수료일"><option>수료일</option></select></label><label>수료여부<select defaultValue="수료여부"><option>수료여부</option></select></label><label>이름 (선택)<select defaultValue="이름"><option>이름</option></select></label></div></section>
        <aside className="card validation-summary"><div className="section-heading"><div><span className="eyebrow">VALIDATION</span><h2>검증 결과</h2></div><ShieldCheck size={20} /></div><div className="validation-count success"><Check /><span><strong>4</strong> 정상</span></div><div className="validation-count warning"><AlertTriangle /><span><strong>1</strong> 확인 필요</span></div><div className="validation-count danger"><AlertTriangle /><span><strong>1</strong> 오류</span></div><p>오류 행은 반영되지 않습니다. 경고 행은 확인 후 포함할 수 있습니다.</p></aside></div>
      <section className="card table-card"><div className="table-toolbar"><div><strong>행별 검증 미리보기</strong><span>실제 반영 전 단계의 화면 예시입니다.</span></div><button className="btn-secondary flex items-center gap-2"><FileSpreadsheet size={14} /> 오류 목록 다운로드</button></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>행</th><th>사번</th><th>이름</th><th>수료일</th><th>결과</th><th>검증</th></tr></thead><tbody><tr><td>2</td><td>E-1001</td><td>김민준</td><td>2026-08-17</td><td>수료</td><td><span className="status-pill success">정상</span></td></tr><tr><td>3</td><td>E-1002</td><td>이서연</td><td>2026-08-17</td><td>수료</td><td><span className="status-pill success">정상</span></td></tr><tr><td>4</td><td>E-1004</td><td>최지우</td><td>2026-08-17</td><td>수료</td><td><span className="status-pill warning">기존 결과 있음</span></td></tr><tr><td>7</td><td>E-9999</td><td>홍길동</td><td>2026-08-17</td><td>수료</td><td><span className="status-pill danger">존재하지 않는 사번</span></td></tr></tbody></table></div><div className="import-footer"><label><input type="checkbox" /> 오류 행을 제외하고 정상·확인된 경고 행만 반영</label><button className="btn-primary" disabled>4건 최종 반영</button></div></section>
      <Link href={`/sessions/${selected.id}`} className="text-link">← 차수 상세로 돌아가기</Link>
    </div>
  </div>;
}
