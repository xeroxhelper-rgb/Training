import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { Actor, AppRole, RoleScope } from "./permissions";
export { getSafeNextPath, isDemoMode } from "./guards";
import { isDemoMode } from "./guards";

export async function getCurrentUser() {
  if (isDemoMode()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentActor(): Promise<Actor | null> {
  if (isDemoMode()) return null;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: scopes } = await supabase
    .from("user_role_scopes")
    .select("role, department_id, course_id")
    .eq("user_id", user.id);

  const roles: RoleScope[] = (scopes ?? []).map((scope) => ({
    role: scope.role as AppRole,
    departmentIds: scope.department_id == null ? [] : [scope.department_id],
    courseIds: scope.course_id == null ? [] : [scope.course_id],
  }));

  return {
    userId: user.id,
    employeeId: typeof user.user_metadata?.employee_id === "number" ? user.user_metadata.employee_id : null,
    roles,
  };
}
