/**
 * Analysis runs: creation, step bookkeeping and normalized result rows (RDD §4, §7.1–7.2, §7.6).
 * Each finished step is persisted immediately (step output + rows), so a crash or restart never
 * loses paid work and Resume never re-bills a finished step. No `server-only` (G-08).
 */
import { and, asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import type { Db } from "../db/connect";
import {
  analysisRuns,
  analysisSteps,
  comparisons,
  documents,
  evaluations,
  findings,
  projects,
  projectStandards,
  proposals,
  requirements,
  risks,
  runSummaries,
  standards,
} from "../db/schema";
import { ApiError, notFound } from "../api-errors";
import type {
  FindingStatus,
  ProjectStatus,
  RiskSeverity,
  RunConfig,
  RunStatus,
  StepStatus,
  TokenUsage,
} from "../../lib/domain";
import { newId } from "../../lib/ids";
import { addUsage, analyzeLabel, costFromUsage, planSteps } from "../../lib/plan";
import { computeCategoryScores, computeScore, riskSeverity } from "../../lib/scoring";
import type {
  AnalysisOutput,
  ChecklistOutput,
  ComparisonOutput,
  RiskOutput,
  SummaryOutput,
} from "../ai/schemas";
import type { AnalysisDigest, RunContext, SourceDoc } from "../ai/types";
import { getSettings } from "../services/settings";

export type RunRow = typeof analysisRuns.$inferSelect;
export type StepRow = typeof analysisSteps.$inferSelect;

const now = () => new Date().toISOString();
export const ACTIVE_RUN_STATUSES: RunStatus[] = ["queued", "running"];

// ─── Create ──────────────────────────────────────────────────────────────────
/** Proposals a run evaluates: submitted, with at least one readable document, oldest first. */
export function evaluableProposals(db: Db, projectId: string) {
  const rows = db
    .select({ id: proposals.id, submittedAt: proposals.submittedAt })
    .from(proposals)
    .where(and(eq(proposals.projectId, projectId), eq(proposals.status, "submitted")))
    .orderBy(asc(proposals.submittedAt))
    .all();
  if (!rows.length) return [];
  const readable = new Set(
    db
      .select({ id: documents.proposalId })
      .from(documents)
      .where(
        and(
          inArray(
            documents.proposalId,
            rows.map((r) => r.id),
          ),
          eq(documents.aiReadable, true),
        ),
      )
      .all()
      .map((d) => d.id),
  );
  return rows.filter((r) => readable.has(r.id));
}

export function findActiveRun(db: Db, projectId: string): RunRow | undefined {
  return db
    .select()
    .from(analysisRuns)
    .where(
      and(eq(analysisRuns.projectId, projectId), inArray(analysisRuns.status, ACTIVE_RUN_STATUSES)),
    )
    .get();
}

export function createRun(
  db: Db,
  projectId: string,
  { mode, apiKeyConfigured }: { mode: "mock" | "live"; apiKeyConfigured: boolean },
): RunRow {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw notFound("Project");
  const conflict = (code: string, msg: string) => new ApiError(409, code, msg);
  if (project.status === "draft")
    throw conflict(
      "invalid_transition",
      "Publish the tender and collect proposals before analysing.",
    );
  if (project.status === "archived")
    throw conflict("invalid_transition", "Restore the project before analysing it.");
  if (findActiveRun(db, projectId))
    throw conflict("run_active", "An analysis is already running for this project.");
  if (mode === "live" && !apiKeyConfigured) {
    throw new ApiError(
      400,
      "no_api_key",
      "Live AI needs an Anthropic API key (ANTHROPIC_API_KEY in .env).",
    );
  }
  const rfp = db
    .select({ id: documents.id })
    .from(documents)
    .where(
      and(
        eq(documents.projectId, projectId),
        eq(documents.kind, "rfp"),
        eq(documents.aiReadable, true),
      ),
    )
    .all();
  if (!rfp.length) throw conflict("no_rfp", "Upload at least one readable RFP document first.");
  const props = evaluableProposals(db, projectId);
  if (!props.length) throw conflict("no_proposals", "No proposal has a readable document yet.");

  const settings = getSettings(db);
  const standardIds = db
    .select({ id: projectStandards.standardId })
    .from(projectStandards)
    .innerJoin(standards, eq(standards.id, projectStandards.standardId))
    .where(eq(projectStandards.projectId, projectId))
    .orderBy(asc(standards.code))
    .all()
    .map((r) => r.id);
  const config: RunConfig = {
    weights: settings.weights,
    partialCredit: settings.partialCredit,
    standardIds,
    proposalIds: props.map((p) => p.id),
    reportLanguage: settings.reportLanguage,
    concurrency: settings.concurrency,
    mode,
  };
  const names = new Map(
    db
      .select({
        id: proposals.id,
        name: sql<string>`(select name from vendors where vendors.id = ${proposals.vendorId})`,
      })
      .from(proposals)
      .where(inArray(proposals.id, config.proposalIds))
      .all()
      .map((r) => [r.id, r.name]),
  );
  const plan = planSteps(
    config.proposalIds.map((id) => ({ proposalId: id, name: names.get(id) ?? "Vendor" })),
    standardIds.length,
  );
  const runId = newId("run");
  db.transaction((tx) => {
    tx.insert(analysisRuns)
      .values({
        id: runId,
        projectId,
        status: "queued",
        model: settings.aiModel,
        totalSteps: plan.length,
        doneSteps: plan.filter((s) => s.skipped).length,
        config,
      })
      .run();
    tx.insert(analysisSteps)
      .values(
        plan.map((s) => ({
          id: newId("step"),
          runId,
          seq: s.seq,
          phase: s.phase,
          proposalId: s.proposalId,
          label: s.label,
          status: (s.skipped ? "skipped" : "queued") as StepStatus,
          error: s.skipped ?? null,
        })),
      )
      .run();
    tx.update(projects).set({ status: "evaluating" }).where(eq(projects.id, projectId)).run();
  });
  return getRun(db, runId);
}

// ─── Reads ───────────────────────────────────────────────────────────────────
export function getRun(db: Db, runId: string): RunRow {
  const run = db.select().from(analysisRuns).where(eq(analysisRuns.id, runId)).get();
  if (!run) throw notFound("Analysis run");
  return run;
}

export const listSteps = (db: Db, runId: string): StepRow[] =>
  db
    .select()
    .from(analysisSteps)
    .where(eq(analysisSteps.runId, runId))
    .orderBy(asc(analysisSteps.seq))
    .all();

export const listProjectRuns = (db: Db, projectId: string): RunRow[] =>
  db
    .select()
    .from(analysisRuns)
    .where(eq(analysisRuns.projectId, projectId))
    .orderBy(desc(analysisRuns.createdAt))
    .all();

/** The checklist as Claude saw it (normalized output of step 1), or null before it is done. */
export function readChecklist(db: Db, runId: string): ChecklistOutput | null {
  const step = db
    .select({ output: analysisSteps.output, status: analysisSteps.status })
    .from(analysisSteps)
    .where(and(eq(analysisSteps.runId, runId), eq(analysisSteps.phase, "checklist")))
    .get();
  return step?.status === "done" ? (step.output as ChecklistOutput) : null;
}

function stepOutput<T>(
  db: Db,
  runId: string,
  phase: StepRow["phase"],
  proposalId: string,
): T | null {
  const step = db
    .select({ output: analysisSteps.output, status: analysisSteps.status })
    .from(analysisSteps)
    .where(
      and(
        eq(analysisSteps.runId, runId),
        eq(analysisSteps.phase, phase),
        eq(analysisSteps.proposalId, proposalId),
      ),
    )
    .get();
  return step?.status === "done" ? (step.output as T) : null;
}

/** Analyses finished so far, with Marsa's computed scores. */
export function readDigests(db: Db, runId: string, ctx: RunContext): AnalysisDigest[] {
  const rows = db.select().from(evaluations).where(eq(evaluations.runId, runId)).all();
  const out: AnalysisDigest[] = [];
  for (const v of ctx.vendors) {
    const ev = rows.find((r) => r.proposalId === v.proposalId);
    const analysis = stepOutput<AnalysisOutput>(db, runId, "analyze", v.proposalId);
    if (!ev || !analysis) continue;
    out.push({
      proposalId: v.proposalId,
      vendor: v.name,
      scorePct: ev.scorePct,
      mandatoryFailures: ev.mandatoryFailures,
      counts: ev.counts,
      categoryScores: ev.categoryScores as Record<string, number>,
      analysis,
    });
  }
  return out;
}

export const readComparison = (db: Db, runId: string, proposalId: string) =>
  stepOutput<ComparisonOutput>(db, runId, "compare", proposalId);

export const readRiskOutput = (db: Db, runId: string, proposalId: string) =>
  stepOutput<RiskOutput>(db, runId, "risk", proposalId);

// ─── Step bookkeeping ────────────────────────────────────────────────────────
export function markRunRunning(db: Db, runId: string) {
  db.update(analysisRuns)
    .set({
      status: "running",
      error: null,
      finishedAt: null,
      startedAt: sql`coalesce(${analysisRuns.startedAt}, ${now()})`,
    })
    .where(eq(analysisRuns.id, runId))
    .run();
}

export function markStepRunning(db: Db, stepId: string) {
  db.update(analysisSteps)
    .set({
      status: "running",
      startedAt: now(),
      finishedAt: null,
      error: null,
      attempt: sql`${analysisSteps.attempt} + 1`,
    })
    .where(eq(analysisSteps.id, stepId))
    .run();
}

export function setStepLabel(db: Db, stepId: string, label: string) {
  db.update(analysisSteps).set({ label }).where(eq(analysisSteps.id, stepId)).run();
}

/** Recount finished steps and usage/cost totals from the step rows. */
export function refreshRunTotals(db: Db, runId: string) {
  const run = getRun(db, runId);
  const steps = listSteps(db, runId);
  let usage: TokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
  };
  let cost = 0;
  for (const s of steps) {
    if (!s.usage) continue;
    usage = addUsage(usage, s.usage);
    cost += costFromUsage(run.model, s.usage);
  }
  db.update(analysisRuns)
    .set({
      doneSteps: steps.filter((s) => s.status === "done" || s.status === "skipped").length,
      usage,
      costUsd: Math.round(cost * 10_000) / 10_000,
    })
    .where(eq(analysisRuns.id, runId))
    .run();
}

