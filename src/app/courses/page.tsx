import Link from "next/link";
import { ArrowUpRight, CircleAlert, Plus } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { courses } from "@/lib/demo/data";
import { getCourseOverview } from "@/lib/demo/selectors";

export default function CoursesPage() {
  return <div><PageHeader title="교육 과정" description="반복 운영되는 교육의 대상 조건과 누적 수료 현황을 관리합니다." action={<button className="btn-primary flex items-center gap-2"><Plus size={15} /> 과정 등록</button>} />
    <div className="page-content"><div className="course-card-grid">{courses.map((course) => { const overview = getCourseOverview(course.id); return <Link href={`/courses/${course.id}`} className="course-card card" key={course.id}><div className="course-card-top"><span className="course-code">{course.code}</span><span className={`status-pill ${course.status === "운영 중" ? "success" : "neutral"}`}>{course.status}</span></div><h2>{course.name}</h2><p>{course.description}</p><div className="tag-row">{course.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div><div className="course-card-metric">{overview.rate === null ? <span className="warning-line"><CircleAlert size={15} /> 대상 조건 설정 필요</span> : <><div><small>누적 수료율</small><strong>{overview.rate.toFixed(1)}%</strong></div><div><small>수료 / 대상</small><strong>{overview.completedCount} / {overview.eligibleCount}명</strong></div></>}<ArrowUpRight size={17} /></div></Link>; })}</div></div>
  </div>;
}
