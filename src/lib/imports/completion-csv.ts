export type CompletionCsvRow = { rowNumber: number; employeeNumber: number | null; completionDate: string | null; status: "completed" | "failed" | "absent" | "cancelled"; name: string | null; error: string | null };

function splitLine(line: string) {
  return line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
}

export function parseCompletionCsv(csv: string): CompletionCsvRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const headers = splitLine(lines[0]).map((header) => header.toLowerCase());
  const employeeIndex = headers.findIndex((header) => ["employee_number", "사번", "employee number"].includes(header));
  const dateIndex = headers.findIndex((header) => ["completion_date", "수료일", "completion date"].includes(header));
  const statusIndex = headers.findIndex((header) => ["status", "수료여부", "결과"].includes(header));
  const nameIndex = headers.findIndex((header) => ["name", "이름"].includes(header));
  return lines.slice(1).map((line, index) => {
    const values = splitLine(line); const rawNumber = employeeIndex >= 0 ? values[employeeIndex] : "";
    const employeeNumber = /^\d{10}$/.test(rawNumber) ? Number(rawNumber) : null;
    const rawStatus = statusIndex >= 0 ? values[statusIndex] : "수료";
    const status = rawStatus === "미수료" ? "failed" : rawStatus === "결석" ? "absent" : rawStatus === "취소" ? "cancelled" : "completed";
    const completionDate = dateIndex >= 0 ? values[dateIndex] : null;
    let error: string | null = employeeIndex < 0 ? "사번 컬럼이 없습니다." : employeeNumber === null ? "10자리 숫자 사번이 아닙니다." : null;
    if (!error && status === "completed" && (!completionDate || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate))) error = "수료일 형식이 올바르지 않습니다.";
    return { rowNumber: index + 2, employeeNumber, completionDate, status, name: nameIndex >= 0 ? values[nameIndex] ?? null : null, error };
  });
}
