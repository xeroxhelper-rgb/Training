import Link from "next/link";
import { ArrowUpRight, Plus, Search } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { StatusBadge } from "@/components/Badge";
import { departments, employees } from "@/lib/demo/data";

export default function EmployeesPage() {
  return <div>
    <PageHeader title="직원·조직" description="현재 직원과 과거 부서 근무 이력을 함께 관리합니다." action={<button className="btn-primary flex items-center gap-2"><Plus size={15} /> 신규 직원 등록</button>} />
    <div className="page-content space-y-5">
      <div className="card filter-bar"><div className="search-box"><Search size={16} /><input aria-label="직원 검색" placeholder="이름 또는 사번 검색" /></div><select aria-label="부서"><option>전체 부서</option>{departments.map((department) => <option key={department.id}>{department.name}</option>)}</select><select aria-label="재직 상태"><option>재직 상태 전체</option><option>재직</option><option>휴직</option><option>퇴사</option></select><button className="btn-secondary">필터 적용</button></div>
      <section className="card table-card">
        <div className="table-toolbar"><div><strong>직원 {employees.length}명</strong><span>현재 재직·휴직 9명</span></div><span className="demo-chip">마지막 동기화 09:00</span></div>
        <div className="overflow-x-auto"><table className="data-table"><thead><tr><th>직원</th><th>사번</th><th>현재 부서</th><th>직급</th><th>직무</th><th>입사일</th><th>상태</th><th></th></tr></thead><tbody>{employees.map((employee) => { const department = departments.find((item) => item.id === employee.departmentId)!; return <tr key={employee.id}><td><Link href={`/employees/${employee.id}`} className="employee-cell"><span className="avatar light">{employee.name.slice(-2)}</span><strong>{employee.name}</strong></Link></td><td className="tabular muted">{employee.employeeNumber}</td><td>{department.name}</td><td>{employee.position}</td><td>{employee.jobFunction}</td><td className="tabular">{employee.hireDate}</td><td><StatusBadge status={employee.status} /></td><td><Link aria-label={`${employee.name} 상세`} href={`/employees/${employee.id}`} className="icon-link"><ArrowUpRight size={15} /></Link></td></tr>; })}</tbody></table></div>
      </section>
    </div>
  </div>;
}
