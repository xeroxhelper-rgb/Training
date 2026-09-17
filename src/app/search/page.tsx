import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { departments, employees } from "@/lib/demo/data";
import { getEmployeeProfile } from "@/lib/demo/selectors";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; course?: string }> }) {
  const query = await searchParams; const q = query.q?.trim() ?? "";
  const results = employees.filter((employee) => employee.status !== "퇴사" && (!q || employee.name.includes(q) || employee.employeeNumber.toLowerCase().includes(q.toLowerCase())));
  return <div><PageHeader title="통합 검색" description="교육 이력과 역량 태그를 근거로 업무 후보군을 탐색합니다." />
    <div className="page-content space-y-5"><form className="card search-hero"><div><span className="eyebrow">PEOPLE FINDER</span><h2>어떤 경험을 가진 직원을 찾고 있나요?</h2></div><div className="search-form"><Search size={18} /><input name="q" defaultValue={q} placeholder="이름 또는 사번" /><select name="course"><option>수료 과정 전체</option><option>Nuvera 314 기본 유지보수</option><option>전기안전 정기교육</option></select><select><option>역량 태그 전체</option><option>Nuvera 314</option><option>장비 진단</option><option>트러블슈팅</option></select><button className="btn-primary">검색</button></div></form>
      <div className="notice"><span>검색 결과는 교육 이수 사실을 보여주며 실제 숙련도나 업무 적합성을 단독으로 판단하지 않습니다.</span></div>
      <section className="card table-card"><div className="table-toolbar"><div><strong>검색 결과 {results.length}명</strong><span>인사담당자 권한 · 전사 범위</span></div><button className="btn-secondary">CSV 내보내기</button></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>현재 부서</th><th>직무</th><th>수료 과정</th><th>역량 태그</th><th></th></tr></thead><tbody>{results.map((employee) => { const profile = getEmployeeProfile(employee.id); const tags = Array.from(new Set(profile.completions.flatMap((item) => item.tags))).slice(0, 3); return <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="employee-cell"><span className="avatar light">{employee.name.slice(-2)}</span><span><strong>{employee.name}</strong><small className="table-sub">{employee.employeeNumber} · {employee.position}</small></span></Link></td><td>{departments.find((department) => department.id === employee.departmentId)?.name}</td><td>{employee.jobFunction}</td><td>{profile.completions.length}개</td><td><div className="tag-row">{tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div></td><td><Link href={`/employees/${employee.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>; })}</tbody></table></div></section>
    </div>
  </div>;
}
