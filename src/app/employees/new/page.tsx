import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { getDepartments } from "@/lib/repositories/employee-repository";
import { createEmployee } from "../actions";

export const dynamic = "force-dynamic";

export default async function NewEmployeePage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const [{ error }, departments] = await Promise.all([searchParams, getDepartments()]);
  return <div><PageHeader title="신규 직원 등록" description="직원 기본 정보를 등록합니다." action={<Link href="/employees" className="btn-secondary flex items-center gap-2"><ArrowLeft size={14} /> 직원 목록</Link>} /><div className="page-content"><section className="card p-6">{error ? <div className="notice warning mb-5">{error}</div> : null}<form action={createEmployee} className="form-grid"><label>이름<input name="name" required /></label><label>사번<input name="employee_number" inputMode="numeric" pattern="[0-9]{10}" maxLength={10} required /></label><label>입사일<input type="date" name="hire_date" required /></label><label>부서<select name="department" required><option value="">부서 선택</option>{departments.map((department) => <option key={department.department_id} value={department.name}>{department.name}</option>)}</select></label><label>직급<input name="position" /></label><label>상태<select name="status" defaultValue="재직" required><option>재직</option><option>휴직</option><option>퇴사</option></select></label><label className="md:col-span-2">이메일<input type="email" name="email" /></label><div className="flex gap-2 md:col-span-2"><button type="submit" className="btn-primary">등록</button><Link href="/employees" className="btn-secondary">취소</Link></div></form></section></div></div>;
}
