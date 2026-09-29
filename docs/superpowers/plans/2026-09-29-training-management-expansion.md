# 교육 관리 기능 확장 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 과정·차수 등록, 필터 기반 CSV 백업/복원, 직원 관련성 검색, 서버 생성 PDF 리포트를 실제 Supabase 업무 흐름으로 제공한다.

**Architecture:** 기존 Next.js App Router와 서버 액션/리포지토리 패턴을 유지한다. 과정·차수 및 CSV는 Supabase RLS가 적용된 서버 액션과 API route로 처리하고, 통합 검색은 검색 전용 리포지토리에서 직원 연관 데이터를 조합해 점수화한다. 리포트는 서버 route에서 한글 폰트를 포함한 PDF를 생성해 다운로드한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Supabase SSR, Zod, Vitest, `pdf-lib`, `@fontsource/noto-sans-kr`.

**Spec:** `docs/superpowers/specs/2026-09-29-training-management-expansion-design.md`

## Global Constraints

- 과정·차수 생성 및 수정은 인증된 관리자·HR 권한으로 제한한다.
- CSV 표준 식별자는 `employee_number + session_id`다.
- CSV 행 오류는 유효한 행의 반영을 막지 않고 감사 기록에 남긴다.
- 검색 키워드는 공백 또는 쉼표로 나눈 OR 조건이다.
- PDF는 서버에서 생성하며 한글 폰트를 포함한다.
- 변경된 행과 레코드만 Supabase에 업데이트한다.

## Review Focus

- 과정 코드와 차수 번호 중복: 저장 전에 명확한 오류를 표시하고 DB에도 unique 제약을 둔다. (Task 2)
- CSV 식별자 누락·존재하지 않는 직원/차수: 해당 행만 거부하고 나머지는 계속 반영한다. (Task 3)
- 같은 백업 CSV 재업로드: 중복 수료 레코드를 만들지 않고 변경이 없으면 update를 생략한다. (Task 3)
- 검색 키워드가 비어 있거나 한글·사번·부서명이 섞인 경우: 전체 결과 또는 OR 점수 결과를 안정적으로 반환한다. (Task 4)
- 한글 과정명과 표가 포함된 PDF: 다운로드 파일에서 글자가 깨지지 않는다. (Task 5)

### Task 1: Course and session domain contracts

**Files:**
- Modify: `src/types/database.ts`
- Modify: `src/lib/repositories/course-repository.ts`
- Modify: `src/lib/repositories/session-repository.ts`
- Create: `src/lib/validation/training-admin.ts`
- Test: `src/lib/validation/training-admin.test.ts`

**Interfaces:**
- Produces `CourseInput`, `SessionInput`, `validateCourseInput`, `validateSessionInput` for server actions.
- Produces repository functions `createCourse`, `createSession`, `getCourseOptions` with typed returns.

- [ ] **Step 1: Write validation tests** for required course name/code, valid status, positive threshold/validity, session date ordering, and positive capacity.
- [ ] **Step 2: Run `npm test -- src/lib/validation/training-admin.test.ts`** and verify the new tests fail before implementation.
- [ ] **Step 3: Implement the Zod schemas and typed repository insert helpers** using the existing Supabase server client and database types.
- [ ] **Step 4: Run the focused validation test and `npm run typecheck`**; expect PASS.
- [ ] **Step 5: Commit** `feat: add training administration contracts`.

### Task 2: Course registration and session opening

**Files:**
- Create: `supabase/migrations/0011_training_admin_policies.sql`
- Create: `src/app/courses/new/page.tsx`
- Create: `src/app/courses/new/actions.ts`
- Create: `src/app/sessions/new/page.tsx`
- Create: `src/app/sessions/new/actions.ts`
- Modify: `src/app/courses/page.tsx`
- Modify: `src/app/sessions/page.tsx`
- Test: `src/app/courses/new/actions.test.ts`, `src/app/sessions/new/actions.test.ts`

**Interfaces:**
- Consumes validation and repository contracts from Task 1.
- Produces form actions `createCourseAction(formData: FormData)` and `createSessionAction(formData: FormData)`.

- [ ] **Step 1: Add failing action tests** for successful inserts, duplicate course code, duplicate course/session number, invalid date range, and unauthorized role.
- [ ] **Step 2: Run the focused tests** and verify expected failures.
- [ ] **Step 3: Add migration 0011** with unique constraints and insert/update policies for `training_courses` and `training_sessions`, limited to system admin/HR scopes.
- [ ] **Step 4: Implement course and session server actions** with auth checks, validation, duplicate handling, `revalidatePath`, and redirect targets.
- [ ] **Step 5: Implement forms** with accessible labels, pending state, validation messages, and links from existing page header buttons.
- [ ] **Step 6: Run focused tests, lint, and typecheck**; expect PASS.
- [ ] **Step 7: Commit** `feat: add course and session creation`.

