import { describe, expect, it } from "vitest";
import { parseSearchTerms, rankEmployeeMatches, type SearchCandidate } from "./ranking";

const candidates: SearchCandidate[] = [
  { id: 1, employeeNumber: 2000000001, name: "김민준", departmentName: "플랫폼기술팀", position: "팀장", jobFunction: "기술 리더", historyDepartments: ["필드서비스팀"], courseNames: ["Nuvera 314 고급 트러블슈팅"], incompleteCourseNames: [] },
  { id: 2, employeeNumber: 2000000002, name: "이서연", departmentName: "플랫폼기술팀", position: "대리", jobFunction: "시스템 엔지니어", historyDepartments: [], courseNames: [], incompleteCourseNames: ["전기안전 정기교육"] },
];

describe("integrated search ranking", () => {
  it("splits Korean and comma separated terms", () => {
    expect(parseSearchTerms("플랫폼기술팀, Nuvera 314")).toEqual(["플랫폼기술팀", "nuvera", "314"]);
  });

  it("ranks an exact employee number ahead of course matches", () => {
    const results = rankEmployeeMatches(candidates, ["2000000001"]);
    expect(results[0]?.id).toBe(1);
    expect(results[0]?.score).toBeGreaterThan(0);
  });

  it("uses OR semantics and returns match sources", () => {
    const results = rankEmployeeMatches(candidates, ["필드서비스팀", "전기안전"]);
    expect(results.map((result) => result.id)).toEqual([1, 2]);
    expect(results[0]?.matches).toContain("부서 이력");
    expect(results[1]?.matches).toContain("미수료 과정");
  });
});
