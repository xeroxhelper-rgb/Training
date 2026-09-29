export type CompletionRow = {
  employee_id: number;
  status: string;
  completion_date: string | null;
};

export function getChangedCompletionRows(submitted: CompletionRow[], existing: CompletionRow[]): CompletionRow[] {
  const existingByEmployee = new Map(existing.map((row) => [row.employee_id, row]));
  const latestByEmployee = new Map(submitted.map((row) => [row.employee_id, row]));
  return Array.from(latestByEmployee.values()).filter((row) => {
    const previous = existingByEmployee.get(row.employee_id);
    return !previous || previous.status !== row.status || previous.completion_date !== row.completion_date;
  });
}
