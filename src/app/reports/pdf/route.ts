import { NextResponse } from "next/server";
import { buildReportPdf } from "@/lib/reports/pdf";
import { departments, courses } from "@/lib/demo/data";
import { getDepartmentOverview, getCourseOverview } from "@/lib/demo/selectors";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const departmentId = Number(url.searchParams.get("department")) || undefined;
  const selectedDepartments = departmentId ? departments.filter((department) => department.id === departmentId) : departments;
  const rows = selectedDepartments.map((department) => {
    const overview = getDepartmentOverview(department.id);
    return { label: department.name, target: overview.requiredCount, completed: overview.completedCount, incomplete: overview.incompleteCount, rate: overview.rate ?? 0 };
  });
  const allCourseRows = courses.filter((course) => course.eligibilityState === "configured").map((course) => getCourseOverview(course.id));
  const summary = allCourseRows.reduce((total, row) => ({ participants: total.participants + row.eligibleCount, completed: total.completed + row.completedCount, rate: 0 }), { participants: 0, completed: 0, rate: 0 });
  summary.rate = summary.participants ? (summary.completed / summary.participants) * 100 : 0;
  const bytes = await buildReportPdf({ title: "교육 이수 현황 리포트", generatedAt: new Date().toISOString().slice(0, 10), scope: departmentId ? selectedDepartments[0]?.name ?? "선택 부서" : "전사", summary, rows });
  return new NextResponse(bytes as BodyInit, { headers: { "content-type": "application/pdf", "content-disposition": `attachment; filename="training-report-${new Date().toISOString().slice(0, 10)}.pdf"` } });
}
