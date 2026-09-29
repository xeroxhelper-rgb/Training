export type SearchCandidate = {
  id: number;
  employeeNumber: number;
  name: string;
  departmentName: string;
  position: string;
  jobFunction: string;
  historyDepartments: string[];
  courseNames: string[];
  incompleteCourseNames: string[];
};

export type SearchResult = SearchCandidate & { score: number; matches: string[] };

export function parseSearchTerms(query: string): string[] {
  return Array.from(new Set(query.split(/[\s,]+/).map((term) => term.trim().toLowerCase()).filter(Boolean)));
}

function includesTerm(values: string[], term: string) {
  return values.some((value) => value.toLowerCase().includes(term));
}

export function rankEmployeeMatches(candidates: SearchCandidate[], terms: string[]): SearchResult[] {
  if (!terms.length) return candidates.map((candidate) => ({ ...candidate, score: 0, matches: [] }));
  return candidates.flatMap((candidate) => {
    let score = 0;
    const matches = new Set<string>();
    for (const term of terms) {
      let termScore = 0;
      if (String(candidate.employeeNumber) === term) { termScore = Math.max(termScore, 1000); matches.add("사번"); }
      if (candidate.name.toLowerCase() === term) { termScore = Math.max(termScore, 900); matches.add("이름"); }
      else if (candidate.name.toLowerCase().includes(term)) { termScore = Math.max(termScore, 700); matches.add("이름"); }
      if (candidate.departmentName.toLowerCase().includes(term)) { termScore = Math.max(termScore, 500); matches.add("현재 부서"); }
      if (includesTerm(candidate.historyDepartments, term)) { termScore = Math.max(termScore, 450); matches.add("부서 이력"); }
      if (includesTerm(candidate.courseNames, term)) { termScore = Math.max(termScore, 400); matches.add("수료 과정"); }
      if (includesTerm(candidate.incompleteCourseNames, term)) { termScore = Math.max(termScore, 350); matches.add("미수료 과정"); }
      if (candidate.position.toLowerCase().includes(term) || candidate.jobFunction.toLowerCase().includes(term)) { termScore = Math.max(termScore, 250); matches.add("직무"); }
      score += termScore;
    }
    if (!matches.size) return [];
    return [{ ...candidate, score: score + matches.size * 100, matches: Array.from(matches) }];
  }).sort((left, right) => right.score - left.score || left.name.localeCompare(right.name, "ko"));
}
