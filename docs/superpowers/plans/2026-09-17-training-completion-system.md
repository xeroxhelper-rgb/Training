# 기술 교육 이수 현황 시스템 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 기존 샘플 대시보드를 직원·조직 이력, 과정·차수, 동적 대상자, CSV 수료 반영, 역할별 권한과 감사 기능을 갖춘 운영용 기술 교육 이수 현황 시스템으로 전환한다.

**Architecture:** Next.js 16 App Router의 Server Component를 조회 기본 경계로, Server Action을 변경 기본 경계로 사용한다. Supabase Auth의 쿠키 세션과 PostgreSQL RLS를 결합하고, 수료율·대상자 판정·CSV 일괄 반영처럼 일관성이 필요한 연산은 테스트 가능한 도메인 함수와 PostgreSQL RPC로 분리한다. 기존 테이블을 즉시 삭제하지 않고 확장·이관한 뒤 화면 단위로 전환해 각 단계가 독립적으로 검증되도록 한다.

**Tech Stack:** Next.js 16.3.5, React 19.2.8, TypeScript strict mode, Supabase PostgreSQL/Auth/RLS, `@supabase/ssr`, Zod, `csv-parse`, Vitest, React Testing Library, Playwright, Recharts, Tailwind CSS 4.

**Spec:** `docs/PRD_기술교육이수현황시스템.md`

**Delivery Scope:** 이 계획은 PRD의 단계 0과 단계 1인 핵심 운영 제품을 출시 가능한 상태로 만드는 계획이다. PRD 단계 2의 HR 연동·알림·고급 추이 분석과 단계 3의 숙련도 평가·자동 추천은 운영 데이터와 별도 정책 승인이 필요하므로 1차 출시 후 각각 독립 PRD와 구현 계획으로 진행한다.

## Global Constraints

- 구현 전 `docs/PRD_기술교육이수현황시스템.md`를 다시 읽고 요구사항 ID를 기준으로 범위를 확인한다.
- Next.js 코드를 수정하기 전 저장소의 `node_modules/next/dist/docs/`에서 해당 기능 가이드를 읽는다. 인증 페이지는 `01-app/02-guides/authentication.md`, 폼은 `01-app/02-guides/forms.md`, Route Handler는 `01-app/01-getting-started/15-route-handlers.md`를 기준으로 한다.
- 인증이 필요한 경로는 정적 생성이나 ISR을 사용하지 않고 사용자별 서버 렌더링을 유지한다.
- 브라우저 번들에 service-role 키를 포함하지 않는다. 관리자 권한도 RLS와 서버 측 권한 검사 없이 우회하지 않는다.
- 공개 스키마의 모든 업무 테이블은 RLS, 명시적 grant, 허용·차단 정책 테스트를 함께 추가한다.
- 수료와 숙련도를 동일시하지 않으며 관련 화면과 내보내기에 PRD의 안내 문구를 유지한다.
- 과정 수료율 분모는 기준일 현재 과정 대상 조건을 충족하는 재직자이고, 분자가 0이어도 분모가 0이면 `대상자 없음`으로 표시한다.
- 직원·수료·부서 이력은 물리 삭제하지 않는다. 정정과 취소는 상태 변경 및 감사 로그로 보존한다.
- 날짜·시간 표시는 `Asia/Seoul`, 저장은 `timestamptz` 또는 의미가 날짜인 경우 `date`를 사용한다.
- 단위 테스트는 순수 도메인 규칙과 폼 검증을, 데이터베이스 테스트는 RLS와 RPC를, E2E는 역할별 핵심 업무 흐름을 검증한다.
- 각 Task는 테스트 통과 후 별도 커밋한다. 현재 작업 폴더에 `.git`이 없으므로 실행 시작 전에 기존 저장소 연결 여부를 확인하고, 새 저장소가 필요하면 사용자 승인을 받아 `git init`을 수행한다.
- 현재 `.env.local.example`의 실제 프로젝트처럼 보이는 값은 배포 전 반드시 명백한 자리표시자 값으로 교체한다.

---

## Release Map

| 단계 | 결과물 | 완료 게이트 |
|---|---|---|
| 0. 기반 정비 | 테스트 환경, 서버 중심 Supabase 접근, 로그인 셸 | 인증된 사용자가 역할에 맞는 빈 앱 셸에 접근 |
| 1. 데이터·보안 | v2 스키마, RLS, 감사, 집계 함수 | DB 테스트로 허용·차단 및 산식 검증 |
| 2. 기준정보 | 직원·부서·근무 이력, 과정·대상 조건 | 신규 입사·이동·퇴사와 대상자 미리보기 동작 |
| 3. 교육 운영 | 차수·참여자·수료, CSV 검증·반영 | 정상/오류/중복 CSV의 원자적 처리 검증 |
| 4. 활용 화면 | 역할별 대시보드, 검색, 리포트·내보내기 | PRD 핵심 조회 시나리오 E2E 통과 |
| 5. 전환·출시 | 기존 데이터 이관, 성능·접근성·복구 검증 | 인수 기준 12개와 운영 체크리스트 승인 |

## Prototype Approval Gate — 전체 흐름 확인용 수직 프로토타입

사용자 요청에 따라 Phase 0에 들어가기 전에 아래 프로토타입만 먼저 구현한다. 이 단계에서는 Supabase 스키마, 인증, RLS, 실제 CSV 저장을 변경하지 않는다.

### Prototype Task P1: 데모 도메인과 집계 규칙

- [ ] 샘플 직원·부서·과정·차수·수료 데이터를 `src/lib/demo/data.ts`에 작성한다.
- [ ] 과정 수료율, 부서별 현황, 다음 차수 후보자, 개인 이력을 계산하는 실패 테스트를 먼저 작성한다.
- [ ] `src/lib/demo/selectors.ts`의 최소 구현으로 테스트를 통과시킨다.

### Prototype Task P2: 전체 업무 흐름 화면

- [ ] 역할·기준일·데모 데이터 안내가 포함된 앱 셸과 내비게이션을 작성한다.
- [ ] 대시보드, 직원 목록·상세, 과정 목록·상세, 차수 목록·상세 화면을 연결한다.
- [ ] CSV 가져오기 3단계 미리보기, 통합 검색, 리포트 화면을 연결한다.
- [ ] 각 화면에 실제 저장 전 단계라는 데모 안내와 다음 행동 링크를 제공한다.

### Prototype Task P3: 검증과 사용자 승인

- [ ] 단위 테스트, lint, typecheck, production build를 실행한다.
- [ ] 로컬 개발 서버를 실행하고 Codex 웹 화면에서 시스템을 연다.
- [ ] 사용자에게 전체 흐름을 검토받고 명시적 승인을 받는다.
- [ ] 승인 전에는 Phase 0 이후의 인증·DB·CSV 저장 구현을 시작하지 않는다.

---

## File Map

### 애플리케이션 경계

- `src/lib/supabase/client.ts`: 브라우저 전용 Supabase 클라이언트.
- `src/lib/supabase/server.ts`: Server Component·Server Action용 쿠키 기반 클라이언트.
- `src/lib/supabase/proxy.ts`: 세션 갱신 로직.
- `src/proxy.ts`: 보호 경로 세션 갱신과 로그인 리다이렉트.
- `src/lib/auth/session.ts`: 현재 사용자, 역할, 범위를 반환하는 캐시된 DAL.
- `src/lib/auth/permissions.ts`: 역할·행위·범위 판정 순수 함수.
- `src/lib/validation/*.ts`: 서버와 UI가 공유하는 Zod 스키마.
- `src/lib/domain/eligibility.ts`: 대상 조건 판정 순수 함수.
- `src/lib/domain/completion-rate.ts`: 과정·차수 수료율 표현 규칙.
- `src/lib/imports/completion-csv.ts`: CSV 파싱·정규화·행 단위 검증.
- `src/lib/repositories/*.ts`: Server Component가 사용하는 조회 함수.
- `src/app/**/actions.ts`: 화면 변경 작업의 Server Action.
- `src/components/ui/*`: 공통 폼, 표, 상태, 피드백 컴포넌트.

