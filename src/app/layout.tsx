import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "SkillFlow | 기술교육 이수 관리",
  description: "기술 교육 대상자와 수료 현황을 한눈에 관리합니다.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full flex antialiased" style={{ background: "var(--bg)" }}>
        <Sidebar />
        <main className="app-main flex-1 min-w-0">
          <div className="demo-banner"><span>1차 화면 프로토타입</span> 샘플 데이터로 전체 업무 흐름을 확인하는 단계이며, 입력 내용은 저장되지 않습니다.</div>
          {children}
        </main>
      </body>
    </html>
  );
}
