import { describe, expect, it } from "vitest";
import { validateCourseInput, validateSessionInput } from "./training-admin";

describe("training administration validation", () => {
  it("accepts a complete course payload", () => {
    const result = validateCourseInput({
      courseCode: "SEC-001",
      courseName: "보안 교육",
      targetModel: "전 직원",
      description: "기본 보안 교육",
      validityMonths: 12,
      status: "active",
      thresholdPercent: 80,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a course without a code or name", () => {
    const result = validateCourseInput({
      courseCode: "",
      courseName: "",
      status: "draft",
      thresholdPercent: 80,
    });
    expect(result.success).toBe(false);
  });

  it("accepts a session with an ordered date range", () => {
    const result = validateSessionInput({
      courseId: 1,
      sessionNumber: 1,
      startsAt: "2026-10-01",
      endsAt: "2026-10-02",
      location: "온라인",
      instructorName: "김강사",
      capacity: 20,
      status: "planned",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a session whose end date precedes its start date", () => {
    const result = validateSessionInput({
      courseId: 1,
      sessionNumber: 1,
      startsAt: "2026-10-03",
      endsAt: "2026-10-02",
      status: "planned",
    });
    expect(result.success).toBe(false);
  });
});
