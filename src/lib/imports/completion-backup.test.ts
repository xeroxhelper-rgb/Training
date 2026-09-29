import { describe, expect, it } from "vitest";
import { parseCompletionBackup, serializeCompletionBackup } from "./completion-backup";

describe("completion backup csv", () => {
  it("parses the standard header and quoted values", () => {
    const rows = parseCompletionBackup("employee_number,employee_name,department_name,course_code,course_name,session_id,session_number,status,completion_date\n2000000001,홍길동,\"A,팀\",SEC-001,보안 교육,3,1,completed,2026-09-01");
    expect(rows.errors).toEqual([]);
    expect(rows.rows[0]).toMatchObject({ employeeNumber: 2000000001, sessionId: 3, status: "completed", departmentName: "A,팀" });
  });

  it("reports missing identifiers and invalid statuses by row", () => {
    const result = parseCompletionBackup("employee_number,employee_name,department_name,course_code,course_name,session_id,session_number,status,completion_date\n,홍길동,A,SEC-001,보안,3,1,unknown,");
    expect(result.rows).toHaveLength(0);
    expect(result.errors[0]).toContain("사번");
    expect(result.errors[0]).toContain("상태");
  });

  it("round trips the standard columns", () => {
    const csv = serializeCompletionBackup([{ employeeNumber: 2000000001, employeeName: "홍길동", departmentName: "A팀", courseCode: "SEC-001", courseName: "보안 교육", sessionId: 3, sessionNumber: 1, status: "completed", completionDate: "2026-09-01" }]);
    const result = parseCompletionBackup(csv);
    expect(result.errors).toEqual([]);
    expect(result.rows[0]?.courseCode).toBe("SEC-001");
  });
});