### 데이터베이스

- `supabase/migrations/0003_product_v2_core.sql`: 부서, 근무 이력, 과정 확장, 태그, 대상 규칙, 차수, 참여자, 수료, 가져오기, 감사, 스냅샷.
- `supabase/migrations/0004_product_v2_security.sql`: 역할·범위 함수, grant, RLS 정책, 감사 트리거.
- `supabase/migrations/0005_product_v2_functions.sql`: 대상자, 수료율, CSV 반영, 리포트 RPC.
- `supabase/migrations/0006_product_v2_backfill.sql`: 기존 샘플 데이터를 v2 구조로 이관.
- `supabase/migrations/0007_product_v2_seed.sql`: 역할별 E2E 계정용 비민감 기준 데이터.
- `supabase/tests/rls.test.sql`: 역할별 허용·차단 회귀 테스트.
- `supabase/tests/domain.test.sql`: 기간 중복, 대상자, 수료율, 원자적 반영 테스트.

### 테스트

- `src/**/*.test.ts(x)`: Vitest 단위·컴포넌트 테스트.
- `e2e/auth.spec.ts`: 인증과 역할별 메뉴 접근.
- `e2e/employee-lifecycle.spec.ts`: 입사·이동·퇴사.
- `e2e/course-eligibility.spec.ts`: 대상 조건과 수료율.
- `e2e/completion-import.spec.ts`: CSV 업로드.
- `e2e/search-report.spec.ts`: 검색·명단·리포트.

---

## Phase 0 — 개발 기반과 인증 셸

### Task 1: 테스트와 품질 기준선 구축

**Files:**
- Modify: `package.json`
- Create: `vitest.config.mts`
- Create: `vitest.setup.ts`
- Create: `playwright.config.ts`
- Create: `src/lib/domain/completion-rate.ts`
- Test: `src/lib/domain/completion-rate.test.ts`
- Create: `e2e/smoke.spec.ts`

**Interfaces:**
- Produces: `calculateRate(completed: number, eligible: number): RateResult`
- Produces: `RateResult = { kind: "no-targets" } | { kind: "rate"; completed: number; eligible: number; percent: number }`

- [ ] **Step 1: 테스트 의존성과 명령을 추가한다.**

Run:

```powershell
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/dom @testing-library/jest-dom vite-tsconfig-paths @playwright/test supabase
```

`package.json` scripts에 다음을 추가한다.

```json
{
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "typecheck": "tsc --noEmit",
  "check": "npm run lint && npm run typecheck && npm run test"
}
```

- [ ] **Step 2: Vitest와 Playwright 설정을 작성한다.**

```ts
// vitest.config.mts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths(), react()],
  test: { environment: "jsdom", setupFiles: ["./vitest.setup.ts"] },
});
```

```ts
// playwright.config.ts
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: { baseURL: "http://127.0.0.1:3000", trace: "retain-on-failure" },
  webServer: { command: "npm run dev", url: "http://127.0.0.1:3000", reuseExistingServer: true },
});
```

- [ ] **Step 3: 수료율 실패 테스트를 작성한다.**

```ts
import { describe, expect, it } from "vitest";
import { calculateRate } from "./completion-rate";

describe("calculateRate", () => {
  it("대상자가 없으면 0%가 아니라 no-targets를 반환한다", () => {
    expect(calculateRate(0, 0)).toEqual({ kind: "no-targets" });
  });

  it("수료율을 소수점 첫째 자리로 반올림한다", () => {
    expect(calculateRate(2, 3)).toEqual({ kind: "rate", completed: 2, eligible: 3, percent: 66.7 });
  });

  it("수료자가 대상자보다 많으면 거부한다", () => {
    expect(() => calculateRate(2, 1)).toThrow("completed cannot exceed eligible");
  });
});
```

- [ ] **Step 4: 실패를 확인한 뒤 최소 구현을 추가한다.**

```ts
export type RateResult =
  | { kind: "no-targets" }
  | { kind: "rate"; completed: number; eligible: number; percent: number };

export function calculateRate(completed: number, eligible: number): RateResult {
  if (completed < 0 || eligible < 0) throw new Error("counts must be non-negative");
  if (completed > eligible) throw new Error("completed cannot exceed eligible");
  if (eligible === 0) return { kind: "no-targets" };
  return { kind: "rate", completed, eligible, percent: Math.round((completed / eligible) * 1000) / 10 };
}
```

- [ ] **Step 5: 기준선 검증과 커밋을 수행한다.**

Run: `npm run check`

Expected: lint, typecheck, unit test 모두 PASS.

```powershell
git add package.json package-lock.json vitest.config.mts vitest.setup.ts playwright.config.ts src/lib/domain/completion-rate.ts src/lib/domain/completion-rate.test.ts e2e/smoke.spec.ts
git commit -m "test: establish application quality baseline"
```

### Task 2: Supabase SSR 인증 경계 구축

**Files:**
- Modify: `package.json`
- Delete after replacement: `src/lib/supabase.ts`
- Create: `src/lib/supabase/client.ts`
- Create: `src/lib/supabase/server.ts`
- Create: `src/lib/supabase/proxy.ts`
- Create: `src/proxy.ts`
- Create: `src/app/login/page.tsx`
- Create: `src/app/login/actions.ts`
- Create: `src/app/auth/confirm/route.ts`
- Modify: `src/app/layout.tsx`
- Modify: `.env.local.example`
- Test: `src/lib/auth/session.test.ts`
- Test: `e2e/auth.spec.ts`

**Interfaces:**
- Produces: `createBrowserClient(): SupabaseClient<Database>`
- Produces: `createServerClient(): Promise<SupabaseClient<Database>>`
- Produces: `updateSession(request: NextRequest): Promise<NextResponse>`

- [ ] **Step 1: SSR 패키지를 설치하고 환경변수 예제를 안전한 값으로 바꾼다.**

