/**
 * Run engine (RDD §7.2, P6.7). Phases run in strict order (P8: checklist → standards → analyze
 * (RFP) → risk → summary → report; `compare` only in older runs); inside a phase, steps run up to
 * `concurrency` at a time. The first step of a phase
 * goes alone until its response starts streaming, so the others can read the prompt-cache entry
 * it writes (parallel requests with the same prefix can't share a cache entry).
 *
 * Every step is persisted when it finishes. A schema/parse failure or an expired Files API id
 * retries the step once; anything else marks it failed (Retry in the UI). Cancel aborts the live
 * requests through their AbortSignal. No `server-only`: tests drive it with an in-memory DB.
 *
 * Nothing paid for is lost (2026-10-26, user: "if smth stopped in the middle we can continue"):
 * - an error about the account or the connection (credit, spending limit, rate limit, network,
 *   Anthropic down) pauses the run: the step goes back to the queue, no new step starts, and the
 *   run is `interrupted` with the reason; Resume carries on from there;
 * - a failed check (standards, RFP, risk) holds the run before the recommendation, which would
 *   otherwise be written, with every report, without that vendor and again after its Retry. Retry
 *   the check, or Resume to finish without it.
 */
import { eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { analysisRuns, analysisSteps, projects } from "../db/schema";
import { RUN_PHASES, sectionTemplateFor, type RunPhase } from "../../lib/domain";
import type { BoqComparisonDto } from "../../lib/api-types";
import { ApiError } from "../api-errors";
import { describeError, pauseReason } from "../ai/client";
import { usageOfError } from "../ai/parts";
import { nativeDocsFor } from "../ai/content";
import { AiError } from "../ai/result";
import type {
  AnalysisOutput,
  ChecklistOutput,
  ComparisonOutput,
  ReportOutput,
  RiskOutput,
  SummaryOutput,
} from "../ai/schemas";
import type { AiEngine, RunContext, SourceDoc, StepInput } from "../ai/types";
import type { TranslationOutput } from "../ai/translate";
import { loadRunContext } from "./context";
import { computeVendorScores } from "./scores";
import { collectRunTexts, originalLanguage, otherLanguage } from "./texts";
import {
  addReportSteps,
  addTranslateStep,
  addStepUsage,
  createRun,
  findActiveRun,
  finishRun,
  getRun,
  listSteps,
  markRunRunning,
  markStepCancelled,
  markStepFailed,
  markStepQueued,
  markStepRunning,
  markStepSkipped,
  outcomeOf,
  readChecklist,
  readDigests,
  readRiskOutput,
  reconcileInterruptedRuns,
  saveAnalysis,
  saveChecklist,
  saveComparison,
  saveReport,
  saveRisks,
  saveSummary,
  saveTranslation,
  type RunRow,
  type StepRow,
} from "./store";

export interface RunnerDeps {
  db: Db;
  engineFor(run: RunRow): AiEngine;
  /** Clear cached Files API ids so the next attempt re-uploads (live engine only). */
  forgetUploads?(docs: SourceDoc[]): void;
  mode: "mock" | "live";
  apiKeyConfigured: boolean;
  /** Called after a run ends (any status), e.g. to compute its quality metrics. */
  onFinished?(runId: string): Promise<unknown> | void;
  /**
   * Building works (2026-10-25): the price comparison of the run's bids, given to the steps as
   * Mizan's figures. Not set (or null) for other tenders.
   */
  pricesFor?(run: RunRow): Promise<BoqComparisonDto | null>;
}

interface Handle {
  runId: string;
  cancelled: boolean;
  /** Why the run stopped starting steps (account/connection error, or a held check). */
  paused: string | null;
  /** Hold before the recommendation when a check failed (off after Resume on a hold). */
  hold: boolean;
  controllers: Set<AbortController>;
  done: Promise<void>;
}

/** Checks whose failure leaves a vendor out of the recommendation and the reports. */
const CHECK_PHASES = new Set<RunPhase>(["standards", "analyze", "risk"]);

/** The reason a run is held before the recommendation, or null. */
function heldReason(steps: StepRow[]): string | null {
  if (!steps.some((s) => s.phase === "summary" && s.status === "queued")) return null;
  const failed = steps.filter((s) => CHECK_PHASES.has(s.phase) && s.status === "failed");
  if (!failed.length) return null;
  return failed.length === 1
    ? `${failed[0].label} failed. Retry it so the recommendation and the reports cover every vendor, or press Resume to finish without it.`
    : `${failed.length} checks failed. Retry them so the recommendation and the reports cover every vendor, or press Resume to finish without them.`;
}

export type Runner = ReturnType<typeof createRunner>;

const vendorNames = (ctx: RunContext) => new Map(ctx.vendors.map((v) => [v.proposalId, v.name]));

export function createRunner(deps: RunnerDeps) {
  const { db } = deps;
  const live = new Map<string, Handle>();

  // ─── Inputs ────────────────────────────────────────────────────────────────
  /** Why a step can't run (its inputs failed or were skipped), or null when it is ready. */
  function blockedReason(step: StepRow, run: RunRow, ctx: RunContext): string | null {
    if (step.phase === "checklist") return null;
    // The Translator takes whatever the run produced, even if some steps failed.
    if (step.phase === "translate")
      return readChecklist(db, run.id) ? null : "Nothing to translate.";
    if (!readChecklist(db, run.id)) return "Needs the checklist (step 1).";
    if (
      step.phase === "standards" ||
      step.phase === "analyze" ||
      step.phase === "compare" ||
      step.phase === "risk" ||
      step.phase === "report"
    ) {
      if (!ctx.vendors.some((v) => v.proposalId === step.proposalId))
        return "The proposal was removed.";
    }
    const digests = readDigests(db, run.id, ctx);
    if (step.phase === "compare") {
      if (!digests.some((d) => d.proposalId === step.proposalId))
        return "Needs this vendor's analysis.";
      if (digests.length < 2) return "Needs at least two analysed proposals.";
    }
    if (step.phase === "risk" && !digests.some((d) => d.proposalId === step.proposalId)) {
      return "Needs this vendor's analysis.";
    }
    if (step.phase === "summary" && !digests.length) return "Needs at least one analysed proposal.";
    if (step.phase === "report") {
      if (!digests.some((d) => d.proposalId === step.proposalId))
        return "Needs this vendor's analysis.";
      const summary = listSteps(db, run.id).find((s) => s.phase === "summary");
      if (summary?.status !== "done") return "Needs the recommendation.";
    }
    return null;
  }

  function buildInput(step: StepRow, run: RunRow, ctx: RunContext): StepInput {
    if (step.phase === "checklist") return { phase: "checklist", ctx };
    if (step.phase === "translate") {
      const source = originalLanguage(run);
      return {
        phase: "translate",
        ctx,
        texts: collectRunTexts(db, run.id),
        source,
        target: otherLanguage(source),
      };
    }
    const checklist = readChecklist(db, run.id)!;
    const vendor = ctx.vendors.find((v) => v.proposalId === step.proposalId);
    const analyses = readDigests(db, run.id, ctx);
    switch (step.phase) {
      case "standards":
        return { phase: "standards", ctx, checklist, vendor: vendor! };
      case "analyze":
        return { phase: "analyze", ctx, checklist, vendor: vendor! };
      case "compare":
        return { phase: "compare", ctx, checklist, vendor: vendor!, analyses };
      case "risk":
        return {
          phase: "risk",
          ctx,
          checklist,
          vendor: vendor!,
          analysis: analyses.find((a) => a.proposalId === step.proposalId)!,
        };
      case "summary": {
        // P8: Marsa ranks the vendors and picks one; the model explains the pick.
        const scores = computeVendorScores(db, run, vendorNames(ctx));
        const missing = ctx.vendors
          .filter((v) => !analyses.some((a) => a.proposalId === v.proposalId))
          .map((v) => v.name);
        return {
          phase: "summary",
          ctx,
          checklist,
          analyses,
          scores,
          recommended: scores[0]?.vendor ?? null,
          missing,
        };
      }
      case "report": {
        const scores = computeVendorScores(db, run, vendorNames(ctx));
        const own = scores.find((s) => s.proposalId === step.proposalId);
        if (!own) throw new Error("This vendor has no scores.");
        return {
          phase: "report",
          ctx,
          checklist,
          vendor: vendor!,
          analysis: analyses.find((a) => a.proposalId === step.proposalId)!,
          risks: readRiskOutput(db, run.id, step.proposalId!),
          scores: own,
          ranked: scores.length,
          recommended: scores[0]?.vendor ?? null,
          otherPrices: analyses
            .filter((a) => a.proposalId !== step.proposalId)
            .map((a) => ({
              vendor: a.vendor,
              totalPrice: a.analysis.commercial.totalPrice,
              currency: a.analysis.commercial.currency,
            })),
        };
      }
      default:
        throw new Error(`Unknown phase: ${step.phase}`);
    }
  }

  function persist(
    step: StepRow,
    run: RunRow,
    ctx: RunContext,
    data: unknown,
    usage: Parameters<typeof saveRisks>[3],
  ) {
    switch (step.phase) {
      case "checklist":
        return saveChecklist(db, step, data as ChecklistOutput, ctx, usage);
      case "standards":
      case "analyze":
        return saveAnalysis(db, step, run, ctx, data as AnalysisOutput, usage);
      case "compare":
        return saveComparison(db, step, data as ComparisonOutput, usage);
      case "risk":
        return saveRisks(db, step, data as RiskOutput, usage);
      case "summary":
        return saveSummary(
          db,
          step,
          ctx,
          data as SummaryOutput,
          usage,
          computeVendorScores(db, run, vendorNames(ctx)),
        );
      case "report":
        return saveReport(db, step, data as ReportOutput, usage);
      case "translate":
        return saveTranslation(db, step, data as TranslationOutput, usage);
    }
  }

  // ─── Execution ─────────────────────────────────────────────────────────────
  async function runStep(
    handle: Handle,
    step: StepRow,
    run: RunRow,
    ctx: RunContext,
    engine: AiEngine,
    onStarted: () => void,
  ) {
    for (let attempt = 0; ; attempt++) {
      if (handle.cancelled) return markStepCancelled(db, step);
      const reason = blockedReason(step, run, ctx);
      if (reason) return markStepSkipped(db, step, reason);
      markStepRunning(db, step.id);
      const ctrl = new AbortController();
      handle.controllers.add(ctrl);
      let input: StepInput | null = null;
      try {
        input = buildInput(step, run, ctx);
        const res = await engine.runStep(input as never, { signal: ctrl.signal, onStarted });
        if (handle.cancelled) return markStepCancelled(db, step, res.usage);
        persist(step, run, ctx, res.data, res.usage);
        return;
      } catch (err) {
        const usage = usageOfError(err);
        if (handle.cancelled) return markStepCancelled(db, step, usage);
        // The account or the connection, not this step: pause the run (Resume continues).
        const pause = pauseReason(err);
        if (pause) {
          handle.paused ??= pause;
          return markStepQueued(db, step, usage);
        }
        const retryable =
          err instanceof AiError && (err.code === "invalid_output" || err.code === "file_missing");
        if (retryable && attempt === 0) {
          if (usage) addStepUsage(db, step, usage);
          if (err.code === "file_missing" && input) deps.forgetUploads?.(nativeDocsFor(input));
          continue;
        }
        return markStepFailed(db, step, describeError(err), usage);
      } finally {
        handle.controllers.delete(ctrl);
      }
    }
  }

  /** Run a phase's steps, `limit` at a time; the first one alone until it starts streaming. */
  async function runPhase(
    handle: Handle,
    steps: StepRow[],
    limit: number,
    fn: (s: StepRow, started: () => void) => Promise<void>,
  ) {
    if (!steps.length) return;
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    let next = 0;
    const worker = async (w: number) => {
      if (w > 0) await gate;
      while (next < steps.length && !handle.cancelled && !handle.paused) {
        const step = steps[next++];
        await fn(step, release);
        release();
      }
    };
    await Promise.all(
      Array.from({ length: Math.min(Math.max(1, limit), steps.length) }, (_, w) => worker(w)),
    );
  }

  async function execute(handle: Handle) {
    const run = getRun(db, handle.runId);
    try {
      markRunRunning(db, run.id);
      db.update(projects).set({ status: "evaluating" }).where(eq(projects.id, run.projectId)).run();
      const ctx = loadRunContext(db, run.projectId, run.config);
      if (sectionTemplateFor(ctx.project.category) === "works")
        ctx.boq = (await deps.pricesFor?.(run).catch(() => null)) ?? null;
      const engine = deps.engineFor(run);
      for (const phase of RUN_PHASES) {
        if (handle.cancelled || handle.paused) break;
        if (phase === "summary" && handle.hold) {
          handle.paused = heldReason(listSteps(db, run.id));
          if (handle.paused) break;
        }
        const queued = listSteps(db, run.id).filter(
          (s) => s.phase === phase && s.status === "queued",
        );
        await runPhase(handle, queued, run.config.concurrency, (s, started) =>
          runStep(handle, s, run, ctx, engine, started),
        );
      }
    } catch (err) {
      // A bug or a DB error outside a step: stop the run with a readable reason.
      for (const s of listSteps(db, run.id)) {
        if (s.status === "running" || s.status === "queued") markStepCancelled(db, s);
      }
      return finishRun(db, run.id, "failed", describeError(err));
    }
    const steps = listSteps(db, run.id);
    if (handle.cancelled) {
      for (const s of steps)
        if (s.status === "queued" || s.status === "running") markStepCancelled(db, s);
      return finishRun(db, run.id, "cancelled");
    }
    // Paused: the steps not run yet stay queued for Resume.
    if (handle.paused) return finishRun(db, run.id, "interrupted", handle.paused);
    const { status, error } = outcomeOf(steps);
    finishRun(db, run.id, status, error);
  }

  function launch(runId: string, hold = true) {
    if (live.has(runId)) return live.get(runId)!;
    const handle: Handle = {
      runId,
      cancelled: false,
      paused: null,
      hold,
      controllers: new Set(),
      done: Promise.resolve(),
    };
    live.set(runId, handle);
    handle.done = execute(handle)
      .then(async () => {
        await deps.onFinished?.(runId);
      })
      .catch((err) => console.error(`[runner] run ${runId} crashed:`, err))
      .finally(() => live.delete(runId));
    return handle;
  }

  /** Steps back to `queued` (resume / retry) and the run back to queued. */
  function requeue(run: RunRow, stepIds: string[]) {
    if (stepIds.length) {
      db.update(analysisSteps)
        .set({ status: "queued", error: null, startedAt: null, finishedAt: null, durationMs: null })
        .where(inArray(analysisSteps.id, stepIds))
        .run();
    }
    db.update(analysisRuns)
      .set({ status: "queued", error: null, finishedAt: null })
      .where(eq(analysisRuns.id, run.id))
      .run();
    db.update(projects).set({ status: "evaluating" }).where(eq(projects.id, run.projectId)).run();
  }

  function assertIdle(run: RunRow) {
    if (live.has(run.id) || run.status === "running" || run.status === "queued") {
      throw new ApiError(409, "run_active", "This analysis is still running.");
    }
    const other = findActiveRun(db, run.projectId);
    if (other && other.id !== run.id) {
      throw new ApiError(409, "run_active", "Another analysis is running for this project.");
    }
    const project = db
      .select({ status: projects.status })
      .from(projects)
      .where(eq(projects.id, run.projectId))
      .get();
    if (project?.status === "archived") {
      throw new ApiError(
        409,
        "invalid_transition",
        "Restore the project before continuing its analysis.",
      );
    }
  }

  // Restart safety: anything left running by a previous process is interrupted (RDD §7.2).
  reconcileInterruptedRuns(db, new Set());

  return {
    start(projectId: string): RunRow {
      const run = createRun(db, projectId, {
        mode: deps.mode,
        apiKeyConfigured: deps.apiKeyConfigured,
      });
      launch(run.id);
      return run;
    },

    cancel(runId: string): RunRow {
      const run = getRun(db, runId);
      const handle = live.get(runId);
      if (handle) {
        handle.cancelled = true;
        for (const c of handle.controllers) c.abort();
        return getRun(db, runId);
      }
      if (run.status !== "interrupted" && run.status !== "queued") {
        throw new ApiError(
          409,
          "invalid_transition",
          `A ${run.status.replace(/_/g, " ")} analysis can't be cancelled.`,
        );
      }
      for (const s of listSteps(db, runId))
        if (s.status === "queued" || s.status === "running") markStepCancelled(db, s);
      finishRun(db, runId, "cancelled");
      return getRun(db, runId);
    },

    /**
     * Continue an interrupted or cancelled run; finished steps are never re-run (or re-billed).
     * On a run held for a failed check, Resume means "finish without it".
     */
    resume(runId: string): RunRow {
      const run = getRun(db, runId);
      if (run.status !== "interrupted" && run.status !== "cancelled") {
        throw new ApiError(
          409,
          "invalid_transition",
          "Only an interrupted or cancelled analysis can be resumed.",
        );
      }
      assertIdle(run);
      const steps = listSteps(db, runId);
      const held = heldReason(steps);
      const ids = steps
        .filter(
          (s) =>
            s.status === "queued" ||
            s.status === "running" ||
            s.status === "cancelled" ||
            s.status === "skipped",
        )
        .map((s) => s.id);
      requeue(run, ids);
      launch(runId, !(held && run.error === held));
      return getRun(db, runId);
    },

    /**
     * Reports for a run that finished before reports existed (one-time backfill, 2026-10-25, no
     * button): one report step per ranked vendor that has none, plus report steps that did not
     * finish; only those run (finished steps are never re-run or re-billed).
     */
    addReports(runId: string): RunRow {
      const run = getRun(db, runId);
      if (run.status !== "completed" && run.status !== "completed_with_errors") {
        throw new ApiError(
          409,
          "invalid_transition",
          "Reports can only be added to a finished analysis.",
        );
      }
      assertIdle(run);
      const steps = listSteps(db, runId);
      if (!steps.some((s) => s.phase === "summary" && s.status === "done")) {
        throw new ApiError(409, "invalid_transition", "This analysis has no recommendation.");
      }
      const ctx = loadRunContext(db, run.projectId, run.config);
      const have = new Set(steps.filter((s) => s.phase === "report").map((s) => s.proposalId));
      const added = addReportSteps(
        db,
        run,
        computeVendorScores(db, run, vendorNames(ctx))
          .filter((s) => !have.has(s.proposalId))
          .map((s) => ({ proposalId: s.proposalId, name: s.vendor })),
      );
      const again = steps
        .filter((s) => s.phase === "report" && s.status !== "done")
        .map((s) => s.id);
      if (!added.length && !again.length) return run;
      // New reports need translating too.
      const translate = steps.filter((s) => s.phase === "translate").map((s) => s.id);
      requeue(run, [...added, ...again, ...translate]);
      launch(runId);
      return getRun(db, runId);
    },

    /**
     * The other language for a run that finished before the Translator existed (one-time
     * backfill, 2026-10-25, no button): adds the Translator step, or runs it again.
     */
    addTranslation(runId: string): RunRow {
      const run = getRun(db, runId);
      if (run.status !== "completed" && run.status !== "completed_with_errors") {
        throw new ApiError(
          409,
          "invalid_transition",
          "Only a finished analysis can be translated.",
        );
      }
      assertIdle(run);
      const existing = listSteps(db, runId).find((s) => s.phase === "translate");
      const id = existing?.id ?? addTranslateStep(db, run, otherLanguage(originalLanguage(run)));
      requeue(run, [id]);
      launch(runId);
      return getRun(db, runId);
    },

    /**
     * Re-run one failed (or cancelled) step, plus whatever it unblocks. A retried check changes
     * the scores, so the recommendation and every report are written again; a retried report
     * only re-runs itself. The Translator always runs again, so both languages stay the same.
     */
    retryStep(runId: string, stepId: string): RunRow {
      const run = getRun(db, runId);
      assertIdle(run);
      const steps = listSteps(db, runId);
      const step = steps.find((s) => s.id === stepId);
      if (!step) throw new ApiError(404, "not_found", "Step not found.");
      if (step.status !== "failed" && step.status !== "cancelled") {
        throw new ApiError(
          409,
          "invalid_transition",
          "Only a failed or cancelled step can be retried.",
        );
      }
      const order = (p: RunPhase) => RUN_PHASES.indexOf(p);
      const ids = steps
        .filter(
          (s) =>
            s.id === step.id ||
            (order(s.phase) > order(step.phase) &&
              (s.status === "skipped" || s.status === "cancelled")) ||
            (order(step.phase) < order("summary") &&
              (s.phase === "summary" || s.phase === "report")) ||
            s.phase === "translate",
        )
        .map((s) => s.id);
      requeue(run, ids);
      launch(runId);
      return getRun(db, runId);
    },

    isLive: (runId: string) => live.has(runId),
    liveRunIds: () => new Set(live.keys()),
    /** Resolves when the run's current execution ends (tests). */
    wait: (runId: string) => live.get(runId)?.done ?? Promise.resolve(),
  };
}
