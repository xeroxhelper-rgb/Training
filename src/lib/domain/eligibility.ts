export type EligibilityEmployee = {
  id: number;
  departmentId: number | null;
  position: string | null;
  jobFunction: string | null;
  status: "재직" | "휴직" | "퇴사";
  hireDate: string;
};

export type RuleField = "department" | "position" | "job_function" | "employment_status" | "hire_date";
export type RuleOperator = "equals" | "not_equals" | "contains" | "in";
export type EligibilityRule = { field: RuleField; operator: RuleOperator; value: string | number | Array<string | number> };
export type EligibilityRuleGroup = { id: number; rules: EligibilityRule[] };
export type EligibilityException = { employeeId: number; mode: "include" | "exclude" };
export type EligibilityDecision =
  | { eligible: true; source: "rule" | "exception"; matchedGroup?: number }
  | { eligible: false; source: "rule" | "exception" | "not-configured" };

function fieldValue(employee: EligibilityEmployee, field: RuleField): string | number | null {
  switch (field) {
    case "department": return employee.departmentId;
    case "position": return employee.position;
    case "job_function": return employee.jobFunction;
    case "employment_status": return employee.status;
    case "hire_date": return employee.hireDate;
  }
}

function matches(rule: EligibilityRule, employee: EligibilityEmployee): boolean {
  const actual = fieldValue(employee, rule.field);
  if (actual === null) return false;
  const values = Array.isArray(rule.value) ? rule.value : [rule.value];
  const actualText = String(actual);
  switch (rule.operator) {
    case "equals": return actualText === String(values[0]);
    case "not_equals": return actualText !== String(values[0]);
    case "contains": return actualText.toLowerCase().includes(String(values[0]).toLowerCase());
    case "in": return values.some((value) => actualText === String(value));
  }
}

export function evaluateRuleGroups(
  employee: EligibilityEmployee,
  groups: EligibilityRuleGroup[],
  exceptions: EligibilityException[],
  _asOf: string,
): EligibilityDecision {
  void _asOf;
  const exception = exceptions.find((item) => item.employeeId === employee.id);
  if (exception?.mode === "exclude") return { eligible: false, source: "exception" };
  if (exception?.mode === "include") return { eligible: true, source: "exception" };
  if (groups.length === 0) return { eligible: false, source: "not-configured" };
  const matched = groups.find((group) => group.rules.length > 0 && group.rules.every((rule) => matches(rule, employee)));
  return matched ? { eligible: true, source: "rule", matchedGroup: matched.id } : { eligible: false, source: "rule" };
}