function finishStep(
  db: Db,
  step: StepRow,
  status: StepStatus,
  fields: { output?: unknown; usage?: TokenUsage | null; error?: string | null } = {},
) {
  const finishedAt = now();
  const startedAt = db
    .select({ s: analysisSteps.startedAt })
    .from(analysisSteps)
    .where(eq(analysisSteps.id, step.id))
    .get()?.s;
  // Usage of failed attempts is still billed: add it to what the step already recorded.
  const prev = db
    .select({ u: analysisSteps.usage })
    .from(analysisSteps)
    .where(eq(analysisSteps.id, step.id))
    .get()?.u;
  const usage = fields.usage
    ? prev
      ? addUsage(prev, fields.usage)
      : fields.usage
    : (prev ?? null);
  db.update(analysisSteps)
    .set({
      status,
      finishedAt,
      durationMs: startedAt ? Date.parse(finishedAt) - Date.parse(startedAt) : null,
      error: fields.error ?? null,
      usage,
      ...(fields.output !== undefined ? { output: fields.output } : {}),
    })
    .where(eq(analysisSteps.id, step.id))
    .run();
  refreshRunTotals(db, step.runId);
}

/** Usage of an attempt that will be retried (still billed). */
export function addStepUsage(db: Db, step: StepRow, usage: TokenUsage) {
  const prev = db
    .select({ u: analysisSteps.usage })
    .from(analysisSteps)
    .where(eq(analysisSteps.id, step.id))
    .get()?.u;
  db.update(analysisSteps)
    .set({ usage: prev ? addUsage(prev, usage) : usage })
    .where(eq(analysisSteps.id, step.id))
    .run();
  refreshRunTotals(db, step.runId);
}

