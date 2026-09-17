import Link from "next/link";
import { FileSpreadsheet, FileUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getSessionDetail } from "@/lib/repositories/session-repository";
import { importCompletionCsv } from "./actions";

export const dynamic = "force-dynamic";

export default async function CompletionImportPage({ searchParams }: { searchParams: Promise<{ session?: string; imported?: string; error?: string }> }) {
  const query = await searchParams; const sessionId = Number(query.session); const session = sessionId ? await getSessionDetail(sessionId) : null;
  return <div><PageHeader title="수료 결과 CSV 가져오기" description="사번을 기준으로 수료 결과를 검증하고 차수에 반영합니다." />
    <div className="page-content space-y-6">{query.imported ? <div className="notice success"><FileSpreadsheet size={17} /> {query.imported}건을 반영했습니다.</div> : null}{query.error ? <div className="notice warning">{query.error}</div> : null}
      <section className="card import-panel"><div className="section-heading"><div><span className="eyebrow">SELECTED SESSION</span><h2>{session ? `${session.courseName} · ${session.round}` : "차수를 선택하세요"}</h2><p>{session ? `${session.startsAt.slice(0, 10)} · 참여자 ${session.participantCount}명` : "차수 상세 화면에서 업로드를 시작하세요."}</p></div></div>
        {session ? <form action={importCompletionCsv} className="space-y-5"><input type="hidden" name="session_id" value={session.id} /><label className="drop-zone block cursor-pointer"><FileUp size={26} /><strong>CSV 파일 선택</strong><p>UTF-8 CSV · 사번, 수료일, 수료여부 컬럼</p><input required type="file" name="file" accept=".csv,text/csv" className="mt-3" /></label><button className="btn-primary" type="submit">검증 후 반영</button></form> : <Link href="/sessions" className="text-link">교육 차수 목록으로 이동</Link>}
      </section>
      <section className="card"><h2>CSV 예시</h2><pre className="mt-3 overflow-x-auto rounded bg-slate-50 p-4 text-sm">사번,이름,수료일,수료여부{"\n"}2020031234,홍길동,2026-09-01,수료</pre><p className="muted mt-3">사번은 10자리 숫자 형식이어야 하며, 존재하지 않는 사번은 반영되지 않습니다.</p></section>
    </div>
  </div>;
}
