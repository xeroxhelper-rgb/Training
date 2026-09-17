import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync("supabase/migrations/0003_product_v2_core.sql", "utf8");

describe("v2 schema migration contract", () => {
  it("keeps the legacy tables and introduces the completion domain", () => {
    expect(migration).toContain("create table if not exists public.departments");
    expect(migration).toContain("create table if not exists public.employment_history");
    expect(migration).toContain("create table if not exists public.training_sessions");
    expect(migration).toContain("create table if not exists public.course_completions");
    expect(migration).not.toMatch(/drop\s+table/i);
  });

  it("protects employee history and completion integrity with database constraints", () => {
    expect(migration).toContain("exclude using gist");
    expect(migration).toContain("unique (session_id, employee_id)");
    expect(migration).toContain("check (ends_at >= starts_at)");
  });
});
