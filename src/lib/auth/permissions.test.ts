import { describe, expect, it } from "vitest";
import { actorWith, can, type AppRole } from "./permissions";

describe("role permissions", () => {
  it("limits a manager to managed departments", () => {
    const actor = actorWith({ role: "manager", departmentIds: [10] });
    expect(can(actor, "employee:read", { departmentId: 10, employeeId: 7 })).toBe(true);
    expect(can(actor, "employee:read", { departmentId: 11, employeeId: 8 })).toBe(false);
  });

  it("limits an employee to their own record", () => {
    const actor = actorWith({ role: "employee", employeeId: 7 });
    expect(can(actor, "employee:read", { departmentId: 10, employeeId: 7 })).toBe(true);
    expect(can(actor, "employee:read", { departmentId: 10, employeeId: 8 })).toBe(false);
  });

  it("allows system administrators to read and manage all resources", () => {
    const actor = actorWith({ role: "system_admin" });
    expect(can(actor, "employee:read", { departmentId: 99, employeeId: 1 })).toBe(true);
    expect(can(actor, "employee:write", { departmentId: 99, employeeId: 1 })).toBe(true);
  });

  it("rejects unknown roles", () => {
    const actor = actorWith({ role: "employee" as AppRole, employeeId: 1 });
    expect(can(actor, "employee:write", { departmentId: 1, employeeId: 1 })).toBe(false);
  });
});
