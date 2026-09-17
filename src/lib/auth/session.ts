import "server-only";
import { createClient } from "@/lib/supabase/server";
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
