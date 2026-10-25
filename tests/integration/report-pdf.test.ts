import { describe, expect, it } from "vitest";
import { pdfPageCount, readPdfPages } from "@/server/documents/pdf-text";
import { renderReportPdf } from "@/server/reports/pdf";
import type { ReportView } from "@/server/reports/html";

// The longest report the prompt and normalizeReport allow: every list full, every text at its
// word limit. It must still print on two A4 pages (the renderer shrinks it if needed).
const sentence =
  "The proposal states the requirement is met with the specified equipment, but the evidence is partial and the delivery plan leaves the client exposed to delays at commissioning.";
const points = Array.from({ length: 5 }, (_, i) => ({
  point: `${sentence} (${i + 1})`,
  reference: `REQ-0${10 + i} · Technical proposal p. ${i + 2}`,
}));
const aspect = {
  rating: "adequate" as const,
  assessment: `${sentence} ${sentence} ${sentence}`,
  strengths: points,
  weaknesses: points,
};
const view: ReportView = {
  language: "en",
  project: { code: "PRJ-2026-001", name: "High-Energy Cargo X-Ray Inspection Systems" },
  vendor: { name: "Meridian Scan Technologies", country: "Northern Gulf State" },
  generatedAt: "2026-10-25T10:00:00.000Z",
  author: "Claude Opus 5.5",
  scores: {
    overall: 64.3,
    rfpPct: 71.2,
    standardsPct: 58.9,
    riskScore: 47,
    riskLevel: "moderate",
    rank: 2,
    ranked: 4,
  },
  report: {
    verdict: "acceptable_with_conditions",
    headline: sentence,
    executiveSummary: `${sentence} ${sentence} ${sentence} ${sentence}`,
    technical: aspect,
    commercial: aspect,
    balance: { assessment: `${sentence} ${sentence}`, valueForMoney: sentence },
    concerns: Array.from({ length: 4 }, (_, i) => ({
      title: `Concern ${i + 1}`,
      detail: sentence,
    })),
    recommendation: {
      opinion: `${sentence} ${sentence} ${sentence}`,
      conditions: Array.from({ length: 5 }, () => sentence.slice(0, 110)),
      negotiationPoints: Array.from({ length: 5 }, () => sentence.slice(0, 110)),
      clarifications: Array.from({ length: 5 }, () => sentence.slice(0, 110)),
    },
  },
};

describe("consultant report PDF", () => {
  it("prints a full-length report on at most two A4 pages, with selectable text", async () => {
    const pdf = await renderReportPdf(view);
    expect(new TextDecoder().decode(pdf.slice(0, 5))).toBe("%PDF-");
    expect(await pdfPageCount(pdf)).toBeLessThanOrEqual(2);
    const text = (await readPdfPages(pdf)).join(" ");
    expect(text).toContain("Meridian Scan Technologies");
    expect(text).toContain("Consultant");
  }, 60_000);
});
