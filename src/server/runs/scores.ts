/**
 * Marsa's numbers per vendor (P8): standards compliance %, RFP compliance %, the 0–100 risk score
 * and the overall value that ranks vendors and picks the recommended one. Computed from the saved
 * findings (with human overrides) and risk register, never chosen by the AI. Used by the
 * recommendation step and the results page. No `server-only` (G-08).
 */
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { evaluations, findings, requirements, risks } from "../db/schema";
import type { FindingStatus, Priority } from "../../lib/domain";
import { computeScore, overallValue, riskLevel, riskScore } from "../../lib/scoring";
import type { VendorScores } from "../ai/types";
import type { RunRow } from "./store";

export interface ScoredFinding {
  requirementId: string;
  status: FindingStatus;
  priority: Priority;
  standard: boolean;
}

/** Findings of every analysed vendor of a run: proposal id → its findings. */
export function runFindings(db: Db, run: RunRow): Map<string, ScoredFinding[]> {
  const reqs = new Map(
    db
      .select({
        id: requirements.id,
        priority: requirements.priority,
        type: requirements.sourceType,
      })
      .from(requirements)
      .where(eq(requirements.runId, run.id))
      .all()
      .map((r) => [r.id, r]),
  );
  const evs = db
    .select({ id: evaluations.id, proposalId: evaluations.proposalId })
    .from(evaluations)
    .where(eq(evaluations.runId, run.id))
    .all();
  const out = new Map<string, ScoredFinding[]>();
  if (!evs.length) return out;
  const rows = db
    .select()
    .from(findings)
    .where(
      inArray(
        findings.evaluationId,
        evs.map((e) => e.id),
      ),
    )
    .all();
  for (const e of evs) {
    out.set(
      e.proposalId,
      rows
        .filter((f) => f.evaluationId === e.id && reqs.has(f.requirementId))
        .map((f) => {
          const r = reqs.get(f.requirementId)!;
          return {
            requirementId: f.requirementId,
            status: f.overrideStatus ?? f.status,
            priority: r.priority,
            standard: r.type === "standard",
          };
        }),
    );
  }
  return out;
}

/** Ranked best first (rank 1 = recommended). `names`: proposal id → vendor name. */
export function computeVendorScores(
  db: Db,
  run: RunRow,
  names: Map<string, string> = new Map(),
): VendorScores[] {
  const byVendor = runFindings(db, run);
  const hasStandards = db
    .select({ id: requirements.id })
    .from(requirements)
    .where(and(eq(requirements.runId, run.id), eq(requirements.sourceType, "standard")))
    .get();
  const { weights, partialCredit } = run.config;
  // A vendor is ranked once its RFP check is done (its standards check alone says too little).
  const scored = [...byVendor.entries()]
    .filter(([, list]) => list.some((f) => !f.standard))
    .map(([proposalId, list]) => {
      const std = computeScore(
        list.filter((f) => f.standard),
        weights,
        partialCredit,
      );
      const rfp = computeScore(
        list.filter((f) => !f.standard),
        weights,
        partialCredit,
      );
      const all = computeScore(list, weights, partialCredit);
      const register = db
        .select({ likelihood: risks.likelihood, impact: risks.impact })
        .from(risks)
        .where(and(eq(risks.runId, run.id), eq(risks.proposalId, proposalId)))
        .all();
      const score = riskScore({
        mandatoryNotMet: all.mandatoryFailures,
        counts: all.counts,
        risks: register,
      });
      const standardsPct = hasStandards ? std.scorePct : null;
      return {
        proposalId,
        vendor: names.get(proposalId) ?? "",
        standardsPct,
        rfpPct: rfp.scorePct,
        mandatoryNotMet: all.mandatoryFailures,
        riskScore: score,
        riskLevel: riskLevel(score),
        overall: overallValue(standardsPct, rfp.scorePct, score),
        rank: 0,
      };
    })
    .sort((a, b) => b.overall - a.overall || a.riskScore - b.riskScore);
  scored.forEach((s, i) => (s.rank = i + 1));
  return scored;
}
