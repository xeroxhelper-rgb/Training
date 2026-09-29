import { describe, expect, it } from "vitest";
import { buildReportPdf } from "./pdf";

describe("report pdf", () => {
  it("creates a downloadable PDF with Korean report content", async () => {
    const bytes = await buildReportPdf({ title: "교육 이수 현황", generatedAt: "2026-09-29", scope: "전사", summary: { participants: 10, completed: 8, rate: 80 }, rows: [{ label: "플랫폼기술팀", target: 10, completed: 8, incomplete: 2, rate: 80 }] });
    expect(bytes.length).toBeGreaterThan(100);
    expect(new TextDecoder().decode(bytes.slice(0, 5))).toBe("%PDF-");
  });
});
