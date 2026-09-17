import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <main className="login-shell">
      <section className="login-card">
        <span className="eyebrow">TRAINING OPS</span>
        <h1>교육 이수 현황</h1>
        <p>담당자 계정으로 로그인하면 조직별 교육 현황을 안전하게 관리할 수 있습니다.</p>
        <LoginForm next={params.next ?? "/"} />
        {process.env.NEXT_PUBLIC_DEMO_MODE !== "false" ? (
          <Link href="/" className="secondary-button">프로토타입 계속 보기</Link>
        ) : null}
        {params.error ? <p className="form-error">인증 링크를 다시 확인하세요.</p> : null}
      </section>
    </main>
  );
}