Run: `npm install @supabase/ssr`

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://example.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_example
```

- [ ] **Step 2: 쿠키 기반 서버·브라우저 클라이언트를 작성한다.**

공식 Supabase SSR 패턴대로 `createBrowserClient`와 `createServerClient`를 분리하고, 서버 클라이언트의 cookie adapter는 Next.js `cookies()`의 `getAll`/`setAll`을 사용한다. `src/lib/supabase/server.ts`는 `server-only`를 import해 브라우저 번들 유입을 차단한다.

- [ ] **Step 3: 로그인 실패 테스트와 로그인 Server Action을 작성한다.**

```ts
// 핵심 action 계약
export type LoginState = { fieldErrors?: { email?: string[]; password?: string[] }; formError?: string };
export async function login(_state: LoginState, formData: FormData): Promise<LoginState>;
```

Zod로 이메일과 8자 이상 비밀번호를 검사하고, 성공 시 `/`로 redirect한다. 인증 오류는 계정 존재 여부를 노출하지 않는 동일한 한국어 메시지로 반환한다.

- [ ] **Step 4: `src/proxy.ts`에서 세션 갱신과 보호 경로 처리를 추가한다.**

`/login`과 `/auth/confirm`만 비로그인 접근을 허용한다. Proxy는 빠른 리다이렉트만 담당하며 실제 권한 검사는 DAL과 RLS에서 다시 수행한다.

- [ ] **Step 5: 인증 E2E와 전체 검증 후 커밋한다.**

Run: `npm run check`

Run: `npm run test:e2e -- e2e/auth.spec.ts`

Expected: 비로그인 사용자는 `/login`으로 이동하고, 유효한 테스트 사용자는 로그인 후 `/`에 접근한다.

```powershell
git add package.json package-lock.json .env.local.example src/proxy.ts src/lib/supabase src/app/login src/app/auth src/app/layout.tsx src/lib/auth/session.test.ts e2e/auth.spec.ts
git commit -m "feat: add Supabase SSR authentication boundary"
```

---

## Phase 1 — 데이터 모델, 권한, 감사

### Task 3: v2 핵심 스키마와 기존 데이터 보존 마이그레이션

**Files:**
- Create: `supabase/migrations/0003_product_v2_core.sql`
- Create: `supabase/tests/domain.test.sql`
- Create: `src/types/database.ts` generated by Supabase CLI
- Replace: `src/types/index.ts`

**Interfaces:**
- Produces database enums: `employment_status`, `course_status`, `session_status`, `completion_status`, `rule_field`, `rule_operator`.
- Produces tables: `departments`, `employment_history`, `competency_tags`, `course_competency_tags`, `course_prerequisites`, `eligibility_rule_groups`, `eligibility_rules`, `eligibility_employee_exceptions`, `training_sessions`, `session_participants`, `course_completions`, `import_batches`, `import_rows`, `user_role_scopes`, `audit_logs`, `metric_snapshots`.

- [ ] **Step 1: 실패하는 DB 제약 테스트를 먼저 작성한다.**

`supabase/tests/domain.test.sql`에서 pgTAP으로 다음을 검증한다.

```sql
select throws_ok(
  $$ insert into public.employment_history(employee_id, department_id, start_date, end_date)
     values (1, 1, date '2026-01-01', date '2025-12-31') $$,
  '23514',
  null,
  'end date cannot precede start date'
);
```

추가 테스트: 사번 중복 거부, 과정 코드 중복 거부, 직원별 근무 기간 중복 거부, 차수 종료일이 시작일보다 빠른 값 거부, 동일 차수·직원 참여 중복 거부.

- [ ] **Step 2: 기존 테이블을 확장하고 신규 테이블을 생성한다.**

핵심 변경은 다음 SQL 계약을 따른다.

```sql
alter table public.employees add column employee_number text;
update public.employees set employee_number = 'LEGACY-' || employee_id where employee_number is null;
alter table public.employees alter column employee_number set not null;
create unique index employees_employee_number_key on public.employees(employee_number);

alter table public.employees drop constraint employees_status_check;
update public.employees set status = '재직' where status = '신입';
alter table public.employees add constraint employees_status_check check (status in ('재직','휴직','퇴사'));

create table public.departments (
  department_id bigint generated always as identity primary key,
  department_code text not null unique,
  name text not null,
  parent_department_id bigint references public.departments,
  is_active boolean not null default true
);
```

근무 기간 겹침은 `daterange(start_date, coalesce(end_date + 1, 'infinity'::date), '[)')`와 GiST exclusion constraint로 차단한다. 기존 `career_history`와 `training_targets`는 이 단계에서 삭제하지 않는다.

- [ ] **Step 3: 과정·차수·수료·가져오기·감사 테이블을 생성한다.**

`training_courses`에는 `course_code`, `status`, `validity_months`, `owner_user_id`를 추가한다. 수료 결과는 다음 제약을 갖는다.

```sql
create table public.course_completions (
  completion_id bigint generated always as identity primary key,
  session_id bigint not null references public.training_sessions,
  employee_id bigint not null references public.employees,
  status completion_status not null,
  completion_date date,
  score numeric,
  note text,
  cancelled_at timestamptz,
  cancellation_reason text,
  created_by uuid not null references auth.users,
  created_at timestamptz not null default now(),
  unique (session_id, employee_id),
  check ((status = 'completed' and completion_date is not null) or status <> 'completed'),
  check ((cancelled_at is null and cancellation_reason is null) or (cancelled_at is not null and cancellation_reason is not null))
);
```

- [ ] **Step 4: 로컬 DB를 재구성하고 타입을 생성한다.**

Run: `npx supabase db reset`

Run: `npx supabase test db`

Run: `npx supabase gen types typescript --local --schema public > src/types/database.ts`

Expected: 모든 제약 테스트 PASS, 생성 타입에 신규 테이블 포함.

- [ ] **Step 5: 앱 타입 별칭을 정리하고 커밋한다.**

`src/types/index.ts`는 손으로 DB 행 타입을 복제하지 않고 `Database["public"]["Tables"]`에서 필요한 Row/Insert/Update를 export한다.

```powershell
git add supabase/migrations/0003_product_v2_core.sql supabase/tests/domain.test.sql src/types
git commit -m "feat: add v2 training domain schema"
```

### Task 4: 역할·범위 기반 권한과 감사 로그

**Files:**
- Create: `supabase/migrations/0004_product_v2_security.sql`
- Create: `supabase/tests/rls.test.sql`
- Create: `src/lib/auth/permissions.ts`
- Create: `src/lib/auth/session.ts`
- Test: `src/lib/auth/permissions.test.ts`
- Create: `src/app/forbidden/page.tsx`
- Modify: `src/components/Sidebar.tsx`

**Interfaces:**
- Produces: `AppRole = "system_admin" | "hr" | "manager" | "instructor" | "employee" | "executive"`
- Produces: `RoleScope = { role: AppRole; departmentIds: number[]; courseIds: number[] }`
- Produces: `getCurrentActor(): Promise<Actor>` where `Actor = { userId: string; employeeId: number | null; roles: RoleScope[] }`
- Produces: `can(actor, action, resource): boolean`
- Produces test helper: `actorWith(scope: Partial<RoleScope> & { employeeId?: number }): Actor`
- Produces DB helpers in private schema: `private.has_role`, `private.can_view_employee`, `private.can_manage_course`.

- [ ] **Step 1: 역할 판정 실패 테스트를 작성한다.**

```ts
it("manager cannot view an employee outside managed departments", () => {
  const actor = actorWith({ role: "manager", departmentIds: [10] });
  expect(can(actor, "employee:read", { departmentId: 11, employeeId: 7 })).toBe(false);
});

