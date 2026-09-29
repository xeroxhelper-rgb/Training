import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PDFDocument, rgb, type PDFFont } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";

export type ReportPdfInput = {
  title: string;
  generatedAt: string;
  scope: string;
  summary: { participants: number; completed: number; rate: number };
  rows: { label: string; target: number; completed: number; incomplete: number; rate: number }[];
};

async function loadKoreanFont() {
  const path = join(process.cwd(), "public", "fonts", "noto-sans-kr-119-400-normal.woff");
  return new Uint8Array(await readFile(path));
}

export async function buildReportPdf(input: ReportPdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(await loadKoreanFont(), { subset: true });
  const bold = font;
  let page = pdf.addPage([842, 595]);
  let y = 545;
  const draw = (text: string, x: number, size = 11, color = rgb(0.1, 0.15, 0.2), usedFont: PDFFont = font) => page.drawText(text, { x, y, size, font: usedFont, color });
  draw(input.title, 44, 22, rgb(0.05, 0.25, 0.3), bold); y -= 26;
  draw(`기준일 ${input.generatedAt} · 조회 범위 ${input.scope}`, 44, 10, rgb(0.35, 0.4, 0.45)); y -= 35;
  page.drawRectangle({ x: 44, y: y - 42, width: 754, height: 58, color: rgb(0.95, 0.97, 0.97), borderColor: rgb(0.85, 0.9, 0.9), borderWidth: 1 });
  draw(`참여자 ${input.summary.participants}명`, 62, 12, undefined, bold); draw(`수료 ${input.summary.completed}명`, 270, 12, undefined, bold); draw(`수료율 ${input.summary.rate.toFixed(1)}%`, 480, 12, undefined, bold); y -= 86;
  draw("구분", 52, 10, rgb(0.3, 0.35, 0.4), bold); draw("대상", 350, 10, rgb(0.3, 0.35, 0.4), bold); draw("수료", 440, 10, rgb(0.3, 0.35, 0.4), bold); draw("미수료", 520, 10, rgb(0.3, 0.35, 0.4), bold); draw("수료율", 620, 10, rgb(0.3, 0.35, 0.4), bold); y -= 18;
  page.drawLine({ start: { x: 44, y }, end: { x: 798, y }, thickness: 1, color: rgb(0.8, 0.84, 0.85) }); y -= 22;
  for (const row of input.rows) {
    if (y < 55) { page = pdf.addPage([842, 595]); y = 545; }
    draw(row.label, 52); draw(`${row.target}명`, 350); draw(`${row.completed}명`, 440); draw(`${row.incomplete}명`, 520); draw(`${row.rate.toFixed(1)}%`, 620); y -= 25;
  }
  return pdf.save();
}
