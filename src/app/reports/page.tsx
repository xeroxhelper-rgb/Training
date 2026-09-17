import { Download, Printer, TrendingUp } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { courses, departments } from "@/lib/demo/data";
import { getCourseOverview, getDepartmentOverview } from "@/lib/demo/selectors";

export default function ReportsPage() {
  const departmentRows = departments.map((department) => getDepartmentOverview(department.id));
  const courseRows = courses.filter((course) => course.eligibilityState === "configured").map((course) => getCourseOverview(course.id));
  return <div><PageHeader title="분석·리포트" description="기준일과 산식을 명시한 조직·과정별 교육 현황입니다." action={<div className="flex gap-2"><button className="btn-secondary flex items-center gap-2"><Printer size={14} /> 인쇄</button><button className="btn-primary flex items-center gap-2"><Download size={14} /> CSV 내보내기</button></div>} />
    <div className="page-content space-y-6"><div className="report-context card"><div><small>리포트 기준</small><strong>2026년 9월 17일 현재 재직자</strong></div><div><small>조회 범위</small><strong>전사 · 전체 과정</strong></div><div><small>생성자</small><strong>인사담당자</strong></div><div><small>산식</small><strong>수료자 ÷ 과정 대상자</strong></div></div>
      <section className="card"><div className="section-heading panel-heading"><div><span className="eyebrow">EXECUTIVE SUMMARY</span><h2>조직별 교육 준비도</h2></div><TrendingUp size={19} /></div><div className="report-bars">{departmentRows.map((row) => <div className="report-bar" key={row.department.id}><span>{row.department.name}</span><div className="progress-track"><span style={{ width: `${row.rate ?? 0}%` }} /></div><strong>{row.rate?.toFixed(1)}%</strong><small>미수료 {row.incompleteCount}건</small></div>)}</div></section>
      <section className="card table-card"><div className="table-toolbar"><div><strong>과정별 전사 현황</strong><span>대상 조건이 설정된 운영 과정</span></div><select><option>전체 과정</option><option>제품 기술</option><option>법정·안전</option></select></div><div className="overflow-x-auto"><table className="data-table"><thead><tr><th>과정</th><th>대상 기준</th><th>대상자</th><th>수료</th><th>미수료</th><th>수료율</th></tr></thead><tbody>{courseRows.map((row) => <tr key={row.course.id}><td><strong>{row.course.name}</strong><small className="table-sub">{row.course.code}</small></td><td>{row.course.eligibilityLabel}</td><td>{row.eligibleCount}명</td><td>{row.completedCount}명</td><td>{row.incompleteCount}명</td><td><strong>{row.rate?.toFixed(1)}%</strong></td></tr>)}</tbody></table></div></section>
    </div>
  </div>;
}