it("employee can view only their own record", () => {
  const actor = actorWith({ role: "employee", employeeId: 7 });
  expect(can(actor, "employee:read", { departmentId: 10, employeeId: 7 })).toBe(true);
  expect(can(actor, "employee:read", { departmentId: 10, employeeId: 8 })).toBe(false);
});
```

- [ ] **Step 2: 순수 권한 함수를 구현하고 단위 테스트를 통과시킨다.**

권한 함수는 UI 노출 제어용이며 최종 보안 경계는 RLS임을 주석과 문서에 명시한다.

- [ ] **Step 3: DB 역할 함수, grant와 RLS 정책을 작성한다.**

모든 공개 업무 테이블에서 `anon` 권한을 revoke한다. `authenticated`에는 필요한 명령만 grant하고 select/insert/update 정책을 각각 분리한다. 역할 조회의 순환 RLS를 피하기 위해 `private` 스키마의 `security definer` 함수에 `set search_path = ''`를 사용하고 실행 권한을 `authenticated`에만 부여한다.

- [ ] **Step 4: 감사 트리거를 작성한다.**

직원, 근무 이력, 과정, 대상 규칙, 차수, 참여자, 수료, 권한 범위 테이블의 INSERT/UPDATE에 대해 `audit_logs`에 `old_data`, `new_data`, `reason`, `auth.uid()`를 기록한다. DELETE는 원칙적으로 revoke하고 관리 RPC에서도 soft cancel만 허용한다.

- [ ] **Step 5: 허용·차단 DB 테스트를 실행한다.**

`rls.test.sql`은 각 역할마다 최소 한 개의 허용과 한 개의 차단 사례를 포함한다. 특히 부서장 타 부서 조회, 강사 타 과정 변경, 직원 타인 조회, 임원 원본 변경, 익명 접근을 차단해야 한다.

Run: `npx supabase test db`

Expected: RLS와 감사 테스트 모두 PASS.

- [ ] **Step 6: 역할별 내비게이션을 적용하고 커밋한다.**

`Sidebar`는 서버에서 전달받은 `Actor` 기준으로 메뉴를 필터링한다. 숨겨진 메뉴 URL에 직접 접근해도 페이지 DAL과 RLS에서 차단되는 E2E를 추가한다.

```powershell
git add supabase/migrations/0004_product_v2_security.sql supabase/tests/rls.test.sql src/lib/auth src/app/forbidden src/components/Sidebar.tsx
git commit -m "feat: enforce scoped roles and audit logging"
```

### Task 5: 대상자·수료율 도메인과 DB 함수

**Files:**
- Create: `src/lib/domain/eligibility.ts`
- Test: `src/lib/domain/eligibility.test.ts`
- Create: `supabase/migrations/0005_product_v2_functions.sql`
- Extend: `supabase/tests/domain.test.sql`
- Create: `src/lib/repositories/course-repository.ts`

**Interfaces:**
- Produces: `EligibilityEmployee = { id: number; departmentId: number | null; position: string | null; jobFunction: string | null; status: "재직" | "휴직" | "퇴사"; hireDate: string }`
- Produces: `EligibilityDecision = { eligible: true; source: "rule" | "exception"; matchedGroup?: number } | { eligible: false; source: "rule" | "exception" | "not-configured" }`
- Produces: `evaluateRuleGroups(employee: EligibilityEmployee, groups: RuleGroup[], exceptions: EmployeeException[], asOf: string): EligibilityDecision`
- Produces RPC: `course_eligibility(course_id bigint, as_of date)`
- Produces RPC: `course_completion_summary(course_id bigint, as_of date, department_id bigint default null)`
- Produces: `getCourseSummary(courseId: number, asOf: string, departmentId?: number): Promise<CourseSummary>`

- [ ] **Step 1: AND/OR·예외·기준일 실패 테스트를 작성한다.**

```ts
it("OR 그룹 사이에서는 하나만 충족해도 대상이다", () => {
  const result = evaluateRuleGroups(
    { id: 7, departmentId: 3, position: "주임", jobFunction: "engineer", status: "재직", hireDate: "2020-01-10" },
    [
      { id: 1, rules: [{ field: "department", operator: "in", value: [1, 2] }] },
      { id: 2, rules: [{ field: "job_function", operator: "equals", value: "engineer" }] },
    ],
    [],
    "2026-09-17",
  );
  expect(result).toEqual({ eligible: true, source: "rule", matchedGroup: 2 });
});

