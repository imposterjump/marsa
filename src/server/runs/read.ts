/**
 * Read models for the Runs API (RDD §6): polling status, results, one vendor's results, active
 * runs. Step outputs (large JSON) never go into the polling payload. No `server-only` (G-08).
 */
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import {
  analysisRuns,
  analysisSteps,
  comparisons,
  evaluations,
  findings,
  projects,
  proposals,
  requirements,
  risks,
  runSummaries,
  vendors,
} from "../db/schema";
import { notFound } from "../api-errors";
import type {
  ActiveRunDto,
  ComparisonDto,
  EvaluationDto,
  FindingDto,
  ProposalResultDto,
  RequirementDto,
  RiskDto,
  RunDto,
  RunResultsDto,
  RunStatusDto,
  RunStepDto,
  RunSummaryDto,
} from "../../lib/api-types";
import { etaSeconds } from "../../lib/plan";
import type { ChecklistOutput } from "../ai/schemas";
import type { LocalStorage } from "../storage/local";
import { resolveSources } from "./sources";
import {
  ACTIVE_RUN_STATUSES,
  getRun,
  overallRisks,
  readChecklist,
  type RunRow,
  type StepRow,
} from "./store";

export function toRunDto(r: RunRow): RunDto {
  return {
    id: r.id,
    projectId: r.projectId,
    status: r.status,
    model: r.model,
    mode: r.config.mode ?? "mock",
    totalSteps: r.totalSteps,
    doneSteps: r.doneSteps,
    usage: r.usage ?? null,
    costUsd: r.costUsd,
    error: r.error,
    createdAt: r.createdAt,
    startedAt: r.startedAt,
    finishedAt: r.finishedAt,
  };
}

const toStepDto = (s: StepRow): RunStepDto => ({
  id: s.id,
  seq: s.seq,
  phase: s.phase,
  proposalId: s.proposalId,
  label: s.label,
  status: s.status,
  attempt: s.attempt,
  startedAt: s.startedAt,
  finishedAt: s.finishedAt,
  durationMs: s.durationMs,
  error: s.error,
  usage: s.usage ?? null,
});

const STEP_COLUMNS = {
  id: analysisSteps.id,
  runId: analysisSteps.runId,
  seq: analysisSteps.seq,
  phase: analysisSteps.phase,
  proposalId: analysisSteps.proposalId,
  label: analysisSteps.label,
  status: analysisSteps.status,
  attempt: analysisSteps.attempt,
  startedAt: analysisSteps.startedAt,
  finishedAt: analysisSteps.finishedAt,
  durationMs: analysisSteps.durationMs,
  error: analysisSteps.error,
  usage: analysisSteps.usage,
};

export function proposalVendors(db: Db, proposalIds: string[]) {
  if (!proposalIds.length) return new Map<string, typeof vendors.$inferSelect>();
  return new Map(
    db
      .select({ proposalId: proposals.id, vendor: vendors })
      .from(proposals)
      .innerJoin(vendors, eq(vendors.id, proposals.vendorId))
      .where(inArray(proposals.id, proposalIds))
      .all()
      .map((r) => [r.proposalId, r.vendor]),
  );
}

export function getRunStatus(db: Db, runId: string, isLive: boolean): RunStatusDto {
  const run = getRun(db, runId);
  const steps = db
    .select(STEP_COLUMNS)
    .from(analysisSteps)
    .where(eq(analysisSteps.runId, runId))
    .orderBy(asc(analysisSteps.seq))
    .all() as StepRow[];
  const evs = db.select().from(evaluations).where(eq(evaluations.runId, runId)).all();
  const risk = overallRisks(db, runId);
  const vendorsById = proposalVendors(db, run.config.proposalIds);
  const chips = run.config.proposalIds
    .filter((id) => vendorsById.has(id))
    .map((id) => {
      const ev = evs.find((e) => e.proposalId === id);
      const v = vendorsById.get(id)!;
      return {
        proposalId: id,
        vendor: v.name,
        vendorColor: v.color,
        scorePct: ev?.scorePct ?? null,
        mandatoryFailures: ev?.mandatoryFailures ?? null,
        overallRisk: risk.get(id) ?? null,
      };
    });
  return {
    run: toRunDto(run),
    steps: steps.map(toStepDto),
    chips,
    etaSeconds: ACTIVE_RUN_STATUSES.includes(run.status)
      ? etaSeconds(steps, { concurrency: run.config.concurrency, mode: run.config.mode ?? "mock" })
      : 0,
    active: isLive,
  };
}

export const listRunsDto = (db: Db, projectId: string): RunDto[] =>
  db
    .select()
    .from(analysisRuns)
    .where(eq(analysisRuns.projectId, projectId))
    .orderBy(desc(analysisRuns.createdAt))
    .all()
    .map(toRunDto);

export function getActiveRuns(db: Db): ActiveRunDto[] {
  const rows = db
    .select({ run: analysisRuns, code: projects.code, name: projects.name })
    .from(analysisRuns)
    .innerJoin(projects, eq(projects.id, analysisRuns.projectId))
    .where(inArray(analysisRuns.status, ACTIVE_RUN_STATUSES))
    .orderBy(asc(analysisRuns.createdAt))
    .all();
  return rows.map(({ run, code, name }) => {
    const current = db
      .select({ label: analysisSteps.label })
      .from(analysisSteps)
      .where(and(eq(analysisSteps.runId, run.id), eq(analysisSteps.status, "running")))
      .orderBy(asc(analysisSteps.seq))
      .get();
    return {
      runId: run.id,
      projectId: run.projectId,
      projectCode: code,
      projectName: name,
      status: run.status,
      doneSteps: run.doneSteps,
      totalSteps: run.totalSteps,
      currentLabel: current?.label ?? null,
    };
  });
}

