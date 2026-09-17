"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CalendarDays, FileBarChart, FileUp, GraduationCap, LayoutDashboard, Search, Sparkles, Users } from "lucide-react";

const NAV = [
  { href: "/", label: "대시보드", icon: LayoutDashboard },
  { href: "/employees", label: "직원·조직", icon: Users },
  { href: "/courses", label: "교육 과정", icon: GraduationCap },
  { href: "/sessions", label: "교육 차수", icon: CalendarDays },
  { href: "/imports/completions", label: "CSV 가져오기", icon: FileUp },
  { href: "/search", label: "통합 검색", icon: Search },
  { href: "/reports", label: "분석·리포트", icon: FileBarChart },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar w-64 shrink-0 min-h-screen flex flex-col text-white">
      <div className="px-5 py-6 border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <span className="brand-mark"><Sparkles size={16} /></span>
          <div><div className="text-[15px] font-semibold tracking-tight">SkillFlow</div><div className="text-[11px] text-white/50 mt-0.5">기술교육 이수 관리</div></div>
        </div>
      </div>
      <nav className="flex-1 py-3">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return <Link key={href} href={href} className={`flex items-center gap-3 px-5 py-2.5 text-sm transition-colors ${active ? "bg-white/10 text-white font-medium border-r-2 border-white" : "text-white/65 hover:text-white hover:bg-white/5"}`}>
            <Icon size={17} strokeWidth={1.8} />{label}
          </Link>;
        })}
      </nav>
      <div className="px-5 py-4 border-t border-white/10">
        <div className="flex items-center gap-2.5"><span className="avatar">HR</span><div><p className="text-xs text-white/85">인사담당자</p><p className="text-[10px] text-white/40">전사 조회·관리</p></div></div>
      </div>
    </aside>
  );
}
