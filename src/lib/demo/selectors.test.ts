import { describe, expect, it } from "vitest";
import { courses, departments, employees, sessions } from "./data";
import {
  getCourseOverview,
  getDepartmentOverview,
  getEmployeeProfile,
  getNextSessionCandidates,
  getSessionOverview,
} from "./selectors";

describe("demo training flow selectors", () => {
  it("calculates one course from eligible employees, not session attendance", () => {
    expect(getCourseOverview(101)).toMatchObject({
      eligibleCount: 6,
      completedCount: 4,
      incompleteCount: 2,
      rate: 66.7,
    });
  });

  it("returns no rate when a course has no eligibility rule", () => {
    expect(getCourseOverview(104)).toMatchObject({
      eligibleCount: 0,
      completedCount: 0,
      rate: null,
      eligibilityState: "not-configured",
    });
  });

  it("groups current course status by department", () => {
    const platform = getDepartmentOverview(1);
    expect(platform).toMatchObject({ employeeCount: 3, requiredCount: 7, completedCount: 6 });
    expect(platform.courseRows).toHaveLength(3);
  });

  it("finds eligible employees who have not completed the course", () => {
    expect(getNextSessionCandidates(101).map((employee) => employee.id)).toEqual([3, 6]);
  });

  it("keeps personal training and department history together", () => {
    const profile = getEmployeeProfile(2);
    expect(profile.employee.name).toBe("이서연");
    expect(profile.completions.map((completion) => completion.courseName)).toContain("Nuvera 314 기본 유지보수");
    expect(profile.departmentHistory).toHaveLength(2);
  });

  it("calculates session attendance separately from course completion", () => {
    expect(getSessionOverview(203)).toMatchObject({ participantCount: 9, completedCount: 6, rate: 66.7 });
  });

  it("exposes enough sample records to demonstrate the full flow", () => {
    expect(employees).toHaveLength(10);
    expect(departments).toHaveLength(3);
    expect(courses).toHaveLength(4);
    expect(sessions).toHaveLength(4);
  });
});