export const markStepFailed = (db: Db, step: StepRow, error: string, usage?: TokenUsage | null) =>
  finishStep(db, step, "failed", { error, usage });

export const markStepSkipped = (db: Db, step: StepRow, reason: string) =>
  finishStep(db, step, "skipped", { error: reason });

export const markStepCancelled = (db: Db, step: StepRow, usage?: TokenUsage | null) =>
  finishStep(db, step, "cancelled", { usage });

// ─── Persist step results (normalized rows) ──────────────────────────────────
export function saveChecklist(
  db: Db,
  step: StepRow,
  checklist: ChecklistOutput,
  ctx: RunContext,
  usage: TokenUsage,
) {
  const ruleOwner = new Map<string, string>();
  for (const s of ctx.standards) for (const r of s.rules) ruleOwner.set(r.code.toUpperCase(), s.id);
  db.transaction((tx) => {
    tx.delete(requirements).where(eq(requirements.runId, step.runId)).run();
    tx.insert(requirements)
      .values(
        checklist.requirements.map((r, i) => {
          const ref = r.sourceRef.toUpperCase();
          const standardId =
            [...ruleOwner].find(([code]) =>
              new RegExp(
                `(^|[^A-Z0-9-])${code.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}($|[^A-Z0-9])`,
              ).test(ref),
            )?.[1] ?? null;
          return {
            id: newId("requirement"),
            runId: step.runId,
            code: r.code,
            title: r.title,
            description: r.description,
            category: r.category,
            priority: r.priority,
            sourceType: r.sourceType,
            sourceRef: r.sourceRef,
            standardId,
            acceptance: r.acceptance,
            sortOrder: i,
          };
        }),
      )
      .run();
  });
  finishStep(db, step, "done", { output: checklist, usage });
  // Analyse labels now know the checklist size: "Analysing Atlas: checking 42 requirements".
  for (const s of listSteps(db, step.runId)) {
    const v = ctx.vendors.find((x) => x.proposalId === s.proposalId);
    if (s.phase === "analyze" && v)
      setStepLabel(db, s.id, analyzeLabel(v.name, checklist.requirements.length));
  }
}

