import { describe, expect, it } from "vitest";
import { getChangedCompletionRows, type CompletionRow } from "./changed-rows";

describe("getChangedCompletionRows", () => {
  it("returns no rows when submitted values match existing values", () => {
    const rows: CompletionRow[] = [{ employee_id: 1, status: "completed", completion_date: "2026-09-29" }];
    expect(getChangedCompletionRows(rows, rows)).toEqual([]);
  });

  it("returns only new or changed completion rows", () => {
    const existing: CompletionRow[] = [{ employee_id: 1, status: "failed", completion_date: null }];
    const submitted: CompletionRow[] = [
      { employee_id: 1, status: "completed", completion_date: "2026-09-29" },
      { employee_id: 2, status: "failed", completion_date: null },
    ];
    expect(getChangedCompletionRows(submitted, existing)).toEqual(submitted);
  });
});
