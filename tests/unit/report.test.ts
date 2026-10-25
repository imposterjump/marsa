import { describe, expect, it } from "vitest";
import { normalizeReport, type ReportOutput } from "@/server/ai/schemas";
import { reportHtml, type ReportView } from "@/server/reports/html";

const point = (i: number) => ({ point: `Point ${i}`, reference: `REQ-00${i}` });
const sampleReport = (over: Partial<ReportOutput> = {}): ReportOutput => ({
  verdict: "acceptable_with_conditions",
  headline: "A sound bid with two open points.",
  executiveSummary: "Summary.",
  technical: {
    rating: "strong",
    assessment: "Good.",
    strengths: [1, 2, 3].map(point),
    weaknesses: [4].map(point),
  },
  commercial: {
    rating: "weak",
    assessment: "Expensive.",
    strengths: [],
    weaknesses: [5, 6].map(point),
  },
  balance: { assessment: "Technical ahead.", valueForMoney: "Fair." },
  concerns: [{ title: "Price", detail: "Escalates." }],
  recommendation: {
    opinion: "Award with conditions.",
    conditions: ["Attach the bid security."],
    negotiationPoints: ["Fixed O&M prices."],
    clarifications: ["Confirm holidays."],
  },
  ...over,
});

describe("consultant report (2026-10-25)", () => {
  it("keeps the verdict in line with Marsa's pick", () => {
    expect(normalizeReport(sampleReport(), { recommended: true }).verdict).toBe("preferred_bidder");
    expect(
      normalizeReport(sampleReport({ verdict: "preferred_bidder" }), { recommended: false })
        .verdict,
    ).toBe("acceptable_with_conditions");
    expect(
      normalizeReport(sampleReport({ verdict: "not_recommended" }), { recommended: false }).verdict,
    ).toBe("not_recommended");
  });

  it("caps the lists so the PDF keeps to two pages, and drops blank entries", () => {
    const long = sampleReport({
      technical: {
        rating: "adequate",
        assessment: " Fine. ",
        strengths: [1, 2, 3, 4, 5, 6, 7].map(point),
        weaknesses: [{ point: "  ", reference: "" }, point(1)],
      },
      concerns: Array.from({ length: 6 }, (_, i) => ({ title: `C${i}`, detail: "d" })),
      recommendation: {
        opinion: "x",
        conditions: Array.from({ length: 8 }, (_, i) => `Condition ${i}`),
        negotiationPoints: ["", "  Price  "],
        clarifications: [],
      },
    });
    const out = normalizeReport(long, { recommended: false });
    expect(out.technical.strengths).toHaveLength(5);
    expect(out.technical.weaknesses).toEqual([point(1)]);
    expect(out.technical.assessment).toBe("Fine.");
    expect(out.concerns).toHaveLength(4);
    expect(out.recommendation.conditions).toHaveLength(5);
    expect(out.recommendation.negotiationPoints).toEqual(["Price"]);
  });

  const view = (over: Partial<ReportView> = {}): ReportView => ({
    language: "en",
    project: { code: "PRJ-1", name: "Tender" },
    vendor: { name: "Vendor <b>One</b>", country: null },
    generatedAt: "2026-10-25T10:00:00.000Z",
    author: "Claude Haiku 5.5",
    scores: {
      overall: 72,
      rfpPct: 81.5,
      standardsPct: null,
      riskScore: 40,
      riskLevel: "moderate",
      rank: 2,
      ranked: 3,
    },
    report: sampleReport({ headline: "<script>alert(1)</script>" }),
    ...over,
  });
  const assets = { latinFont: null, arabicFont: null, emblem: null };

  it("lays the report out: escaped text, the verdict, rings without standards when none apply", () => {
    const html = reportHtml(view(), assets);
    expect(html).not.toContain("<script>alert");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("Vendor &lt;b&gt;One&lt;/b&gt;");
    expect(html).toContain("Acceptable with conditions");
    expect(html).toContain("Rank 2 of 3");
    expect(html).toContain(">81.5%<");
    expect(html).not.toContain(">Standards<");
    expect(html).toContain('dir="ltr"');
  });

  it("writes Arabic reports right to left with Arabic headings", () => {
    const html = reportHtml(view({ language: "ar" }), assets);
    expect(html).toContain('dir="rtl"');
    expect(html).toContain("الملخص التنفيذي");
    expect(html).toContain("مقبول بشروط");
  });
});
