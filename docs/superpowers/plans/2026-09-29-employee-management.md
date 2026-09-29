# Employee Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 직원·조직 메뉴를 Supabase 기반의 검색·등록·편집 관리 화면으로 전환한다.

**Architecture:** 목록은 URL query를 서버 조회 조건으로 사용하고, 직원 등록·수정은 서버 액션에서 인증·검증 후 Supabase에 저장한다. 상세 화면은 실제 `employees`와 관련 이력을 조회하며, 수정 액션은 기존 값과 비교해 변경된 필드만 update한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase SSR, Vitest.

**Spec:** `docs/superpowers/specs/2026-09-29-employee-management-design.md`

## Global Constraints

- 부서는 기존 스키마 호환성을 위해 선택한 부서명을 `employees.svc_team`에 저장한다.
- 필수 등록값은 이름, 사번, 입사일, 부서, 상태다.
- 직원 insert/update는 서버 액션에서 인증과 허용 필드를 재검증한다.
- 변경되지 않은 필드는 Supabase update payload에 포함하지 않는다.

## Review Focus

- 사번 중복: 등록 시 사용자에게 명확한 오류를 표시한다. (Task 3)
- 잘못된 상태/날짜/사번 입력: 서버 검증으로 저장하지 않는다. (Task 3)
- 검색 조건 조합 및 빈 결과: URL query와 빈 상태를 유지한다. (Task 2)
- 변경 없는 편집 저장: update를 호출하지 않고 상세 화면으로 돌아간다. (Task 4)
- 권한 없는 insert/update: RLS가 거부해야 한다. (Task 1)

### Task 1: Employee write schema and authorization

**Files:**
- Create: `supabase/migrations/0009_employee_write_policies.sql`
- Test: `src/lib/schema/security-contract.test.ts`

**Interfaces:**
- Produces authenticated insert/update grants and policies for `public.employees`.

- [ ] **Step 1: Write the failing security contract test** asserting the migration contains employee insert/update policies and grants for authenticated roles.
- [ ] **Step 2: Run `npm test src/lib/schema/security-contract.test.ts` and verify the new assertions fail.**
- [ ] **Step 3: Add idempotent insert/update policies using `private.has_any_role(auth.uid(), array['system_admin','hr','manager'])` and grant insert/update to `authenticated`.**
- [ ] **Step 4: Run the security contract test and verify it passes.**
- [ ] **Step 5: Commit the migration and contract test.**

### Task 2: Server-side employee filtering

**Files:**
- Modify: `src/lib/repositories/employee-repository.ts`
- Modify: `src/app/employees/page.tsx`
- Test: `src/lib/repositories/employee-repository.test.ts`

**Interfaces:**
- Produces `getEmployeeList(filters?: { query?: string; department?: string; status?: string })`.

- [ ] **Step 1: Add failing repository tests for name/employee-number search, department filter, status filter, and combined filters.**
- [ ] **Step 2: Run the focused tests and verify they fail because the filter interface is absent.**
- [ ] **Step 3: Implement server-side Supabase filters and connect `/employees` query params `q`, `department`, and `status` to a GET filter form.**
- [ ] **Step 4: Add empty-result messaging while preserving the active query values.**
- [ ] **Step 5: Run focused tests, lint, and typecheck.**

### Task 3: New employee registration

**Files:**
- Create: `src/app/employees/actions.ts`
- Create: `src/app/employees/new/page.tsx`
- Modify: `src/app/employees/page.tsx`
- Test: `src/lib/validation/employee.test.ts`

**Interfaces:**
- Produces `createEmployee(formData: FormData): Promise<void>` server action.

- [ ] **Step 1: Write failing validation tests for required fields, valid statuses, date format, and 10-digit employee number.**
- [ ] **Step 2: Run the focused tests and verify they fail before the validation helper exists.**
- [ ] **Step 3: Implement validation and the registration form with department/status selects.**
- [ ] **Step 4: Insert only validated fields, map unique-constraint errors to a duplicate employee-number message, and redirect to `/employees` on success.**
- [ ] **Step 5: Run validation tests and typecheck.**

### Task 4: Supabase employee detail and changed-field editing

**Files:**
- Modify: `src/lib/repositories/employee-repository.ts`
- Modify: `src/app/employees/actions.ts`
- Modify: `src/app/employees/[id]/page.tsx`
- Test: `src/lib/validation/employee.test.ts`

**Interfaces:**
- Produces `getEmployeeDetail(employeeId: number)` and `updateEmployee(formData: FormData): Promise<void>`.

- [ ] **Step 1: Add failing tests for changed-field payload generation and no-op updates.**
- [ ] **Step 2: Run focused tests and verify they fail.**
- [ ] **Step 3: Replace demo profile loading with Supabase employee, department, completion, and employment-history reads.**
- [ ] **Step 4: Add read/edit mode and update only fields whose submitted values differ from the original values.**
- [ ] **Step 5: Run the full test suite, lint, typecheck, and production build.**

### Task 5: Integration verification and deployment

- [ ] **Step 1: Execute the full verification commands: `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`.**
- [ ] **Step 2: Review the diff for accidental demo-data dependencies or unrestricted writes.**
- [ ] **Step 3: Commit the completed employee-management implementation.**
- [ ] **Step 4: Push `main` after explicit deployment approval.**