it("직원 제외 예외가 일반 규칙보다 우선한다", () => {
  const employee = { id: 7, departmentId: 3, position: "주임", jobFunction: "engineer", status: "재직", hireDate: "2020-01-10" };
  expect(evaluateRuleGroups(employee, [], [{ employeeId: 7, mode: "exclude" }], "2026-09-17"))
    .toEqual({ eligible: false, source: "exception" });
});
```

- [ ] **Step 2: 순수 판정 함수를 구현한다.**

지원 필드는 `department`, `position`, `job_function`, `employment_status`, `hire_date`로 제한한다. 비어 있는 규칙은 전 직원 대상이 아니라 `not-configured`를 반환한다.

- [ ] **Step 3: 동일 규칙을 SQL RPC로 구현한다.**

`course_eligibility`는 기준일의 유효한 근무 이력을 사용하고, 퇴사자는 제외하며, 명시적 include/exclude 예외를 마지막에 적용한다. `course_completion_summary`는 취소되지 않았고 유효기간이 지나지 않은 수료만 직원별 1회로 계산한다.

- [ ] **Step 4: SQL과 TypeScript 결과의 계약 테스트를 추가한다.**

동일 fixture에 대해 대상 직원 ID, 분모, 분자, 미수료자 ID와 `no-targets` 상태가 일치하는지 검증한다.

- [ ] **Step 5: repository를 구현하고 검증·커밋한다.**

Run: `npm run test -- src/lib/domain`

Run: `npx supabase test db`

```powershell
git add src/lib/domain src/lib/repositories/course-repository.ts supabase/migrations/0005_product_v2_functions.sql supabase/tests/domain.test.sql
git commit -m "feat: calculate dynamic eligibility and completion rates"
```

---

## Phase 2 — 직원·조직과 과정 기준정보

### Task 6: 직원·부서·근무 이력 관리

**Files:**
- Create: `src/lib/validation/employee.ts`
- Test: `src/lib/validation/employee.test.ts`
- Create: `src/lib/repositories/employee-repository.ts`
- Replace: `src/app/employees/page.tsx`
- Create: `src/app/employees/actions.ts`
- Create: `src/app/employees/new/page.tsx`
- Replace: `src/app/employees/[id]/page.tsx`
- Create: `src/app/employees/[id]/actions.ts`
- Create: `src/components/employees/EmployeeForm.tsx`
- Create: `src/components/employees/EmploymentTimeline.tsx`
- Extend: `supabase/migrations/0005_product_v2_functions.sql`
- Extend: `supabase/tests/domain.test.sql`
- Test: `e2e/employee-lifecycle.spec.ts`

**Interfaces:**
- Produces: `employeeSchema`, `transferSchema`, `terminationSchema`.
- Produces actions: `createEmployee`, `transferEmployee`, `terminateEmployee`, `restoreEmployee`.
- Produces RPCs: `transfer_employee(employee_id bigint, department_id bigint, start_date date, position text, job_function text, reason text)`, `terminate_employee(employee_id bigint, resign_date date, reason text)`, `restore_employee(employee_id bigint, department_id bigint, restore_date date, reason text)`.
- Consumes: `getCurrentActor` and audit reason field.

- [ ] **Step 1: 직원·이동·퇴사 폼 검증 테스트를 작성한다.**

사번 공백·중복, 이메일 형식, 퇴사일이 입사일보다 빠른 경우, 이동일이 기존 이력과 겹치는 경우를 실패시킨다. 생년월일 필드는 새 폼과 조회 DTO에서 제외한다.

- [ ] **Step 2: Zod 스키마와 서버 action 상태 계약을 구현한다.**

```ts
export type EmployeeActionState = {
  status: "idle" | "error" | "success";
  fieldErrors: Record<string, string[]>;
  message?: string;
};
```

모든 action은 권한을 먼저 확인하고 검증된 필드만 RPC에 전달한 뒤 `revalidatePath`를 호출한다.

- [ ] **Step 3: 직원 목록을 Server Component로 교체한다.**

URL search params `q`, `department`, `position`, `jobFunction`, `status`, `page`를 repository에 전달한다. 서버 쿼리에서 페이지네이션하고 컬럼은 명시적으로 선택한다.

- [ ] **Step 4: 직원 생애주기 RPC를 구현한다.**

세 RPC는 기간 중복을 잠금과 제약으로 재검증하고 직원 상태·현재 근무 이력·감사 로그를 한 트랜잭션에서 변경한다. `transfer_employee`는 기존 현재 이력을 이동 전일로 종료하고 새 이력을 생성하며, `terminate_employee`는 현재 이력을 퇴사일로 종료하고, `restore_employee`는 새 현재 이력을 생성한다.

- [ ] **Step 5: 직원 상세와 근무 이력 타임라인을 구현한다.**

상세는 현재 정보, 현재 대상 미수료 과정, 과정별 수료 이력, 역량 태그, 근무 이력을 보여준다. 자격증·수상 편집 UI는 제거하되 기존 DB 데이터는 이관 종료 전 삭제하지 않는다.

- [ ] **Step 6: 생애주기 E2E를 통과시킨다.**

시나리오: HR 로그인 → 신규 직원 등록 → 첫 근무 이력 확인 → 부서 이동 → 기간 비중복 확인 → 퇴사 → 현재 대상자 집계에서 제외 → 과거 수료 이력 유지.

Run: `npm run check`

Run: `npm run test:e2e -- e2e/employee-lifecycle.spec.ts`

- [ ] **Step 7: 커밋한다.**

```powershell
git add src/lib/validation/employee.ts src/lib/validation/employee.test.ts src/lib/repositories/employee-repository.ts src/app/employees src/components/employees supabase/migrations/0005_product_v2_functions.sql supabase/tests/domain.test.sql e2e/employee-lifecycle.spec.ts
git commit -m "feat: manage employee and department history"
```

### Task 7: 과정·역량 태그·대상 조건 관리

**Files:**
- Create: `src/lib/validation/course.ts`
- Test: `src/lib/validation/course.test.ts`
- Replace: `src/app/courses/page.tsx`
- Create: `src/app/courses/actions.ts`
- Create: `src/app/courses/new/page.tsx`
- Replace: `src/app/courses/[id]/page.tsx`
- Create: `src/app/courses/[id]/actions.ts`
- Create: `src/components/courses/CourseForm.tsx`
- Create: `src/components/courses/EligibilityRuleBuilder.tsx`
- Create: `src/components/courses/EligibilityPreview.tsx`
- Test: `e2e/course-eligibility.spec.ts`

**Interfaces:**
- Produces: `courseSchema`, `eligibilityRuleSetSchema`.
- Produces actions: `createCourse`, `updateCourse`, `previewEligibility`, `saveEligibility`.
- Consumes: `course_eligibility`, `course_completion_summary` RPC.

- [ ] **Step 1: 과정 코드·상태·유효기간·규칙 그룹 검증 테스트를 작성한다.**

과정 코드는 대문자·숫자·하이픈만 허용하고, `validityMonths`는 null 또는 1~120 정수로 제한한다. 규칙 그룹이 0개면 저장은 허용하되 상태를 `대상 조건 미설정`으로 반환해야 한다.

- [ ] **Step 2: 과정 목록과 등록·수정 폼을 구현한다.**

기존 `is_active` 토글을 `운영 중/중단/종료` 상태 전환으로 교체한다. 과정 물리 삭제 버튼은 제거한다. 선택 사항인 선행 과정은 `course_prerequisites`에 저장하고 참고 정보로만 표시하며 자동 수강 제한에는 사용하지 않는다.

- [ ] **Step 3: 대상 조건 빌더를 구현한다.**

그룹 내부 AND, 그룹 간 OR를 시각적으로 분리한다. 지원 필드와 연산자만 선택할 수 있게 하고 직원 include/exclude 예외에는 사유를 필수로 받는다.

- [ ] **Step 4: 저장 전 영향 미리보기를 구현한다.**

미리보기는 현재 대상자 수, 수료자 수, 미수료자 수, 기존 조건 대비 증감과 직원 명단을 표시한다. 저장 버튼은 사용자가 변화 내용을 확인한 뒤 활성화한다.

- [ ] **Step 5: 대상 조건 E2E를 실행한다.**

시나리오: HR이 두 개 OR 그룹과 직원 제외 예외 설정 → 대상자 미리보기 → 저장 → 과정 상세의 분모·분자 확인 → 조건 제거 시 `대상 조건 미설정` 확인.

Run: `npm run test:e2e -- e2e/course-eligibility.spec.ts`

- [ ] **Step 6: 커밋한다.**

```powershell
git add src/lib/validation/course.ts src/lib/validation/course.test.ts src/app/courses src/components/courses e2e/course-eligibility.spec.ts
git commit -m "feat: manage courses and dynamic eligibility rules"
```

---

## Phase 3 — 차수 운영과 CSV 수료 반영

### Task 8: 교육 차수와 참여자 관리

**Files:**
- Create: `src/lib/validation/session.ts`
- Test: `src/lib/validation/session.test.ts`
- Create: `src/lib/repositories/session-repository.ts`
- Create: `src/app/sessions/page.tsx`
- Create: `src/app/sessions/actions.ts`
- Create: `src/app/sessions/new/page.tsx`
- Create: `src/app/sessions/[id]/page.tsx`
- Create: `src/app/sessions/[id]/actions.ts`
- Create: `src/components/sessions/SessionForm.tsx`
- Create: `src/components/sessions/ParticipantPicker.tsx`
- Test: `e2e/session-management.spec.ts`

**Interfaces:**
- Produces actions: `createSession`, `changeSessionStatus`, `addParticipants`, `removeParticipant`, `closeSession`, `cancelSession`.
- Consumes: 과정 미수료자 RPC 결과.

- [ ] **Step 1: 차수 상태 전이 테스트를 작성한다.**

허용 전이는 `예정 → 진행 중 → 결과 입력 → 마감`, 모든 비마감 상태에서 `취소`이다. `마감 → 결과 입력`은 HR 또는 관리자와 정정 사유가 있을 때만 허용한다.

- [ ] **Step 2: 차수 검증과 상태 전이 함수를 구현한다.**

종료일이 시작일보다 빠르거나 종료 과정에 차수를 개설하거나 취소 차수에 참여자를 추가하는 요청을 거부한다.

- [ ] **Step 3: 차수 목록·상세·참여자 선택 UI를 구현한다.**

참여자 선택기는 과정의 현재 미수료자를 기본 후보로 사용하고 부서·직급·직무 필터를 제공한다. 참여 여부와 과정 대상 여부를 별도 배지로 표시한다.

- [ ] **Step 4: 역할별 상태 변경 E2E를 작성·통과시킨다.**

강사는 담당 차수만 수정, 부서장은 조회만, HR은 마감 차수 재개 가능, 취소 차수는 집계 제외를 검증한다.

- [ ] **Step 5: 커밋한다.**

```powershell
git add src/lib/validation/session.ts src/lib/validation/session.test.ts src/lib/repositories/session-repository.ts src/app/sessions src/components/sessions e2e/session-management.spec.ts
git commit -m "feat: operate training sessions and participants"
```

### Task 9: CSV 파서와 검증 파이프라인

**Files:**
- Modify: `package.json`
- Create: `src/lib/imports/completion-csv.ts`
- Test: `src/lib/imports/completion-csv.test.ts`
- Create: `src/lib/validation/completion-import.ts`
- Create: `src/app/imports/completions/page.tsx`
- Create: `src/app/imports/completions/actions.ts`
- Create: `src/components/imports/ColumnMapper.tsx`
- Create: `src/components/imports/ValidationResults.tsx`
- Create: `test/fixtures/completions-valid.csv`
- Create: `test/fixtures/completions-errors.csv`

**Interfaces:**
- Produces: `ColumnMapping = { employeeNumber: string; completionDate: string; completionStatus: string; name?: string; score?: string; note?: string }`
- Produces: `ParsedCompletionRow = { rowNumber: number; employeeNumber: string; completionDate: string; completionStatus: "수료" | "미수료"; name?: string; score?: number; note?: string }`
- Produces: `parseCompletionCsv(input: Buffer, mapping: ColumnMapping): ParsedCompletionRow[]`
- Produces: `validateCompletionRows(rows, context): Promise<ImportValidationResult>`
- Produces: `ImportValidationResult = { valid: ValidRow[]; warnings: WarningRow[]; errors: ErrorRow[]; fileHash: string }`

- [ ] **Step 1: CSV 패키지를 설치한다.**

Run: `npm install zod csv-parse`

- [ ] **Step 2: 정상·오류 fixture와 실패 테스트를 작성한다.**

검증 항목은 필수 열, UTF-8/BOM, 잘못된 날짜, 알 수 없는 사번, 사번·이름 불일치, 파일 내 중복, 기존 결과 중복, 차수 기간 밖 수료일, 수료 여부 값이다.

```ts
expect(result.errors.map((row) => row.code)).toEqual([
  "UNKNOWN_EMPLOYEE",
  "DUPLICATE_IN_FILE",
  "INVALID_COMPLETION_DATE",
]);
```

- [ ] **Step 3: 파일 크기·행 수 제한과 파서를 구현한다.**

파일은 `.csv`, 최대 10MB, 최대 20,000행으로 제한한다. 원본 전체를 로그에 기록하지 않고 SHA-256 해시만 계산한다. 수식 주입 문자는 가져오기 시 원문으로 저장하되 내보내기에서 이스케이프한다.

- [ ] **Step 4: 열 매핑과 3단계 결과 UI를 구현한다.**

단계는 파일 선택 → 열 매핑 및 미리보기 → 정상·경고·오류 검증 결과이다. 오류가 있으면 기본적으로 최종 반영을 비활성화하고, 오류 행 제외를 명시적으로 선택한 경우에만 정상·확인된 경고 행을 다음 단계에 전달한다.

- [ ] **Step 5: 파서 테스트와 커밋을 수행한다.**

Run: `npm run test -- src/lib/imports/completion-csv.test.ts`

```powershell
git add package.json package-lock.json src/lib/imports src/lib/validation/completion-import.ts src/app/imports src/components/imports test/fixtures
git commit -m "feat: validate completion CSV imports"
```

### Task 10: CSV 원자적 반영과 수료 정정

**Files:**
- Extend: `supabase/migrations/0005_product_v2_functions.sql`
- Extend: `supabase/tests/domain.test.sql`
- Modify: `src/app/imports/completions/actions.ts`
- Create: `src/app/imports/completions/[batchId]/page.tsx`
- Modify: `src/app/sessions/[id]/page.tsx`
- Modify: `src/app/sessions/[id]/actions.ts`
- Test: `e2e/completion-import.spec.ts`

**Interfaces:**
- Produces RPC: `apply_completion_import(session_id bigint, file_name text, file_hash text, rows jsonb, exclude_error_rows boolean)`.
- Produces RPC: `cancel_completion(completion_id bigint, reason text)`.
- Produces action: `applyCompletionImport(state, formData): Promise<ImportActionState>`.

- [ ] **Step 1: 원자성 실패 테스트를 DB에 추가한다.**

한 행이라도 검증 오류가 있고 `exclude_error_rows=false`이면 수료·배치·행 테이블 어디에도 일부 반영이 없어야 한다. 동일 file hash 재요청은 새 수료 이력을 만들지 않고 기존 배치 결과를 반환해야 한다.

- [ ] **Step 2: 가져오기 RPC를 구현한다.**

RPC 내부에서 권한, 차수 상태, 담당 범위, 행 수, 직원 존재, 중복, 날짜를 다시 검증한다. UI 검증 결과를 신뢰하지 않는다. 성공 시 `import_batches`, `import_rows`, `course_completions`, `audit_logs`를 동일 트랜잭션으로 기록한다.

- [ ] **Step 3: 최종 반영 Server Action과 결과 페이지를 구현한다.**

결과 페이지는 신규 수료, 값 유지, 값 변경, 제외, 오류 건수와 행별 사유를 표시하며 검증 오류 CSV 다운로드를 제공한다.

- [ ] **Step 4: 수료 취소·정정 흐름을 구현한다.**

물리 삭제는 하지 않는다. 마감 차수 결과는 HR·관리자만 사유를 입력해 취소하거나 정정하고, 변경 전후 값과 처리자를 감사 로그에 기록한다.

- [ ] **Step 5: CSV E2E와 DB 테스트를 통과시킨다.**

시나리오: 정상 파일 전체 반영, 오류 파일 전체 취소, 오류 행 제외 반영, 동일 파일 재업로드 무변경, 마감 차수 강사 업로드 차단, HR 정정 성공.

Run: `npx supabase test db`

Run: `npm run test:e2e -- e2e/completion-import.spec.ts`

- [ ] **Step 6: 커밋한다.**

```powershell
git add supabase/migrations/0005_product_v2_functions.sql supabase/tests/domain.test.sql src/app/imports src/app/sessions e2e/completion-import.spec.ts
git commit -m "feat: apply audited completion imports atomically"
```

---

## Phase 4 — 대시보드, 검색, 리포트

### Task 11: 역할별 대시보드와 데이터 품질 지표

**Files:**
- Create: `src/lib/repositories/dashboard-repository.ts`
- Test: `src/lib/repositories/dashboard-repository.test.ts`
- Replace: `src/app/page.tsx`
- Create: `src/components/dashboard/RoleDashboard.tsx`
- Create: `src/components/dashboard/CourseCompletionChart.tsx`
- Create: `src/components/dashboard/DataQualityPanel.tsx`
- Modify: `src/components/StatCard.tsx`
- Modify: `src/components/Badge.tsx`
- Extend: `supabase/migrations/0005_product_v2_functions.sql`
- Extend: `supabase/tests/domain.test.sql`

**Interfaces:**
- Produces: `getDashboard(actor, asOf): Promise<DashboardModel>`.
- Consumes: 과정·부서별 집계 RPC와 RLS 범위.

- [ ] **Step 1: 역할별 DTO 테스트를 작성한다.**

관리자는 데이터 품질·가져오기 오류, HR은 전사 현황, 부서장은 관할 부서, 강사는 담당 과정, 일반 직원은 본인 이력, 임원은 승인 조직 집계만 받는지 확인한다.

- [ ] **Step 2: repository에서 필요한 컬럼과 범위만 조회한다.**

기존처럼 브라우저에서 전 테이블을 가져와 계산하지 않는다. 집계 RPC는 기준일, 분자, 분모, 제외 조건 설명과 마지막 집계 시각을 함께 반환한다.

- [ ] **Step 3: 지표 스냅샷과 추이 조회를 구현한다.**

`refresh_metric_snapshots(as_of date)` RPC가 과정·부서별 분자와 분모를 upsert하도록 구현하고, 직원·대상 규칙·수료 변경이 성공한 뒤 당일 스냅샷을 갱신한다. 월별·분기별 차트는 `metric_snapshots`에서 기간 말 최신 값을 조회하며, 비어 있는 과거 날짜를 0으로 보간하지 않는다.

- [ ] **Step 4: 역할별 대시보드를 구현한다.**

수료율 카드에는 `x명 / y명`, 기준일과 `대상자 없음` 상태를 표시한다. 차트와 상태는 색상 외 텍스트·아이콘으로도 구분한다.

- [ ] **Step 5: 데이터 품질 패널을 구현한다.**

현재 부서 없음, 대상 조건 미설정, 미매칭 CSV, 최근 대상자 변화, 집계 실패를 보여주고 수정 화면으로 연결한다.

- [ ] **Step 6: 검증·커밋한다.**

Run: `npm run check`

```powershell
git add src/lib/repositories/dashboard-repository.ts src/lib/repositories/dashboard-repository.test.ts src/app/page.tsx src/components/dashboard src/components/StatCard.tsx src/components/Badge.tsx supabase/migrations/0005_product_v2_functions.sql supabase/tests/domain.test.sql
git commit -m "feat: add role-aware operational dashboards"
```

### Task 12: 통합 검색과 개인 경력 조회

**Files:**
- Create: `src/lib/validation/search.ts`
- Test: `src/lib/validation/search.test.ts`
- Create: `src/lib/repositories/search-repository.ts`
- Replace: `src/app/search/page.tsx`
- Create: `src/components/search/SearchFilters.tsx`
- Create: `src/components/search/SearchResults.tsx`
- Modify: `src/app/employees/[id]/page.tsx`
- Test: `e2e/search-report.spec.ts`

**Interfaces:**
- Produces: `searchEmployees(filters, actor): Promise<Paginated<EmployeeSearchRow>>`.
- Filters: 이름, 사번, 부서, 직급, 직무, 재직 상태, 수료 과정, 미수료 과정, 역량 태그.

- [ ] **Step 1: 필터 정규화와 권한 범위 테스트를 작성한다.**

빈 문자열을 undefined로 변환하고 페이지 크기는 최대 100으로 제한한다. manager와 instructor에게 범위 밖 직원이 반환되지 않는 repository mock 테스트를 포함한다.

- [ ] **Step 2: 서버 검색 repository와 페이지를 구현한다.**

검색 조건은 URL에 직렬화해 공유·뒤로가기를 지원하고 서버에서 페이지네이션한다. 결과에는 현재 소속, 직급·직무, 관련 과정과 최근 수료일만 노출한다.

- [ ] **Step 3: 개인 상세를 PRD 구조로 완성한다.**

현재 정보, 수료 과정·차수·날짜, 현재 미수료 대상 과정, 역량 태그, 근무 이력 타임라인과 마지막 갱신 시각을 제공한다. 화면 상단에 `교육 수료 이력은 실제 숙련도 또는 업무 적합성을 단독으로 보증하지 않습니다.`를 표시한다.

- [ ] **Step 4: 역할 범위 검색 E2E를 통과시킨다.**

HR 전사 검색, 부서장 관할만 검색, 강사 담당 과정 참여자만 검색, 직원 본인만 조회를 검증한다.

- [ ] **Step 5: 커밋한다.**

```powershell
git add src/lib/validation/search.ts src/lib/validation/search.test.ts src/lib/repositories/search-repository.ts src/app/search src/components/search src/app/employees/[id]/page.tsx e2e/search-report.spec.ts
git commit -m "feat: search scoped employee training histories"
```

### Task 13: 리포트와 안전한 CSV 내보내기

**Files:**
- Create: `src/lib/exports/csv.ts`
- Test: `src/lib/exports/csv.test.ts`
- Create: `src/lib/repositories/report-repository.ts`
- Replace: `src/app/reports/page.tsx`
- Create: `src/app/reports/export/route.ts`
- Create: `src/components/reports/ReportFilters.tsx`
- Create: `src/components/reports/ReportTable.tsx`
- Modify: `e2e/search-report.spec.ts`

**Interfaces:**
- Produces: `escapeCsvCell(value: unknown): string`.
- Produces Route Handler: `GET /reports/export?type=course|department|session|employee&asOf=YYYY-MM-DD&...`.

- [ ] **Step 1: CSV 수식 주입과 따옴표 실패 테스트를 작성한다.**

```ts
expect(escapeCsvCell("=1+1")).toBe("'=1+1");
expect(escapeCsvCell("A,B")).toBe('"A,B"');
expect(escapeCsvCell("line1\nline2")).toBe('"line1\nline2"');
```

- [ ] **Step 2: CSV serializer를 구현한다.**

첫 문자가 `=`, `+`, `-`, `@`, 탭, 캐리지리턴이면 작은따옴표를 접두하고 RFC 4180 방식으로 쉼표·따옴표·줄바꿈을 이스케이프한다. UTF-8 BOM을 포함한다.

- [ ] **Step 3: 리포트 repository와 서버 렌더링 화면을 구현한다.**

과정별 전체·부서별, 부서별 과정, 차수별 수료생, 직원 개인 이력, 임원 요약을 제공한다. 모든 리포트에 생성 시각, 기준일, 생성자, 필터와 산식을 표시한다.

- [ ] **Step 4: 내보내기 Route Handler에 권한과 감사 기록을 추가한다.**

Route Handler는 actor와 요청 필터를 다시 검증하고 허용 범위 데이터만 스트리밍한다. 성공·실패 내보내기 모두 감사 로그에 유형, 필터, 행 수를 기록하며 응답에는 `Cache-Control: private, no-store`를 사용한다.

- [ ] **Step 5: 리포트 E2E와 커밋을 수행한다.**

Run: `npm run test -- src/lib/exports/csv.test.ts`

Run: `npm run test:e2e -- e2e/search-report.spec.ts`

```powershell
git add src/lib/exports src/lib/repositories/report-repository.ts src/app/reports src/components/reports e2e/search-report.spec.ts
git commit -m "feat: export audited training reports safely"
```

---

## Phase 5 — 데이터 전환과 출시

### Task 14: 기존 샘플 데이터 v2 이관과 구기능 제거

**Files:**
- Create: `supabase/migrations/0006_product_v2_backfill.sql`
- Create: `supabase/migrations/0007_product_v2_seed.sql`
- Extend: `supabase/tests/domain.test.sql`
- Delete: `src/app/mail/page.tsx`
- Modify: `src/components/Sidebar.tsx`
- Modify: `README.md`
- Create: `docs/operations/data-migration-runbook.md`

**Interfaces:**
- Migrates: `svc_team → departments/employment_history`.
- Migrates: `career_history → employment_history`.
- Migrates: `training_targets → eligibility_employee_exceptions(mode='include')` only when no rule can represent the legacy set.
- Migrates: `training_completions → legacy session per course + course_completions`.

- [ ] **Step 1: 이관 전후 불변식 테스트를 작성한다.**

퇴사자를 포함한 직원 수, 과정 수, 기존 수료 행 수가 보존되고, 과정별 고유 수료자 수가 이관 전후 동일한지 검증한다.

- [ ] **Step 2: 부서와 근무 이력을 이관한다.**

고유 `svc_team`을 부서로 생성하고 현재 이력이 없는 직원에는 입사일부터 현재 팀의 이력을 생성한다. 기존 이력의 날짜가 겹치면 마이그레이션을 실패시키고 운영 runbook의 정정 쿼리로 먼저 해결한다.

- [ ] **Step 3: 기존 수료를 legacy 차수로 이관한다.**

과정마다 `LEGACY-{course_id}` 차수를 만들고 기존 `training_completions`을 수료 이력으로 복사한다. 기존 대상자는 명시적 include 예외로 보존하되 운영자가 정식 규칙으로 교체하기 전 과정 상태를 `대상 조건 검토 필요`로 표시한다.

- [ ] **Step 4: 제외된 구기능과 직접 브라우저 DB 쓰기를 제거한다.**

메일 메뉴·페이지를 제거한다. `rg -n 'from\("|\.insert\(|\.update\(|\.delete\(' src/app` 결과에 허용되지 않은 브라우저 직접 변경 코드가 없는지 확인한다.

- [ ] **Step 5: 빈 로컬 DB와 기존 샘플 DB 두 경로를 검증한다.**

Run: `npx supabase db reset`

Run: `npx supabase test db`

Expected: 신규 설치와 기존 샘플 이관 모두 불변식 PASS.

- [ ] **Step 6: README와 운영 절차를 갱신하고 커밋한다.**

```powershell
git add supabase/migrations/0006_product_v2_backfill.sql supabase/migrations/0007_product_v2_seed.sql supabase/tests/domain.test.sql src/app/mail src/components/Sidebar.tsx README.md docs/operations/data-migration-runbook.md
git commit -m "chore: migrate legacy training data to v2"
```

### Task 15: 성능·접근성·오류 상태 강화

**Files:**
- Create: `src/app/loading.tsx`
- Create: `src/app/error.tsx`
- Create: `src/app/not-found.tsx`
- Create: `src/components/ui/DataTable.tsx`
- Create: `src/components/ui/EmptyState.tsx`
- Create: `src/components/ui/ErrorState.tsx`
- Modify: `src/app/globals.css`
- Create: `e2e/accessibility.spec.ts`
- Create: `scripts/performance-check.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces consistent loading, empty, error and stale-data states.
- Produces `npm run test:perf` for seeded-volume query checks.

