import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildPreview, parseDelimited } from "@/server/documents/preview";
import { paginate } from "@/lib/paginate";
import { estimateCostUsd, estimateSeconds, formatDuration, planRun } from "@/lib/plan";
import { findQuotePage, normalizeForMatch, quoteNeedles, textContainsQuote } from "@/lib/quote";

const pack = (f: string) =>
  new Uint8Array(fs.readFileSync(path.join(process.cwd(), "test-inputs/phase-1/rfp-pack", f)));
const enc = (s: string) => new TextEncoder().encode(s);

describe("analysis plan (RDD §7.1)", () => {
  it("T = 3N + 2, with the comparison skipped for one proposal", () => {
    expect(planRun(0)).toMatchObject({ total: 0, skipped: 0 });
    expect(planRun(1)).toMatchObject({ total: 5, skipped: 1, phases: { analyze: 1, compare: 1 } });
    expect(planRun(4)).toMatchObject({
      total: 14,
      skipped: 0,
      phases: { checklist: 1, analyze: 4, compare: 4, risk: 4, summary: 1 },
    });
  });

  it("estimates time by phase waves and concurrency", () => {
    expect(estimateSeconds(0, { concurrency: 3, mode: "live" })).toBe(0);
    // 4 vendors, 3 at a time → 2 waves each for analyse, compare, risk
    expect(estimateSeconds(4, { concurrency: 3, mode: "live" })).toBe(
      75 + 2 * 120 + 2 * 60 + 2 * 50 + 45,
    );
    // N = 1 skips the comparison phase
    expect(estimateSeconds(1, { concurrency: 3, mode: "live" })).toBe(75 + 120 + 50 + 45);
    expect(estimateSeconds(4, { concurrency: 3, mode: "mock" })).toBe(Math.round(3.5 * 8));
    expect(estimateSeconds(4, { concurrency: 6, mode: "live" })).toBeLessThan(
      estimateSeconds(4, { concurrency: 1, mode: "live" }),
    );
  });

  it("cost grows with pages and vendors, Sonnet is cheaper than Opus", () => {
    const base = { sharedPages: 20, vendorPages: [13, 14, 16, 14] };
    const opus = estimateCostUsd({ model: "claude-opus-5-5", ...base });
    expect(opus).toBeGreaterThan(0.5);
    expect(opus).toBeLessThan(10);
    expect(estimateCostUsd({ model: "claude-sonnet-5-5", ...base })).toBeLessThan(opus);
    expect(
      estimateCostUsd({ model: "claude-opus-5-5", sharedPages: 20, vendorPages: [13] }),
    ).toBeLessThan(opus);
    expect(estimateCostUsd({ model: "claude-opus-5-5", sharedPages: 20, vendorPages: [] })).toBe(0);
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
