export type EmployeeStatus = "재직" | "휴직" | "퇴사";
export type CourseStatus = "운영 중" | "중단" | "종료";
export type SessionStatus = "예정" | "진행 중" | "결과 입력" | "마감" | "취소";

export interface Department {
  id: number;
  code: string;
  name: string;
}

export interface DepartmentHistory {
  departmentId: number;
  position: string;
  startDate: string;
  endDate: string | null;
  reason: string;
}

export interface DemoEmployee {
  id: number;
  employeeNumber: string;
  name: string;
  departmentId: number;
  position: string;
  jobFunction: string;
  status: EmployeeStatus;
  hireDate: string;
  email: string;
  departmentHistory: DepartmentHistory[];
}

export interface DemoCourse {
  id: number;
  code: string;
  name: string;
  category: string;
  description: string;
  status: CourseStatus;
  tags: string[];
  owner: string;
  validityMonths: number | null;
  eligibilityState: "configured" | "not-configured";
  eligibilityLabel: string;
  eligibleEmployeeIds: number[];
}

export interface DemoSession {
  id: number;
  courseId: number;
  round: string;
  startDate: string;
  endDate: string;
  instructor: string;
  mode: string;
  status: SessionStatus;
  participantIds: number[];
  completedEmployeeIds: number[];
}

export const departments: Department[] = [
  { id: 1, code: "PLT", name: "플랫폼기술팀" },
  { id: 2, code: "FLD", name: "필드서비스팀" },
  { id: 3, code: "SOL", name: "솔루션지원팀" },
];

export const employees: DemoEmployee[] = [
  {
    id: 1, employeeNumber: "E-1001", name: "김민준", departmentId: 1, position: "팀장", jobFunction: "기술 리더",
    status: "재직", hireDate: "2012-04-01", email: "minjun.kim@example.com",
    departmentHistory: [{ departmentId: 1, position: "팀장", startDate: "2020-01-01", endDate: null, reason: "승진" }],
  },
  {
    id: 2, employeeNumber: "E-1002", name: "이서연", departmentId: 1, position: "대리", jobFunction: "시스템 엔지니어",
    status: "재직", hireDate: "2016-09-01", email: "seoyeon.lee@example.com",
    departmentHistory: [
      { departmentId: 2, position: "사원", startDate: "2016-09-01", endDate: "2020-12-31", reason: "입사" },
      { departmentId: 1, position: "대리", startDate: "2021-01-01", endDate: null, reason: "전배 및 승진" },
    ],
  },
  {
    id: 3, employeeNumber: "E-1003", name: "박도윤", departmentId: 1, position: "주임", jobFunction: "시스템 엔지니어",
    status: "재직", hireDate: "2019-03-15", email: "doyoon.park@example.com",
    departmentHistory: [{ departmentId: 1, position: "주임", startDate: "2019-03-15", endDate: null, reason: "입사" }],
  },
  {
    id: 4, employeeNumber: "E-1004", name: "최지우", departmentId: 2, position: "과장", jobFunction: "필드 엔지니어",
    status: "재직", hireDate: "2014-05-01", email: "jiwoo.choi@example.com",
    departmentHistory: [{ departmentId: 2, position: "과장", startDate: "2014-05-01", endDate: null, reason: "입사" }],
  },
  {
    id: 5, employeeNumber: "E-1005", name: "정하윤", departmentId: 2, position: "사원", jobFunction: "필드 엔지니어",
    status: "재직", hireDate: "2025-08-01", email: "hayoon.jung@example.com",
    departmentHistory: [{ departmentId: 2, position: "사원", startDate: "2025-08-01", endDate: null, reason: "입사" }],
  },
  {
    id: 6, employeeNumber: "E-1006", name: "강서준", departmentId: 2, position: "대리", jobFunction: "필드 엔지니어",
    status: "재직", hireDate: "2017-02-01", email: "seojun.kang@example.com",
    departmentHistory: [{ departmentId: 2, position: "대리", startDate: "2017-02-01", endDate: null, reason: "입사" }],
  },
  {
    id: 7, employeeNumber: "E-1007", name: "조은우", departmentId: 3, position: "과장", jobFunction: "솔루션 아키텍트",
    status: "재직", hireDate: "2013-07-01", email: "eunwoo.jo@example.com",
    departmentHistory: [{ departmentId: 3, position: "과장", startDate: "2013-07-01", endDate: null, reason: "입사" }],
  },
  {
    id: 8, employeeNumber: "E-1008", name: "윤지호", departmentId: 3, position: "주임", jobFunction: "솔루션 엔지니어",
    status: "재직", hireDate: "2020-01-10", email: "jiho.yoon@example.com",
    departmentHistory: [{ departmentId: 3, position: "주임", startDate: "2020-01-10", endDate: null, reason: "입사" }],
  },
  {
    id: 9, employeeNumber: "E-1009", name: "한예준", departmentId: 3, position: "사원", jobFunction: "솔루션 엔지니어",
    status: "휴직", hireDate: "2024-01-15", email: "yejun.han@example.com",
    departmentHistory: [{ departmentId: 3, position: "사원", startDate: "2024-01-15", endDate: null, reason: "입사" }],
  },
  {
    id: 10, employeeNumber: "E-1010", name: "임수아", departmentId: 3, position: "대리", jobFunction: "솔루션 엔지니어",
    status: "퇴사", hireDate: "2018-06-01", email: "sua.lim@example.com",
    departmentHistory: [{ departmentId: 3, position: "대리", startDate: "2018-06-01", endDate: "2026-06-30", reason: "퇴사" }],
  },
];

