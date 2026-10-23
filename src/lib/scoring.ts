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

// ─── Risk score and recommendation (P8) ──────────────────────────────────────
/**
 * Risk of awarding to a vendor, 0–100 (higher = riskier), computed by Marsa instead of the AI's
 * own label, which was too harsh (a 91.6 % compliant vendor came out "high"):
 *   45 × min(1, mandatory not met / 5)
 * + 30 × gap share (not met + not addressed + ½ partly met, over all checked points)
 * + 25 × average of the three most severe risks' likelihood × impact / 25
 * Calibrated on the real Sonnet runs (HANDOFF: X-ray, PCS).
 */
export function riskScore({
  mandatoryNotMet,
  counts,
  risks,
}: {
  mandatoryNotMet: number;
  counts: StatusCounts;
  risks: { likelihood: number; impact: number }[];
}): number {
  const total = FINDING_STATUSES.reduce((s, k) => s + counts[k], 0);
  const gaps = counts.non_compliant + counts.not_addressed + 0.5 * counts.partial;
  const top = risks
    .map((r) => r.likelihood * r.impact)
    .sort((a, b) => b - a)
    .slice(0, 3);
  const register = top.length ? top.reduce((s, x) => s + x, 0) / top.length / 25 : 0;
  const score =
    45 * Math.min(1, mandatoryNotMet / 5) + 30 * (total ? gaps / total : 0) + 25 * register;
  return Math.round(Math.min(100, Math.max(0, score)));
}

/** Bands of the risk score: 0–24 low · 25–49 moderate · 50–69 high · 70–100 critical. */
export function riskLevel(score: number): RiskSeverity {
  if (score >= 70) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "moderate";
  return "low";
}

/**
 * Overall value used to rank vendors and pick the recommended one: compliance with the
 * standards and the RFP, and low risk. Without applied standards the RFP carries their weight.
 */
export function overallValue(standardsPct: number | null, rfpPct: number, risk: number): number {
  const v =
    standardsPct === null
      ? 0.8 * rfpPct + 0.2 * (100 - risk)
      : 0.4 * standardsPct + 0.4 * rfpPct + 0.2 * (100 - risk);
  return round1(v);
}