export function requirementDtos(db: Db, runId: string): RequirementDto[] {
  return db
    .select()
    .from(requirements)
    .where(eq(requirements.runId, runId))
    .orderBy(asc(requirements.sortOrder))
    .all()
    .map((r) => ({
      id: r.id,
      code: r.code,
      title: r.title,
      description: r.description,
      category: r.category,
      priority: r.priority,
      sourceType: r.sourceType,
      sourceRef: r.sourceRef,
      standardId: r.standardId,
      acceptance: r.acceptance,
    }));
}

export function evaluationDtos(db: Db, run: RunRow, proposalIds?: string[]): EvaluationDto[] {
  const rows = db
    .select()
    .from(evaluations)
    .where(
      proposalIds
        ? and(eq(evaluations.runId, run.id), inArray(evaluations.proposalId, proposalIds))
        : eq(evaluations.runId, run.id),
    )
    .all();
  const vendorsById = proposalVendors(
    db,
    rows.map((r) => r.proposalId),
  );
  const risk = overallRisks(db, run.id);
  const order = new Map(run.config.proposalIds.map((id, i) => [id, i]));
  return rows
    .filter((r) => vendorsById.has(r.proposalId))
    .sort((a, b) => (order.get(a.proposalId) ?? 0) - (order.get(b.proposalId) ?? 0))
    .map((r) => ({
      id: r.id,
      proposalId: r.proposalId,
      vendor: vendorsById.get(r.proposalId)!,
      scorePct: r.scorePct,
      counts: r.counts,
      mandatoryFailures: r.mandatoryFailures,
      categoryScores: r.categoryScores,
      summary: r.summary,
      strengths: r.strengths,
      weaknesses: r.weaknesses,
      commercial: r.commercial,
      overallRisk: risk.get(r.proposalId) ?? null,
    }));
}

export function getRunResults(db: Db, runId: string): RunResultsDto {
  const run = getRun(db, runId);
  const checklist: ChecklistOutput | null = readChecklist(db, runId);
  const summary = db.select().from(runSummaries).where(eq(runSummaries.runId, runId)).get();
  return {
    run: toRunDto(run),
    requirements: requirementDtos(db, runId),
    keyConstraints: checklist?.keyConstraints ?? [],
    evaluations: evaluationDtos(db, run),
    comparisons: db
      .select()
      .from(comparisons)
      .where(eq(comparisons.runId, runId))
      .all()
      .map((c) => ({ proposalId: c.proposalId, data: c.data as ComparisonDto })),
    summary: summary
      ? {
          ranking: summary.ranking as RunSummaryDto["ranking"],
          recommendedProposalId: summary.recommendedProposalId,
          executiveSummary: summary.executiveSummary,
          conditions: summary.conditions,
          negotiationPoints: summary.negotiationPoints,
        }
      : null,
  };
}

/** One vendor's results with each requirement's sources resolved to RFP pages / standard rules. */
export async function getProposalResultWithSources(
  db: Db,
  storage: LocalStorage,
  runId: string,
  proposalId: string,
): Promise<ProposalResultDto> {
  const result = getProposalResult(db, runId, proposalId);
  const sources = await resolveSources(db, storage, getRun(db, runId), result.requirements);
  return { ...result, sources: Object.fromEntries(sources) };
}

export function getProposalResult(db: Db, runId: string, proposalId: string): ProposalResultDto {
  const run = getRun(db, runId);
  if (!run.config.proposalIds.includes(proposalId)) throw notFound("Proposal in this analysis");
  const [evaluation] = evaluationDtos(db, run, [proposalId]);
  const reqs = requirementDtos(db, runId);
  const codeOf = new Map(reqs.map((r) => [r.id, r.code]));
  const findingRows = evaluation
    ? db.select().from(findings).where(eq(findings.evaluationId, evaluation.id)).all()
    : [];
  const order = new Map(reqs.map((r, i) => [r.id, i]));
  const findingDtos: FindingDto[] = findingRows
    .sort((a, b) => (order.get(a.requirementId) ?? 0) - (order.get(b.requirementId) ?? 0))
    .map((f) => ({
      id: f.id,
      requirementId: f.requirementId,
      code: codeOf.get(f.requirementId) ?? "",
      status: f.overrideStatus ?? f.status,
      aiStatus: f.status,
      vendorResponse: f.vendorResponse,
      evidenceQuote: f.evidenceQuote,
      evidenceDocId: f.evidenceDocId,
      evidencePage: f.evidencePage,
      evidenceSection: f.evidenceSection,
      assessment: f.assessment,
      gap: f.gap,
      confidence: f.confidence,
    }));
  const comparison = db
    .select()
    .from(comparisons)
    .where(and(eq(comparisons.runId, runId), eq(comparisons.proposalId, proposalId)))
    .get();
  const riskRows: RiskDto[] = db
    .select()
    .from(risks)
    .where(and(eq(risks.runId, runId), eq(risks.proposalId, proposalId)))
    .all()
    .map((r) => ({
      id: r.id,
      title: r.title,
      category: r.category,
      likelihood: r.likelihood,
      impact: r.impact,
      severity: r.severity,
      description: r.description,
      consequence: r.consequence,
      mitigation: r.mitigation,
      evidence: r.evidence,
      requirementCodes: r.requirementCodes,
    }))
    .sort((a, b) => b.likelihood * b.impact - a.likelihood * a.impact);
  return {
    run: toRunDto(run),
    evaluation: evaluation ?? null,
    requirements: reqs,
    sources: {},
    findings: findingDtos,
    comparison: (comparison?.data as ComparisonDto | undefined) ?? null,
    risks: riskRows,
  };
}
