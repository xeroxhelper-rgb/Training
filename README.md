# SkillFlow — 기술교육 이수 관리 프로토타입

기술 교육 대상자와 수료 현황을 한눈에 확인하기 위한 1차 화면 프로토타입입니다.

현재 버전은 Supabase에 연결하지 않고 샘플 데이터로 전체 업무 흐름을 확인합니다.

## 실행

```bash
npm install
npm run dev
```

브라우저에서 `http://localhost:3000`을 엽니다.

## 확인 가능한 흐름

- 대시보드: 재직자 기준, 과정 대상 조건, 수료율, 다음 차수 후보
- 직원·조직: 직원 목록, 현재 소속, 개인 교육·부서 이력
- 교육 과정: 과정별 대상자·수료자·미수료자와 부서별 현황
- 교육 차수: 차수별 참여자와 수료 결과
- CSV 가져오기: 열 매핑, 정상·경고·오류 행 검증 미리보기
- 통합 검색: 교육 이력과 역량 태그 기반 직원 탐색
- 분석·리포트: 조직별·과정별 현황과 내보내기 화면

현재 버튼과 CSV 반영은 화면 흐름만 제공하며 실제 저장되지 않습니다. 다음 단계에서 Supabase 스키마, Auth/RLS, 실제 CSV 트랜잭션을 연결합니다.

## 인증 기반

- Supabase SSR 클라이언트와 쿠키 세션 경계를 추가했습니다.
- `/login` 로그인 화면과 `/auth/confirm` PKCE 콜백 경로를 제공합니다.
- 로컬 프로토타입을 계속 확인하려면 `NEXT_PUBLIC_DEMO_MODE=true`를 사용합니다. Supabase Auth 연결 시에는 `false`로 바꾸고 `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`를 설정합니다.

## 검증

```bash
npm test
npm run lint
npm run typecheck
npm run build
```

## 문서

- 제품 요구사항: [`docs/PRD_기술교육이수현황시스템.md`](docs/PRD_기술교육이수현황시스템.md)
- 단계별 구현 계획: [`docs/superpowers/plans/2026-09-17-training-completion-system.md`](docs/superpowers/plans/2026-09-17-training-completion-system.md)
