import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPreview, parseDelimited } from "@/server/documents/preview";
import { paginate } from "@/lib/paginate";
import {
  costFromUsage,
  estimateRun,
  estimateSeconds,
  formatDuration,
  planRun,
  type RunEstimateInput,
} from "@/lib/plan";
import { findQuotePage, normalizeForMatch, quoteNeedles, textContainsQuote } from "@/lib/quote";

const pack = (f: string) =>
  new Uint8Array(fs.readFileSync(path.join(process.cwd(), "test-inputs/phase-1/rfp-pack", f)));
const enc = (s: string) => new TextEncoder().encode(s);

describe("analysis plan (RDD §7.1)", () => {
  // P8: checklist → per vendor standards, RFP and risk → recommendation → per vendor report →
  // the Translator (no comparison step).
  it("T = 4N + 3 with standards, 3N + 3 without", () => {
    expect(planRun(0)).toMatchObject({ total: 0, skipped: 0 });
    expect(planRun(1)).toMatchObject({
      total: 7,
      skipped: 0,
      phases: { standards: 1, compare: 0, report: 1, translate: 1 },
    });
    expect(planRun(4)).toMatchObject({
      total: 19,
      skipped: 0,
      phases: {
        checklist: 1,
        standards: 4,
        analyze: 4,
        compare: 0,
        risk: 4,
        summary: 1,
        report: 4,
        translate: 1,
      },
    });
    expect(planRun(4, false)).toMatchObject({ total: 15, phases: { standards: 0 } });
  });

  it("estimates time by phase waves and concurrency", () => {
    expect(estimateSeconds(0, { concurrency: 3, mode: "live" })).toBe(0);
    // 4 vendors, 3 at a time → 2 waves each for standards, RFP, risk and reports; one translation
    expect(estimateSeconds(4, { concurrency: 3, mode: "live" })).toBe(
      75 + 2 * 80 + 2 * 110 + 2 * 50 + 30 + 2 * 70 + 60,
    );
    expect(estimateSeconds(1, { concurrency: 3, mode: "live", withStandards: false })).toBe(
      75 + 110 + 50 + 30 + 70 + 60,
    );
    expect(estimateSeconds(4, { concurrency: 3, mode: "mock" })).toBe(Math.round(3.5 * 11));
    expect(estimateSeconds(4, { concurrency: 6, mode: "live" })).toBeLessThan(
      estimateSeconds(4, { concurrency: 1, mode: "live" }),
    );
  });

  // Real document sizes of the PCS sample tender + the three Phase 6 bids (P6.10 live run).
  const pcs: RunEstimateInput = {
    shared: {
      pdfPages: 7,
      images: 0,
      textChars: 0,
      rulesCount: 14,
      rulesChars: 2_022,
      rfpPageEquivalents: 3,
    },
    vendors: [6, 6, 6].map((p) => ({ pdfPages: p, images: 0, textChars: 0 })),
    previousRequirements: 31,
  };

  // The measured run (P6.10) cost $1.17; its checklist, analysis and risk steps cost $0.89
  // (per-step usage in data/live-test). P8 splits each analysis into a standards and an RFP check
  // (the second reads the first's cache) and replaces compare + summary by a small
  // recommendation without documents, so a run should cost about the same as those $0.89.
  // The consultant reports (2026-10-25) come on top and are counted apart.
  it("matches the measured Sonnet run's steps (PCS, 3 vendors: ≈ $0.89 + split checks)", () => {
    const e = estimateRun(pcs, { model: "claude-sonnet-5-5", concurrency: 3 });
    expect(e.usd - e.reportsUsd - e.translationUsd).toBeGreaterThan(0.85);
    expect(e.usd - e.reportsUsd - e.translationUsd).toBeLessThan(1.1);
    expect(e.low).toBeLessThan(e.usd);
    expect(e.high).toBeGreaterThan(e.usd);
    expect(e).toMatchObject({ steps: 15, requirements: 31, requirementsEstimated: false });
  });

  // The Translator always runs on Haiku: a few cents whatever model ran the analysis.
  it("prices the translation into Arabic at a few cents, on any model", () => {
    const haiku = estimateRun(pcs, { model: "claude-haiku-5-5", concurrency: 3 });
    const opus = estimateRun(pcs, { model: "claude-opus-5-5", concurrency: 3 });
    expect(haiku.translationUsd).toBeGreaterThan(0.005);
    expect(haiku.translationUsd).toBeLessThan(0.08);
    expect(opus.translationUsd).toBe(haiku.translationUsd);
  });

  // Each report re-reads the tender and its vendor's proposal (own output format: no cache
  // shared with the evaluation) and writes about two pages.
  it("prices the consultant reports: about a cent per vendor on Haiku", () => {
    const haiku = estimateRun(pcs, { model: "claude-haiku-5-5", concurrency: 3 });
    expect(haiku.reportsUsd).toBeGreaterThan(0.005);
    expect(haiku.reportsUsd).toBeLessThan(0.06);
    const opus = estimateRun(pcs, { model: "claude-opus-5-5", concurrency: 3 });
    expect(opus.reportsUsd).toBeGreaterThan(0.3);
    expect(opus.reportsUsd).toBeLessThan(2);
    expect(opus.reportsUsd).toBeLessThan(opus.usd / 2);
  });

  it("prices models and vendors sensibly", () => {
    // The analysis itself (the translation costs the same on every model).
    const own = (model: Parameters<typeof estimateRun>[1]["model"]) => {
      const e = estimateRun(pcs, { model, concurrency: 3 });
      return e.usd - e.translationUsd;
    };
    const sonnet = own("claude-sonnet-5-5");
    const opus = own("claude-opus-5-5");
    const haiku = own("claude-haiku-5-5");
    expect(opus).toBeGreaterThan(sonnet * 2);
    expect(haiku).toBeLessThan(sonnet / 10);
    const five = estimateRun(
      { ...pcs, vendors: [...pcs.vendors, ...pcs.vendors.slice(0, 2)] },
      { model: "claude-sonnet-5-5", concurrency: 3 },
    );
    expect(five.usd).toBeGreaterThan(sonnet);
    expect(five.steps).toBe(23);
    expect(
      estimateRun({ ...pcs, vendors: [] }, { model: "claude-opus-5-5", concurrency: 3 }).usd,
    ).toBe(0);
    // Without an earlier run the requirement count is estimated from rules + RFP pages.
    const fresh = estimateRun(
      { ...pcs, previousRequirements: null },
      { model: "claude-sonnet-5-5", concurrency: 3 },
    );
    expect(fresh.requirementsEstimated).toBe(true);
    expect(fresh.requirements).toBeGreaterThan(14);
  });

  // Measured X-ray run: $4.80 in all, $3.70 for its checklist, analysis and risk steps.
  it("the large X-ray tender costs what the measured run suggests (≈ $3.7 on Sonnet)", () => {
    const xray: RunEstimateInput = {
      shared: {
        pdfPages: 24,
        images: 1,
        textChars: 18_196,
        rulesCount: 38,
        rulesChars: 5_196,
        rfpPageEquivalents: 20,
      },
      vendors: [14, 14, 13, 16].map((p) => ({ pdfPages: p, images: 0, textChars: 0 })),
      previousRequirements: 91,
    };
    const e = estimateRun(xray, { model: "claude-sonnet-5-5", concurrency: 3 });
    expect(e.usd - e.reportsUsd).toBeGreaterThan(3.2);
    expect(e.usd - e.reportsUsd).toBeLessThan(4.6);
  });

  it("Haiku costs 5× more per token above 100K prompt tokens", () => {
    const u = (prompt: number) => ({
      inputTokens: prompt,
      outputTokens: 0,
      cacheReadTokens: 0,
      cacheWriteTokens: 0,
    });
    expect(costFromUsage("claude-haiku-5-5", u(100_000))).toBeCloseTo(0.01, 6);
    expect(costFromUsage("claude-haiku-5-5", u(200_000))).toBeCloseTo(0.1, 6);
    expect(costFromUsage("claude-sonnet-5-5", u(200_000))).toBeCloseTo(0.4, 6);
  });

  it("formats durations", () => {
    expect(formatDuration(28)).toBe("28 s");
    expect(formatDuration(580)).toBe("10 min");
    expect(formatDuration(3900)).toBe("1 h 5 min");
  });
});