- [ ] **Step 1: 접근성 회귀 테스트를 작성한다.**

주요 페이지의 heading 구조, form label, 키보드 탐색, table caption, 오류의 `aria-live`, 색상 외 상태 텍스트를 검사한다.

- [ ] **Step 2: 공통 상태와 표 컴포넌트를 구현한다.**

표는 서버 페이지네이션, 정렬 링크, 필터 요약, 빈 상태를 지원한다. 집계 오류 시 마지막 성공 시각과 오래된 데이터임을 표시하고 최신 수치처럼 보이지 않게 한다.

- [ ] **Step 3: 데이터베이스 인덱스와 쿼리 계획을 점검한다.**

직원 10,000명, 과정 1,000개, 차수 10,000개, 수료 1,000,000건 규모 seed에서 핵심 RPC에 `EXPLAIN (ANALYZE, BUFFERS)`를 실행한다. employee/course/session 외래키, 기준일 기간, 상태, 역량 태그 검색에 필요한 인덱스를 migration에 추가한다.

- [ ] **Step 4: CSV 20,000행과 화면 응답 목표를 검증한다.**

`scripts/performance-check.mjs`에서 CSV 검증 60초 이내, 주요 조회 서버 응답 3초 이내 목표를 측정하고 결과를 JSON artifact로 남긴다.

