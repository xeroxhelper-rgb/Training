export type CompletionCsvRow = { rowNumber: number; employeeNumber: number | null; completionDate: string | null; status: "completed" | "failed" | "absent" | "cancelled"; name: string | null; error: string | null };

function splitLine(line: string) {
  return line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
}

export function parseCompletionCsv(csv: string): CompletionCsvRow[] {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 1) return [];
  const headers = splitLine(lines[0]).map((header) => header.toLowerCase());
  const employeeIndex = headers.findIndex((header) => ["employee_number", "사번", "employee number"].includes(header));
  const dateIndex = headers.findIndex((header) => ["completion_date", "수료일", "completion date"].includes(header));
  const statusIndex = headers.findIndex((header) => ["status", "수료여부", "결과"].includes(header));
  const nameIndex = headers.findIndex((header) => ["name", "이름"].includes(header));
  const hasHeader = employeeIndex >= 0 || dateIndex >= 0 || statusIndex >= 0;
  const dataLines = hasHeader ? lines.slice(1) : lines;
  const effectiveEmployeeIndex = hasHeader ? employeeIndex : 0;
  const effectiveDateIndex = hasHeader ? dateIndex : 2;
  const effectiveStatusIndex = hasHeader ? statusIndex : 3;
  const effectiveNameIndex = hasHeader ? nameIndex : 1;
  return dataLines.map((line, index) => {
    const values = splitLine(line);
    const rawEmployeeNumber = values[effectiveEmployeeIndex] ?? "";
    const employeeNumber = /^\d{10}$/.test(rawEmployeeNumber) ? Number(rawEmployeeNumber) : null;
    const rawStatus = values[effectiveStatusIndex] ?? "수료";
    const status = rawStatus === "미수료" ? "failed" : rawStatus === "결석" ? "absent" : rawStatus === "취소" ? "cancelled" : "completed";
    const completionDate = values[effectiveDateIndex] ?? null;
    let error: string | null = employeeNumber === null ? "10자리 숫자 사번이 아닙니다." : null;
    if (!error && status === "completed" && (!completionDate || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate))) error = "수료일 형식이 올바르지 않습니다.";
    return { rowNumber: hasHeader ? index + 2 : index + 1, employeeNumber, completionDate, status, name: values[effectiveNameIndex] ?? null, error };
  });
}