describe("evidence quotes (RDD §8.5)", () => {
  it("normalises case, whitespace, typographic quotes, dashes, ligatures and soft hyphens", () => {
    expect(normalizeForMatch("Meridian’s  “Cloud” – Gate­way ﬁle")).toBe(
      'meridian\'s"cloud"-gatewayfile',
    );
  });

  it("matches across PDF span boundaries and line breaks", () => {
    const pdfText = "The gateway synchro" + "nises licence entitle" + "ments with Meridian's";
    expect(
      textContainsQuote(pdfText, "the gateway synchronises licence entitlements with Meridian’s"),
    ).toBe(true);
    expect(textContainsQuote(pdfText, "something else entirely")).toBe(false);
  });

  it("uses shorter prefixes when a quote runs over a page break, preferring the current page", () => {
    const quote =
      "The gateway synchronises licence entitlements with Meridian's licensing service every 90 days";
    const pages = [
      "Cover page",
      "… the Employer's DMZ. The gateway synchronises licence entitlements with Meridian's licensing service",
      "every 90 days over an outbound HTTPS connection …",
    ];
    expect(quoteNeedles(quote).length).toBeGreaterThan(1);
    expect(findQuotePage(pages, quote, 0)).toBe(1);
    expect(findQuotePage(["same text here", "same text here"], "same text here", 1)).toBe(1);
    expect(findQuotePage(pages, "not in the document at all", 0)).toBe(-1);
  });
});