/** Map the model's evidence reference back to one of the vendor's documents. */
export function matchEvidenceDoc(title: string | null, docs: SourceDoc[]): SourceDoc | null {
  if (!title) return null;
  const t = title.trim().toLowerCase();
  return (
    docs.find((d) => d.title.toLowerCase() === t) ??
    docs.find((d) => t.includes(d.name.toLowerCase()) || d.title.toLowerCase().includes(t)) ??
    docs.find((d) => t.includes(d.name.replace(/\.[^.]+$/, "").toLowerCase())) ??
    (docs.length === 1 ? docs[0] : null)
  );
}

/**
 * One finding per requirement, in checklist order: unknown codes are dropped, duplicates keep the
 * first, and a requirement the model skipped counts as not addressed (RDD §7.6).
 */
export function alignFindings(
  checklist: ChecklistOutput,
  analysis: AnalysisOutput,
): { findings: AnalysisOutput["findings"]; missing: string[] } {
  const byCode = new Map<string, AnalysisOutput["findings"][number]>();
  for (const f of analysis.findings) {
    const code = f.code.trim().toUpperCase();
    if (!byCode.has(code)) byCode.set(code, { ...f, code });
  }
  const missing: string[] = [];
  const out = checklist.requirements.map((r) => {
    const f = byCode.get(r.code);
    if (f) return f;
    missing.push(r.code);
    return {
      code: r.code,
      status: "not_addressed" as FindingStatus,
      vendorResponse: "",
      evidenceQuote: null,
      evidenceDocument: null,
      evidencePage: null,
      evidenceSection: null,
      assessment: "Not assessed by the model; counted as not addressed.",
      gap: null,
      confidence: "low" as const,
    };
  });
  return { findings: out, missing };
}

