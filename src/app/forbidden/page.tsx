import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <main className="login-shell">
      <section className="login-card">
        <span className="eyebrow">ACCESS CONTROL</span>
        <h1>접근 권한이 없습니다</h1>
        <p>현재 계정에는 이 정보에 접근할 수 있는 역할 범위가 없습니다. 인사 담당자에게 권한을 요청하세요.</p>
        <Link href="/" className="secondary-button">대시보드로 돌아가기</Link>
      </section>
    </main>
  );
}
