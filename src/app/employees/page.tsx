import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { getEmployeeList, type EmployeeListItem } from "@/lib/repositories/employee-repository";

export const dynamic = "force-dynamic";

export default async function EmployeesPage({ searchParams }: { searchParams: Promise<{ q?: string; department?: string; status?: string }> }) {
  const params = await searchParams;
  const query = params.q ?? "";
  const department = params.department ?? "전체 부서";
  const status = params.status ?? "재직 상태 전체";
  let employees: EmployeeListItem[] = [];
  let loadError = "";
  try {
    employees = await getEmployeeList({ query, department, status });
  } catch (error) {
    loadError = error instanceof Error ? error.message : "직원 정보를 불러오지 못했습니다.";
  }
  const departments = Array.from(
    new Map(employees.filter((employee) => employee.departmentId != null).map((employee) => [employee.departmentId, { id: employee.departmentId, name: employee.departmentName }])).values(),
  );
  const activeCount = employees.filter((employee) => employee.status !== "퇴사").length;

  return <div>
    <PageHeader title="직원·조직" description="현재 직원과 과거 부서 근무 이력을 함께 관리합니다." action={<Link href="/employees/new" className="btn-primary flex items-center gap-2"><Plus size={15} /> 신규 직원 등록</Link>} />
    <div className="page-content space-y-5">
      <form method="get" className="card filter-bar"><div className="search-box"><Search size={16} /><input name="q" aria-label="직원 검색" placeholder="이름 또는 사번 검색" defaultValue={query} /></div><select name="department" aria-label="부서" defaultValue={department}><option>전체 부서</option>{departments.map((department) => <option key={department.id} value={department.name}>{department.name}</option>)}</select><select name="status" aria-label="재직 상태" defaultValue={status}><option>재직 상태 전체</option><option>재직</option><option>휴직</option><option>퇴사</option></select><button type="submit" className="btn-secondary">필터 적용</button></form>
      <section className="card table-card">
        <div className="table-toolbar"><div><strong>직원 {employees.length}명</strong><span>현재 재직·휴직 {activeCount}명</span></div><span className="demo-chip">Supabase 실시간 조회</span></div>
        {loadError ? <div className="notice warning m-5">{loadError} Supabase의 테이블 권한과 환경변수를 확인하세요.</div> : null}
        <div className="overflow-x-auto">{employees.length ? <table className="data-table"><thead><tr><th>직원</th><th>사번</th><th>현재 부서</th><th>직급</th><th>직무</th><th>입사일</th><th>상태</th><th></th></tr></thead><tbody>{employees.map((employee) => <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="employee-cell"><span className="avatar light">{employee.name.slice(-2)}</span><strong>{employee.name}</strong></Link></td><td className="tabular muted">{employee.employeeNumber}</td><td>{employee.departmentName}</td><td>{employee.position}</td><td>{employee.jobFunction}</td><td className="tabular">{employee.hireDate}</td><td><StatusBadge status={employee.status} /></td><td><Link aria-label={`${employee.name} 상세`} href={`/employees/${employee.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>)}</tbody></table> : <div className="empty-state m-5">검색 조건에 맞는 직원이 없습니다.</div>}</div>
      </section>
    </div>
  </div>;
}
