"use client";

import { useState } from "react";

export default function CompletionToggle({ employeeId, initialCompleted, name }: { employeeId: number; initialCompleted: boolean; name: string }) {
  const [completed, setCompleted] = useState(initialCompleted);
  return <label className="inline-flex cursor-pointer items-center gap-3"><input type="checkbox" name="completed_employee_id" value={employeeId} checked={completed} onChange={(event) => setCompleted(event.target.checked)} aria-label={`${name} 수료 여부`} className="peer sr-only" /><span className="relative h-7 w-14 rounded-full bg-slate-300 transition peer-checked:bg-emerald-600 after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:transition peer-checked:after:translate-x-7" /><span className={`text-sm font-medium ${completed ? "text-emerald-700" : "text-slate-600"}`}>{completed ? "수료" : "미수료"}</span></label>;
}