- [ ] **Step 5: 전체 품질 검증과 커밋을 수행한다.**

Run: `npm run check`

Run: `npm run build`

Run: `npm run test:e2e`

Run: `npm run test:perf`

```powershell
git add src/app/loading.tsx src/app/error.tsx src/app/not-found.tsx src/components/ui src/app/globals.css e2e/accessibility.spec.ts scripts/performance-check.mjs package.json package-lock.json supabase/migrations
git commit -m "test: harden performance accessibility and error states"
```

### Task 16: 운영 인수와 배포 준비

**Files:**
- Create: `docs/operations/deployment-checklist.md`
- Create: `docs/operations/backup-restore-runbook.md`
- Create: `docs/operations/csv-guide.md`
- Create: `docs/operations/role-management.md`
- Create: `docs/acceptance/phase-1-acceptance.md`
- Modify: `README.md`

**Interfaces:**
- Produces: 운영자가 반복 실행할 수 있는 배포·복구·권한·CSV 절차.
- Consumes: PRD 1차 출시 인수 기준 12개.

- [ ] **Step 1: PRD 인수 기준을 실행 가능한 체크리스트로 옮긴다.**

각 항목에 준비 데이터, 사용자 역할, 실행 단계, 예상 결과, 증거 캡처 위치, 승인자를 적는다. 성공/실패를 체크할 수 있게 하되 결과를 미리 기입하지 않는다.

