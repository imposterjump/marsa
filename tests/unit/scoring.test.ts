import { describe, expect, it } from "vitest";
import { DEFAULT_WEIGHTS, type FindingStatus, type Priority } from "@/lib/domain";
import { computeCategoryScores, computeScore } from "@/lib/scoring";

const item = (priority: Priority, status: FindingStatus, category = "technical") => ({
  priority,
  status,
  category,
});

// The same 10 findings as Settings → Scoring → Live example.
const SAMPLE = [
  item("mandatory", "compliant"),
  item("mandatory", "compliant"),
  item("mandatory", "partial"),
  item("mandatory", "non_compliant"),
  item("important", "compliant"),
  item("important", "partial"),
  item("important", "compliant"),
  item("desirable", "not_addressed"),
  item("desirable", "compliant"),
  item("desirable", "partial"),
];

describe("computeScore", () => {
  it("matches the Settings live example with default weights (66.7%)", () => {
    const r = computeScore(SAMPLE, DEFAULT_WEIGHTS, 0.5);
    expect(r.possible).toBe(21);
    expect(r.earned).toBe(14);
    expect(r.scorePct).toBe(66.7);
    expect(r.mandatoryFailures).toBe(1);
    expect(r.counts).toEqual({ compliant: 5, partial: 3, non_compliant: 1, not_addressed: 1 });
  });

  it("partial credit 0% and 100% change only the partial rows", () => {
    expect(computeScore(SAMPLE, DEFAULT_WEIGHTS, 0).scorePct).toBe(52.4); // 11/21
    expect(computeScore(SAMPLE, DEFAULT_WEIGHTS, 1).scorePct).toBe(81); // 17/21
  });

  it("weights shift the score toward the priorities that matter", () => {
    expect(computeScore(SAMPLE, { mandatory: 10, important: 1, desirable: 0 }, 0.5).scorePct).toBe(
      64,
    ); // 27.5/43
  });

  it("not addressed counts as a mandatory failure, partial does not", () => {
    const r = computeScore(
      [item("mandatory", "not_addressed"), item("mandatory", "partial")],
      DEFAULT_WEIGHTS,
      0.5,
    );
    expect(r.mandatoryFailures).toBe(1);
  });

  it("is 0 with no items or all-zero weights (no division by zero)", () => {
    expect(computeScore([], DEFAULT_WEIGHTS, 0.5).scorePct).toBe(0);
    expect(computeScore(SAMPLE, { mandatory: 0, important: 0, desirable: 0 }, 0.5).scorePct).toBe(
      0,
    );
  });

  it("a fully compliant vendor scores 100", () => {
    expect(
      computeScore(
        SAMPLE.map((s) => ({ ...s, status: "compliant" as const })),
        DEFAULT_WEIGHTS,
        0.5,
      ).scorePct,
    ).toBe(100);
  });
});

describe("computeCategoryScores", () => {
  it("scores each category separately", () => {
    const r = computeCategoryScores(
      [
        item("mandatory", "compliant", "security"),
        item("mandatory", "non_compliant", "security"),
        item("important", "partial", "delivery"),
      ],
      DEFAULT_WEIGHTS,
      0.5,
    );
    expect(r).toEqual({ security: 50, delivery: 50 });
  });
});
