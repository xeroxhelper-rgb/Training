import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/0004_product_v2_security.sql", "utf8");

describe("v2 security migration contract", () => {
  it("does not expose business tables to anonymous clients", () => {
    expect(migration).toContain("revoke all on all tables in schema public from anon");
    expect(migration).toContain("grant select on public.employees");
    expect(migration).toContain("to authenticated using (private.can_view_employee(employee_id))");
  });

  it("defines security definer helpers with an empty search path", () => {
    expect(migration).toContain("private.can_view_employee");
    expect(migration).toContain("private.can_manage_course");
    expect(migration).toContain("security definer set search_path = ''");
  });
});
