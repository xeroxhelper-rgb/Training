import { courses, departments, employees, sessions } from "./data";

export function rate(completed: number, eligible: number): number | null {
  if (eligible === 0) return null;
  return Math.round((completed / eligible) * 1000) / 10;
}

export function getCourseCompletedEmployeeIds(courseId: number): number[] {
  return Array.from(new Set(
    sessions
      .filter((session) => session.courseId === courseId && session.status !== "취소")
      .flatMap((session) => session.completedEmployeeIds),
  ));
}

export function getCourseOverview(courseId: number) {
  const course = courses.find((item) => item.id === courseId);
  if (!course) throw new Error(`Course ${courseId} not found`);

  const completedIds = getCourseCompletedEmployeeIds(courseId);
  const completedEligibleIds = course.eligibleEmployeeIds.filter((id) => completedIds.includes(id));
  const incompleteIds = course.eligibleEmployeeIds.filter((id) => !completedIds.includes(id));

  const departmentRows = departments.map((department) => {
    const eligibleIds = course.eligibleEmployeeIds.filter(
      (id) => employees.find((employee) => employee.id === id)?.departmentId === department.id,
    );
    const completedCount = eligibleIds.filter((id) => completedIds.includes(id)).length;
    return {
      department,
      eligibleCount: eligibleIds.length,
      completedCount,
      incompleteCount: eligibleIds.length - completedCount,
      rate: rate(completedCount, eligibleIds.length),
    };
  }).filter((row) => row.eligibleCount > 0);

  return {
    course,
    eligibilityState: course.eligibilityState,
    eligibleCount: course.eligibleEmployeeIds.length,
    completedCount: completedEligibleIds.length,
    incompleteCount: incompleteIds.length,
    rate: rate(completedEligibleIds.length, course.eligibleEmployeeIds.length),
    completedEmployees: employees.filter((employee) => completedEligibleIds.includes(employee.id)),
    incompleteEmployees: employees.filter((employee) => incompleteIds.includes(employee.id)),
    departmentRows,
    courseSessions: sessions.filter((session) => session.courseId === courseId),
  };
}

export function getDepartmentOverview(departmentId: number) {
  const department = departments.find((item) => item.id === departmentId);
  if (!department) throw new Error(`Department ${departmentId} not found`);
  const departmentEmployees = employees.filter(
    (employee) => employee.departmentId === departmentId && employee.status !== "퇴사",
  );
  const employeeIds = departmentEmployees.map((employee) => employee.id);
  const courseRows = courses
    .filter((course) => course.eligibilityState === "configured")
    .map((course) => {
      const overview = getCourseOverview(course.id);
      const eligibleIds = course.eligibleEmployeeIds.filter((id) => employeeIds.includes(id));
      const completedIds = getCourseCompletedEmployeeIds(course.id);
      const completedCount = eligibleIds.filter((id) => completedIds.includes(id)).length;
      return {
        course,
        eligibleCount: eligibleIds.length,
        completedCount,
        incompleteCount: eligibleIds.length - completedCount,
        rate: rate(completedCount, eligibleIds.length),
        overview,
      };
    })
    .filter((row) => row.eligibleCount > 0);

  const requiredCount = courseRows.reduce((sum, row) => sum + row.eligibleCount, 0);
  const completedCount = courseRows.reduce((sum, row) => sum + row.completedCount, 0);
  return {
    department,
    employees: departmentEmployees,
    employeeCount: departmentEmployees.length,
    requiredCount,
    completedCount,
    incompleteCount: requiredCount - completedCount,
    rate: rate(completedCount, requiredCount),
    courseRows,
  };
}

export function getNextSessionCandidates(courseId: number) {
  return getCourseOverview(courseId).incompleteEmployees.filter((employee) => employee.status !== "퇴사");
}

export function getSessionOverview(sessionId: number) {
  const session = sessions.find((item) => item.id === sessionId);
  if (!session) throw new Error(`Session ${sessionId} not found`);
  const course = courses.find((item) => item.id === session.courseId);
  if (!course) throw new Error(`Course ${session.courseId} not found`);
  return {
    session,
    course,
    participants: employees.filter((employee) => session.participantIds.includes(employee.id)),
    completedEmployees: employees.filter((employee) => session.completedEmployeeIds.includes(employee.id)),
    participantCount: session.participantIds.length,
    completedCount: session.completedEmployeeIds.length,
    incompleteCount: session.participantIds.length - session.completedEmployeeIds.length,
    rate: rate(session.completedEmployeeIds.length, session.participantIds.length),
  };
}

export function getEmployeeProfile(employeeId: number) {
  const employee = employees.find((item) => item.id === employeeId);
  if (!employee) throw new Error(`Employee ${employeeId} not found`);
  const completions = courses.flatMap((course) => {
    const completedSession = sessions.find(
      (session) => session.courseId === course.id && session.completedEmployeeIds.includes(employeeId),
    );
    if (!completedSession) return [];
    return [{
      courseId: course.id,
      courseName: course.name,
      sessionId: completedSession.id,
      round: completedSession.round,
      completionDate: completedSession.endDate,
      tags: course.tags,
    }];
  });
  const incompleteCourses = courses.filter(
    (course) => course.eligibleEmployeeIds.includes(employeeId) && !getCourseCompletedEmployeeIds(course.id).includes(employeeId),
  );
  return {
    employee,
    department: departments.find((department) => department.id === employee.departmentId)!,
    departmentHistory: employee.departmentHistory.map((history) => ({
      ...history,
      departmentName: departments.find((department) => department.id === history.departmentId)?.name ?? "알 수 없음",
    })),
    completions,
    incompleteCourses,
  };
}