export function saveAnalysis(
  db: Db,
  step: StepRow,
  run: RunRow,
  ctx: RunContext,
  raw: AnalysisOutput,
  usage: TokenUsage,
): AnalysisDigest {
  const vendor = ctx.vendors.find((v) => v.proposalId === step.proposalId);
  if (!vendor) throw new Error(`Step ${step.id} has no vendor.`);
  const checklist = readChecklist(db, run.id);
  if (!checklist) throw new Error("The checklist is missing.");
  const { findings: aligned } = alignFindings(checklist, raw);
  const analysis: AnalysisOutput = { ...raw, findings: aligned };
  const reqRows = db.select().from(requirements).where(eq(requirements.runId, run.id)).all();
  const reqByCode = new Map(reqRows.map((r) => [r.code, r]));
  const items = aligned.map((f) => {
    const r = reqByCode.get(f.code)!;
    return { priority: r.priority, status: f.status, category: r.category };
  });
  const score = computeScore(items, run.config.weights, run.config.partialCredit);
  const categoryScores = computeCategoryScores(items, run.config.weights, run.config.partialCredit);
  const c = analysis.commercial;
  db.transaction((tx) => {
    tx.delete(evaluations)
      .where(and(eq(evaluations.runId, run.id), eq(evaluations.proposalId, vendor.proposalId)))
      .run();
    const evaluationId = newId("evaluation");
    tx.insert(evaluations)
      .values({
        id: evaluationId,
        runId: run.id,
        proposalId: vendor.proposalId,
        scorePct: score.scorePct,
        counts: score.counts,
        mandatoryFailures: score.mandatoryFailures,
        categoryScores,
        summary: analysis.summary,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        commercial: {
          ...(c.totalPrice ? { totalPrice: c.totalPrice } : {}),
          ...(c.currency ? { currency: c.currency } : {}),
          ...(c.paymentTerms ? { paymentTerms: c.paymentTerms } : {}),
          ...(c.deliveryTime ? { deliveryTime: c.deliveryTime } : {}),
          ...(c.warranty ? { warranty: c.warranty } : {}),
          ...(c.validity ? { validity: c.validity } : {}),
          exclusions: c.exclusions,
        },
      })
      .run();
    tx.insert(findings)
      .values(
        aligned.map((f) => {
          const doc = f.evidenceQuote ? matchEvidenceDoc(f.evidenceDocument, vendor.docs) : null;
          const page =
            doc?.ext === "pdf" && f.evidencePage && f.evidencePage >= 1
              ? Math.min(f.evidencePage, doc.pageCount ?? f.evidencePage)
              : null;
          return {
            id: newId("finding"),
            evaluationId,
            requirementId: reqByCode.get(f.code)!.id,
            status: f.status,
            vendorResponse: f.vendorResponse,
            evidenceQuote: f.evidenceQuote,
            evidenceDocId: doc?.id ?? null,
            evidencePage: page,
            evidenceSection: f.evidenceSection,
            assessment: f.assessment,
            gap: f.gap,
            confidence: f.confidence,
          };
        }),
      )
      .run();
  });
  finishStep(db, step, "done", { output: analysis, usage });
  return {
    proposalId: vendor.proposalId,
    vendor: vendor.name,
    scorePct: score.scorePct,
    mandatoryFailures: score.mandatoryFailures,
    counts: score.counts,
    categoryScores,
    analysis,
  };
}

export function saveComparison(db: Db, step: StepRow, data: ComparisonOutput, usage: TokenUsage) {
  db.transaction((tx) => {
    tx.delete(comparisons)
      .where(and(eq(comparisons.runId, step.runId), eq(comparisons.proposalId, step.proposalId!)))
      .run();
    tx.insert(comparisons)
      .values({ id: newId("comparison"), runId: step.runId, proposalId: step.proposalId!, data })
      .run();
  });
  finishStep(db, step, "done", { output: data, usage });
}

export function saveRisks(db: Db, step: StepRow, data: RiskOutput, usage: TokenUsage) {
  db.transaction((tx) => {
    tx.delete(risks)
      .where(and(eq(risks.runId, step.runId), eq(risks.proposalId, step.proposalId!)))
      .run();
    if (data.risks.length) {
      tx.insert(risks)
        .values(
          data.risks.map((r) => ({
            id: newId("risk"),
            runId: step.runId,
            proposalId: step.proposalId!,
            title: r.title,
            category: r.category,
            likelihood: r.likelihood,
            impact: r.impact,
            severity: riskSeverity(r.likelihood, r.impact),
            description: r.description,
            consequence: r.consequence,
            mitigation: r.mitigation,
            evidence: r.evidence,
            requirementCodes: r.requirementCodes,
          })),
        )
        .run();
    }
  });
  finishStep(db, step, "done", { output: data, usage });
}

/** Vendor name from the model → proposal id (exact, then case-insensitive containment). */
export function matchVendor(name: string | null, vendors: { proposalId: string; name: string }[]) {
  if (!name) return null;
  const n = name.trim().toLowerCase();
  return (
    vendors.find((v) => v.name.toLowerCase() === n) ??
    vendors.find((v) => n.includes(v.name.toLowerCase()) || v.name.toLowerCase().includes(n)) ??
    null
  );
}

