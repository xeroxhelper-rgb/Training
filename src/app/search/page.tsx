import Link from "next/link";
import { ArrowUpRight, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getCourseOptions } from "@/lib/repositories/course-repository";
import { getDepartments } from "@/lib/repositories/employee-repository";
import { searchEmployees } from "@/lib/repositories/search-repository";
import type { SearchResult } from "@/lib/search/ranking";

export const dynamic = "force-dynamic";

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ q?: string; course?: string; department?: string }> }) {
  const query = await searchParams;
  const q = query.q?.trim() ?? "";
  const courseId = Number(query.course) || undefined;
  const [courses, departments] = await Promise.all([getCourseOptions(), getDepartments()]);
  let results: SearchResult[] = [];
  let error = "";
  try { results = await searchEmployees(q, { courseId, department: query.department || undefined }); } catch (reason) { error = reason instanceof Error ? reason.message : "검색 결과를 불러오지 못했습니다."; }
  return <div><PageHeader title="통합 검색" description="교육 이력과 부서 근무 이력을 기준으로 관련 직원을 찾습니다." />
    <div className="page-content space-y-5"><form className="card search-hero"><div><span className="eyebrow">PEOPLE FINDER</span><h2>어떤 경험을 가진 직원을 찾고 있나요?</h2></div><div className="search-form"><Search size={18} /><input name="q" defaultValue={q} placeholder="과정명, 부서명, 이름 또는 사번 (OR 검색)" /><select name="course" defaultValue={query.course ?? ""}><option value="">수료 과정 전체</option>{courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}</select><select name="department" defaultValue={query.department ?? ""}><option value="">현재 부서 전체</option>{departments.map((department) => <option key={department.department_id} value={department.name}>{department.name}</option>)}</select><button className="btn-primary">검색</button></div></form>
      <div className="notice"><span>검색어는 공백·쉼표 기준 OR 조건이며, 사번·이름·부서·교육 과정 일치 순으로 관련성을 계산합니다.</span></div>
      {error ? <div className="notice warning">{error}</div> : null}
      <section className="card table-card"><div className="table-toolbar"><div><strong>검색 결과 {results.length}명</strong><span>관련성 높은 순서</span></div></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>현재 부서</th><th>직급·직무</th><th>일치 항목</th><th>관련성</th><th></th></tr></thead><tbody>{results.map((employee) => <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="employee-cell"><span className="avatar light">{employee.name.slice(-2)}</span><span><strong>{employee.name}</strong><small className="table-sub">{employee.employeeNumber}</small></span></Link></td><td>{employee.departmentName}</td><td>{employee.position} · {employee.jobFunction}</td><td><div className="tag-row">{employee.matches.map((match) => <span className="tag" key={match}>{match}</span>)}</div></td><td>{employee.score}</td><td><Link href={`/employees/${employee.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}
