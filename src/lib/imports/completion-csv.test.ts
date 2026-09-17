import { describe, expect, it } from "vitest";
import { parseCompletionCsv } from "./completion-csv";

describe("parseCompletionCsv", () => {
  it("parses numeric employee numbers and Korean headers", () => {
    const [row] = parseCompletionCsv("사번,이름,수료일,수료여부\n2020031234,홍길동,2026-09-01,수료");
    expect(row).toMatchObject({ employeeNumber: 2020031234, completionDate: "2026-09-01", status: "completed", error: null });
  });
  it("rejects non-numeric or non-10-digit employee numbers", () => {
    const [row] = parseCompletionCsv("employee_number,completion_date\nE-1001,2026-09-01");
    expect(row.error).toContain("10자리");
  });
});