### Task 3: Filtered CSV export and backup import

**Files:**
- Create: `src/lib/imports/completion-backup.ts`
- Create: `src/lib/imports/completion-backup.test.ts`
- Create: `src/app/imports/completions/export/route.ts`
- Modify: `src/app/imports/completions/actions.ts`
- Modify: `src/app/imports/completions/page.tsx`
- Modify: `src/lib/repositories/session-repository.ts`

**Interfaces:**
- Produces `CompletionBackupFilters`, `CompletionBackupRow`, `parseCompletionBackup`, `serializeCompletionBackup`, and `applyCompletionBackup`.
- Export route accepts URL parameters for scope, department, course, employee, and session and returns `text/csv`.

- [ ] **Step 1: Write parser/serializer tests** for the standard header, quoted commas, UTF-8 BOM, invalid status, missing identifiers, and round-trip serialization.
- [ ] **Step 2: Run `npm test -- src/lib/imports/completion-backup.test.ts`** and verify failures.
- [ ] **Step 3: Implement strict row normalization** with `employee_number + session_id` as the key and row-level error objects.
- [ ] **Step 4: Implement export query and CSV response** using the selected filters and stable columns from the spec.
- [ ] **Step 5: Extend the import action** to create an import batch, validate each row, update only changed `course_completions`, and write `import_rows` errors without aborting valid rows.
- [ ] **Step 6: Replace the page UI** with shared filters, export button, file upload, preview/error summary, and apply button while preserving the existing session-specific flow.
- [ ] **Step 7: Run import tests, lint, typecheck, and build**; expect PASS.
- [ ] **Step 8: Commit** `feat: add filtered completion csv backup flow`.

### Task 4: Supabase-backed ranked integrated search

**Files:**
- Create: `src/lib/repositories/search-repository.ts`
- Create: `src/lib/search/ranking.ts`
- Create: `src/lib/search/ranking.test.ts`
- Modify: `src/app/search/page.tsx`

**Interfaces:**
- Produces `SearchResult`, `parseSearchTerms`, and `rankEmployeeMatches`.
- Search repository returns employee profiles with matched sources and score inputs.

- [ ] **Step 1: Write ranking tests** for exact employee number/name, course-name match, department-history match, multi-term OR matches, and empty terms.
- [ ] **Step 2: Run the focused ranking tests** and verify failures.
- [ ] **Step 3: Implement deterministic term parsing and weighted ranking** with exact matches ahead of contains matches and multi-term bonus.
- [ ] **Step 4: Implement the Supabase repository query** joining employees, departments, employment history, completions, courses, and eligibility data; avoid demo imports.
- [ ] **Step 5: Replace the search page** with debounced query parameters, course/department filters, result source tags, and stable loading/error states.
- [ ] **Step 6: Run focused tests, lint, typecheck, and build**; expect PASS.
- [ ] **Step 7: Commit** `feat: add ranked employee search`.

### Task 5: Server-generated PDF reports

**Files:**
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `src/lib/reports/pdf.ts`
- Create: `src/app/reports/pdf/route.ts`
- Create: `src/lib/reports/pdf.test.ts`
- Modify: `src/app/reports/page.tsx`

**Interfaces:**
- Produces `ReportPdfInput` and `buildReportPdf(input: ReportPdfInput): Promise<Uint8Array>`.
- PDF route accepts the current report filters and returns `application/pdf` with a download filename.

- [ ] **Step 1: Add the PDF dependencies and a failing PDF test** asserting non-empty PDF bytes, report title text, and Korean font registration.
- [ ] **Step 2: Run the focused PDF test** and verify failure before implementation.
- [ ] **Step 3: Implement PDF layout** with embedded Noto Sans KR font, title/metadata, summary metrics, and a paginated data table.
- [ ] **Step 4: Implement the PDF route** to load report data with the existing repository and validate query filters.
- [ ] **Step 5: Replace the inert print button** with a PDF download link/button retaining current filters.
- [ ] **Step 6: Run PDF test, lint, typecheck, and build**; expect PASS.
- [ ] **Step 7: Commit** `feat: add downloadable report pdf`.

### Task 6: Integration verification and release readiness

**Files:**
- Modify: `src/app/globals.css` only if new form/table states need shared styling
- Create or modify: relevant integration tests under `src/**`

- [ ] **Step 1: Run `npm test`** and confirm all tests pass.
- [ ] **Step 2: Run `npm run lint` and `npm run typecheck`** and fix only issues caused by this feature set.
- [ ] **Step 3: Run `npm run build`** and verify the production bundle succeeds.
- [ ] **Step 4: Manually verify the five acceptance flows**: create course, open session, filtered CSV round trip, ranked search, and PDF download.
- [ ] **Step 5: Commit any verification-only fixes** with a focused message.
