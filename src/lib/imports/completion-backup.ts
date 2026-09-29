export const COMPLETION_BACKUP_HEADERS = [
  "employee_number", "employee_name", "department_name", "course_code", "course_name",
  "session_id", "session_number", "status", "completion_date",
] as const;

export type CompletionBackupStatus = "completed" | "failed" | "absent" | "cancelled";
export type CompletionBackupRow = {
  employeeNumber: number;
  employeeName: string;
  departmentName: string;
  courseCode: string;
  courseName: string;
  sessionId: number;
  sessionNumber: number;
  status: CompletionBackupStatus;
  completionDate: string | null;
};

export type CompletionBackupFilters = {
  department?: string;
  courseId?: number;
  employeeNumber?: number;
  sessionId?: number;
};

export type CompletionBackupCompletion = { employee_id: number; status: string; completion_date: string | null };

export function applyCompletionBackup(submitted: CompletionBackupCompletion[], existing: CompletionBackupCompletion[]) {
  const existingByEmployee = new Map(existing.map((row) => [row.employee_id, row]));
  return submitted.filter((row) => {
    const previous = existingByEmployee.get(row.employee_id);
    return !previous || previous.status !== row.status || previous.completion_date !== row.completion_date;
  });
}

function parseLine(line: string): string[] {
  const values: string[] = [];
  let value = "";
  let quoted = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    if (char === '"') {
      if (quoted && line[index + 1] === '"') { value += '"'; index += 1; }
      else quoted = !quoted;
    } else if (char === "," && !quoted) { values.push(value.trim()); value = ""; }
    else value += char;
  }
  values.push(value.trim());
  return values;
}

function quote(value: string | number | null) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

export function parseCompletionBackup(csv: string): { rows: CompletionBackupRow[]; errors: string[] } {
  const lines = csv.replace(/^\uFEFF/, "").split(/\r?\n/).filter((line) => line.trim());
  if (lines.length === 0) return { rows: [], errors: ["CSV 파일이 비어 있습니다."] };
  const headers = parseLine(lines[0]).map((header) => header.toLowerCase());
  const indexes = new Map(COMPLETION_BACKUP_HEADERS.map((header) => [header, headers.indexOf(header)]));
  const missing = COMPLETION_BACKUP_HEADERS.filter((header) => indexes.get(header) === -1);
  if (missing.length) return { rows: [], errors: [`필수 헤더가 없습니다: ${missing.join(", ")}`] };
  const rows: CompletionBackupRow[] = [];
  const errors: string[] = [];
  lines.slice(1).forEach((line, offset) => {
    const rowNumber = offset + 2;
    const values = parseLine(line);
    const value = (header: typeof COMPLETION_BACKUP_HEADERS[number]) => values[indexes.get(header) ?? -1] ?? "";
    const employeeNumber = Number(value("employee_number"));
    const sessionId = Number(value("session_id"));
    const sessionNumber = Number(value("session_number"));
    const status = value("status") as CompletionBackupStatus;
    const rowErrors: string[] = [];
    if (!/^\d{10}$/.test(value("employee_number"))) rowErrors.push("사번이 10자리 숫자가 아닙니다.");
    if (!Number.isInteger(sessionId) || sessionId <= 0) rowErrors.push("session_id가 올바르지 않습니다.");
    if (!Number.isInteger(sessionNumber) || sessionNumber <= 0) rowErrors.push("차수 번호가 올바르지 않습니다.");
    if (!["completed", "failed", "absent", "cancelled"].includes(status)) rowErrors.push("상태가 올바르지 않습니다.");
    const completionDate = value("completion_date") || null;
    if (status === "completed" && (!completionDate || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate))) rowErrors.push("수료일 형식이 올바르지 않습니다.");
    if (rowErrors.length) { errors.push(`${rowNumber}행: ${rowErrors.join(" ")}`); return; }
    rows.push({ employeeNumber, employeeName: value("employee_name"), departmentName: value("department_name"), courseCode: value("course_code"), courseName: value("course_name"), sessionId, sessionNumber, status, completionDate });
  });
  return { rows, errors };
}

export function serializeCompletionBackup(rows: CompletionBackupRow[]): string {
  return [COMPLETION_BACKUP_HEADERS.join(","), ...rows.map((row) => [row.employeeNumber, row.employeeName, row.departmentName, row.courseCode, row.courseName, row.sessionId, row.sessionNumber, row.status, row.completionDate].map(quote).join(","))].join("\n");
}
