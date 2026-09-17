import { describe, expect, it } from "vitest";
import { getSafeNextPath, isDemoMode } from "./guards";

describe("auth session helpers", () => {
  it("keeps only local redirect paths", () => {
    expect(getSafeNextPath("/employees")).toBe("/employees");
    expect(getSafeNextPath("https://example.com/steal")).toBe("/");
    expect(getSafeNextPath("//example.com/steal")).toBe("/");
    expect(getSafeNextPath(null)).toBe("/");
  });

  it("defaults to demo mode unless production auth is explicitly enabled", () => {
    expect(isDemoMode(undefined)).toBe(true);
    expect(isDemoMode("true")).toBe(true);
    expect(isDemoMode("false")).toBe(false);
  });
});
