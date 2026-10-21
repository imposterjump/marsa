/**
 * Deterministic compliance scoring (RDD §7.6, REC-02/03/04). Pure: used by Settings (live
 * example) now and by the AI pipeline in P6. The model never chooses the percentage.
 *
 *   credit: compliant 1 · partial = partialCredit · non_compliant 0 · not_addressed 0
 *   weight: settings.weights[priority]
 *   score  = 100 × Σ(weight × credit) / Σ weight
 *   risk severity = likelihood × impact → 1–4 low · 5–9 moderate · 10–15 high · 16–25 critical
 */
import {
  FINDING_STATUSES,
  type FindingStatus,
  type Priority,
  type RiskSeverity,
  type StatusCounts,
  type Weights,
} from "./domain";

export interface ScoredItem {
  priority: Priority;
  status: FindingStatus;
  category?: string;
}

export interface ScoreResult {
  scorePct: number; // 0–100, one decimal
  earned: number;
  possible: number;
  counts: StatusCounts;
  /** Mandatory requirements that are non-compliant or not addressed (REC-04 gate). */
  mandatoryFailures: number;
}

export function creditFor(status: FindingStatus, partialCredit: number): number {
  switch (status) {
    case "compliant":
      return 1;
    case "partial":
      return partialCredit;
    default:
      return 0;
  }
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function emptyCounts(): StatusCounts {
  return Object.fromEntries(FINDING_STATUSES.map((s) => [s, 0])) as StatusCounts;
}

export function computeScore(
  items: ScoredItem[],
  weights: Weights,
  partialCredit: number,
): ScoreResult {
  const counts = emptyCounts();
  let earned = 0;
  let possible = 0;
  let mandatoryFailures = 0;
  for (const it of items) {
    counts[it.status]++;
    const w = weights[it.priority];
    possible += w;
    earned += w * creditFor(it.status, partialCredit);
    if (
      it.priority === "mandatory" &&
      (it.status === "non_compliant" || it.status === "not_addressed")
    ) {
      mandatoryFailures++;
    }
  }
  return {
    scorePct: possible > 0 ? round1((earned / possible) * 100) : 0,
    earned: round1(earned * 100) / 100,
    possible,
    counts,
    mandatoryFailures,
  };
}

/** Score per category (e.g. technical, security…); categories with zero weight are omitted. */
export function computeCategoryScores(
  items: Required<ScoredItem>[],
  weights: Weights,
  partialCredit: number,
): Record<string, number> {
  const byCat = new Map<string, ScoredItem[]>();
  for (const it of items) byCat.set(it.category, [...(byCat.get(it.category) ?? []), it]);
  const out: Record<string, number> = {};
  for (const [cat, list] of byCat) {
    const r = computeScore(list, weights, partialCredit);
    if (r.possible > 0) out[cat] = r.scorePct;
  }
  return out;
}

/** Risk severity from likelihood × impact, both 1–5 (RDD §7.6). */
export function riskSeverity(likelihood: number, impact: number): RiskSeverity {
  const score = likelihood * impact;
  if (score >= 16) return "critical";
  if (score >= 10) return "high";
  if (score >= 5) return "moderate";
  return "low";
}

const SEVERITY_ORDER: RiskSeverity[] = ["low", "moderate", "high", "critical"];

/** The most severe of a list (low when empty). */
export function maxSeverity(list: RiskSeverity[]): RiskSeverity {
  return list.reduce<RiskSeverity>(
    (acc, s) => (SEVERITY_ORDER.indexOf(s) > SEVERITY_ORDER.indexOf(acc) ? s : acc),
    "low",
  );
}