describe("reader previews (P5.6)", () => {
  it("turns Annex B (XLSX) into one table per sheet with computed values", async () => {
    const p = await buildPreview("annex-b.xlsx", pack("03-Annex-B-Technical-Specifications.xlsx"));
    expect(p.kind).toBe("sheets");
    if (p.kind !== "sheets") return;
    expect(p.sheets.map((s) => s.name)).toEqual([
      "Read me",
      "Technical specs",
      "Site constraints",
      "Volumes & storage",
      "Workstations",
      "Revision log",
    ]);
    const specs = p.sheets[1];
    expect(specs.rows.find((r) => r[0] === "TB-01")).toEqual(
      expect.arrayContaining(["TB-01", "Imaging", "≥ 310", "M"]),
    );
    const volumes = p.sheets[3].rows.find((r) => r[0] === "Total scans per year");
    expect(volumes?.join(" ")).toContain("1170000");
  });

  it("parses CSV with quotes, embedded commas and doubled quotes", () => {
    expect(parseDelimited('a,b\n"x, y","say ""hi"""\r\n\n3,4', ",")).toEqual([
      ["a", "b"],
      ["x, y", 'say "hi"'],
      ["3", "4"],
    ]);
  });

  it("returns text for text formats and nothing for unknown ones", async () => {
    expect(await buildPreview("notes.md", enc("# Title\n\nBody"))).toEqual({
      kind: "text",
      text: "# Title\n\nBody",
      truncated: false,
    });
    expect((await buildPreview("data.csv", enc("k;v\n1;2"))).kind).toBe("sheets");
    expect(await buildPreview("archive.zip", enc("PK"))).toEqual({ kind: "none" });
  });

  it("paginates long text at paragraph boundaries", () => {
    const para = "x".repeat(1_500);
    const pages = paginate([para, para, para, para].join("\n\n"));
    expect(pages.length).toBe(2);
    expect(pages.every((p) => p.length <= 3_400)).toBe(true);
    expect(paginate("")).toEqual([""]);
  });
});
