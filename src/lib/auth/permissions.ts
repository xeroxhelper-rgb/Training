export type AppRole = "system_admin" | "hr" | "manager" | "instructor" | "employee" | "executive";

export type RoleScope = {
  role: AppRole;
  departmentIds: number[];
  courseIds: number[];
};

export type Actor = {
  userId: string;
  employeeId: number | null;
  roles: RoleScope[];
};

export type Action = "employee:read" | "employee:write" | "course:read" | "course:write";
export type Resource = { departmentId?: number | null; employeeId?: number | null; courseId?: number | null };

export function actorWith(scope: Partial<RoleScope> & { employeeId?: number }): Actor {
  return {
    userId: "test-user",
    employeeId: scope.employeeId ?? null,
    roles: [{ role: scope.role ?? "employee", departmentIds: scope.departmentIds ?? [], courseIds: scope.courseIds ?? [] }],
  };
}

export function can(actor: Actor, action: Action, resource: Resource): boolean {
  if (actor.roles.some(({ role }) => role === "system_admin")) return true;

  return actor.roles.some((scope) => {
    if (scope.role === "employee") {
      return action === "employee:read" && resource.employeeId === actor.employeeId;
    }
    if (scope.role === "executive") {
      return action === "employee:read" || action === "course:read";
    }
    if (scope.role === "hr") {
      return action === "employee:read" || action === "employee:write" || action === "course:read";
    }
    if (scope.role === "manager") {
      const inDepartment = resource.departmentId != null && scope.departmentIds.includes(resource.departmentId);
      return inDepartment && (action === "employee:read" || action === "course:read");
    }
    if (scope.role === "instructor") {
      const ownsCourse = resource.courseId != null && scope.courseIds.includes(resource.courseId);
      return ownsCourse && (action === "course:read" || action === "course:write");
    }
    return false;
  });
}