- [ ] **Step 2: 운영 runbook을 작성한다.**

배포 순서, migration 백업, 실패 시 롤백 기준, 일별 백업 확인, 복구 시험, 역할 부여·회수, 수료 이의·정정, 표준 CSV 예시와 오류 코드 설명을 포함한다.

- [ ] **Step 3: 보안·복구 드라이런을 수행한다.**

익명 접근, 타 부서 URL 직접 접근, service-role 노출, 내보내기 감사, 백업 복원 후 행 수·해시 검증을 수행한다. 실패 항목이 있으면 출시를 중지한다.

- [ ] **Step 4: 최종 검증을 실행한다.**

Run: `npm ci`

Run: `npm run check`

Run: `npx supabase test db`

Run: `npm run build`

Run: `npm run test:e2e`

Expected: 모든 명령 exit code 0, PRD 인수 기준 12개 PASS.

- [ ] **Step 5: 출시 후보 커밋을 생성한다.**

```powershell
git add README.md docs/operations docs/acceptance
git commit -m "docs: prepare phase one operational release"
```

---

## Requirement Coverage Matrix

| PRD 요구사항 | 구현 Task |
|---|---|
| EMP-01~EMP-07, EMP-09 | Task 3, 4, 6, 14 |
| EMP-08(권장) | PRD 단계 2의 HR 연동·직원 CSV 계획으로 분리 |
| CRS-01~CRS-10 | Task 3, 5, 7 |
| SES-01~SES-07 | Task 3, 4, 8 |
| CMP-01~CMP-11 | Task 3, 4, 9, 10 |
| DSH-01~DSH-10 | Task 5, 7, 8, 11 |
| SRC-01~SRC-06 | Task 4, 12, 13 |
| RPT-01~RPT-07 | Task 11, 12, 13 |
| SEC-01~SEC-09 | Task 2, 4, 10, 13, 16 |
| 비기능 요구사항 | Task 1, 2, 4, 9, 10, 13, 15, 16 |
| 1차 출시 인수 기준 1~12 | Task 6~16, 최종 확인 Task 16 |

---

## Stage Gates

각 단계 종료 시 다음 단계로 이동하기 전에 아래를 확인한다.

1. 단계에 포함된 unit, DB, E2E 테스트가 모두 통과한다.
2. 신규 migration을 빈 DB와 직전 단계 DB 양쪽에 적용할 수 있다.
3. 역할별 허용·차단 사례가 최소 한 건씩 자동화되어 있다.
4. 감사 대상 변경이 `audit_logs`에 남는다.
5. 화면 수치와 DB RPC 결과의 분자·분모가 일치한다.
6. 관련 PRD 요구사항 ID가 coverage matrix에 연결되어 있다.
7. 다음 단계가 의존하는 인터페이스와 타입이 문서 및 코드에 고정되어 있다.

## Recommended Delivery Order

- **Sprint 1:** Task 1~4 — 테스트, 인증, v2 스키마, RLS·감사.
- **Sprint 2:** Task 5~7 — 대상자·수료율, 직원·조직, 과정·조건.
- **Sprint 3:** Task 8~10 — 차수, CSV 검증, 원자적 반영.
- **Sprint 4:** Task 11~13 — 대시보드, 검색, 리포트.
- **Sprint 5:** Task 14~16 — 데이터 전환, 품질 강화, 운영 인수.

Sprint 길이는 팀 상황에 따라 조정할 수 있지만 Task 순서는 데이터·보안 의존성 때문에 유지한다. Task 6과 Task 7, Task 11과 Task 12는 선행 인터페이스가 확정된 뒤 병렬 진행할 수 있다.