export function saveSummary(
  db: Db,
  step: StepRow,
  ctx: RunContext,
  data: SummaryOutput,
  usage: TokenUsage,
) {
  const ranking = [...data.ranking]
    .sort((a, b) => a.rank - b.rank)
    .map((r) => ({ ...r, proposalId: matchVendor(r.vendor, ctx.vendors)?.proposalId ?? null }));
  db.transaction((tx) => {
    tx.delete(runSummaries).where(eq(runSummaries.runId, step.runId)).run();
    tx.insert(runSummaries)
      .values({
        runId: step.runId,
        ranking,
        recommendedProposalId: matchVendor(data.recommendedVendor, ctx.vendors)?.proposalId ?? null,
        executiveSummary: data.executiveSummary,
        conditions: data.conditions,
        negotiationPoints: data.negotiationPoints,
      })
      .run();
  });
  finishStep(db, step, "done", { output: data, usage });
}

// ─── Run end & project status ────────────────────────────────────────────────
function restoreProjectStatus(db: Db, projectId: string, runId: string) {
  const evaluated = db
    .select({ id: analysisRuns.id })
    .from(analysisRuns)
    .where(
      and(
        eq(analysisRuns.projectId, projectId),
        ne(analysisRuns.id, runId),
        inArray(analysisRuns.status, ["completed", "completed_with_errors"]),
      ),
    )
    .get();
  const status: ProjectStatus = evaluated ? "evaluated" : "open";
  db.update(projects).set({ status }).where(eq(projects.id, projectId)).run();
}

export function finishRun(db: Db, runId: string, status: RunStatus, error: string | null = null) {
  const run = getRun(db, runId);
  db.update(analysisRuns)
    .set({ status, error, finishedAt: now() })
    .where(eq(analysisRuns.id, runId))
    .run();
  refreshRunTotals(db, runId);
  if (status === "completed" || status === "completed_with_errors") {
    db.update(projects).set({ status: "evaluated" }).where(eq(projects.id, run.projectId)).run();
  } else {
    restoreProjectStatus(db, run.projectId, runId);
  }
}

/** Status a run ends with, from its steps (RDD §7.1 edge cases). */
export function outcomeOf(steps: StepRow[]): { status: RunStatus; error: string | null } {
  const failed = steps.filter((s) => s.status === "failed");
  if (steps.some((s) => s.status === "cancelled")) return { status: "cancelled", error: null };
  const summary = steps.find((s) => s.phase === "summary");
  if (summary?.status === "done") {
    return failed.length
      ? {
          status: "completed_with_errors",
          error: `${failed.length} step${failed.length === 1 ? "" : "s"} failed.`,
        }
      : { status: "completed", error: null };
  }
  const first = failed[0];
  return {
    status: "failed",
    error: first ? `${first.label}: ${first.error ?? "failed"}` : "The run stopped early.",
  };
}

/**
 * Restart safety (RDD §7.2): runs left running/queued by a previous server process become
 * `interrupted`, their running steps go back to `queued`, and the project leaves `evaluating`.
 */
export function reconcileInterruptedRuns(db: Db, liveRunIds: Set<string> = new Set()): string[] {
  const stale = db
    .select()
    .from(analysisRuns)
    .where(inArray(analysisRuns.status, ACTIVE_RUN_STATUSES))
    .all()
    .filter((r) => !liveRunIds.has(r.id));
  for (const run of stale) {
    db.update(analysisSteps)
      .set({ status: "queued", startedAt: null })
      .where(and(eq(analysisSteps.runId, run.id), eq(analysisSteps.status, "running")))
      .run();
    db.update(analysisRuns)
      .set({
        status: "interrupted",
        error: "The server restarted while this analysis was running.",
      })
      .where(eq(analysisRuns.id, run.id))
      .run();
    restoreProjectStatus(db, run.projectId, run.id);
  }
  return stale.map((r) => r.id);
}

/** Overall risk per proposal: the model's verdict from the risk step. */
export function overallRisks(db: Db, runId: string): Map<string, RiskSeverity> {
  const rows = db
    .select({ proposalId: analysisSteps.proposalId, output: analysisSteps.output })
    .from(analysisSteps)
    .where(
      and(
        eq(analysisSteps.runId, runId),
        eq(analysisSteps.phase, "risk"),
        eq(analysisSteps.status, "done"),
      ),
    )
    .all();
  return new Map(rows.map((r) => [r.proposalId!, (r.output as RiskOutput).overall]));
}