export const courses: DemoCourse[] = [
  {
    id: 101, code: "N314-BASE", name: "Nuvera 314 기본 유지보수", category: "제품 기술",
    description: "Nuvera 314 장비의 구조, 정기 점검, 기본 장애 대응을 다루는 필수 과정입니다.",
    status: "운영 중", tags: ["Nuvera 314", "유지보수", "장비 진단"], owner: "교육운영팀 김강사",
    validityMonths: null, eligibilityState: "configured", eligibilityLabel: "플랫폼기술팀 또는 필드서비스팀 재직자", eligibleEmployeeIds: [1, 2, 3, 4, 5, 6],
  },
  {
    id: 102, code: "SAFE-ELEC", name: "전기안전 정기교육", category: "법정·안전",
    description: "전 임직원을 대상으로 하는 연간 전기안전 필수 과정입니다.",
    status: "운영 중", tags: ["전기안전", "필수교육"], owner: "안전환경팀 박강사",
    validityMonths: 12, eligibilityState: "configured", eligibilityLabel: "퇴사자를 제외한 전 직원", eligibleEmployeeIds: [1, 2, 3, 4, 5, 6, 7, 8, 9],
  },
  {
    id: 103, code: "N314-ADV", name: "Nuvera 314 고급 트러블슈팅", category: "전문 기술",
    description: "복합 장애 분석과 고급 진단 절차를 실습하는 심화 과정입니다.",
    status: "운영 중", tags: ["Nuvera 314", "트러블슈팅", "고급진단"], owner: "교육운영팀 이강사",
    validityMonths: 24, eligibilityState: "configured", eligibilityLabel: "과장 이상 또는 기술 리더·아키텍트", eligibleEmployeeIds: [1, 4, 7, 8],
  },
  {
    id: 104, code: "AI-SERVICE", name: "AI 기반 서비스 진단 입문", category: "신규 과정",
    description: "서비스 로그 분석에 AI 도구를 활용하는 신규 파일럿 과정입니다.",
    status: "중단", tags: ["AI", "로그 분석"], owner: "DX추진팀 오강사",
    validityMonths: null, eligibilityState: "not-configured", eligibilityLabel: "대상 조건 미설정", eligibleEmployeeIds: [],
  },
];

export const sessions: DemoSession[] = [
  {
    id: 201, courseId: 101, round: "2026년 1차", startDate: "2026-03-10", endDate: "2026-03-11",
    instructor: "김강사", mode: "기술교육장 A", status: "마감", participantIds: [1, 2, 4, 5], completedEmployeeIds: [1, 2, 4, 5],
  },
  {
    id: 202, courseId: 101, round: "2026년 2차", startDate: "2026-10-20", endDate: "2026-10-21",
    instructor: "김강사", mode: "기술교육장 A", status: "예정", participantIds: [3, 6], completedEmployeeIds: [],
  },
  {
    id: 203, courseId: 102, round: "2026년 정기", startDate: "2026-08-17", endDate: "2026-08-17",
    instructor: "박강사", mode: "온라인", status: "결과 입력", participantIds: [1, 2, 3, 4, 5, 6, 7, 8, 9], completedEmployeeIds: [1, 2, 3, 4, 6, 7],
  },
  {
    id: 204, courseId: 103, round: "2026년 1차", startDate: "2026-05-22", endDate: "2026-05-23",
    instructor: "이강사", mode: "기술교육장 B", status: "마감", participantIds: [1, 4, 7, 8], completedEmployeeIds: [1, 4, 7],
  },
];
