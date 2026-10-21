/**
 * AI review (user request after P7): quality metrics of one analysis run, computed from what the
 * run stored, and saved in `run_quality` so they can be compared and exported later. Nothing here
 * calls the AI. Evidence quotes are checked against the documents' real text (PDF pages via
 * pdf.js, extracted text for DOCX/XLSX), with the same matching the reader uses (src/lib/quote.ts).
 * No `server-only` (G-08).
 *
 * Confidence score (0–100) = 35 % AI confidence + 35 % evidence verified + 15 % coverage
 * + 15 % completion, where
 *   AI confidence  = findings weighted high 1 · medium 0.6 · low 0.25
 *   evidence       = verified quotes (found on the cited page, or anywhere for non-paged files;
 *                    a quote on another page counts half) / quotes that could be checked
 *   coverage       = requirements the AI answered itself / all findings
 *   completion     = analysed vendors / vendors in the run (+ summary written)
 */
import { eq } from "drizzle-orm";
import type { Db } from "../db/connect";
import { analysisSteps, findings as findingsTable, runQuality, evaluations } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { readPdfPages } from "../documents/pdf-text";
import type { RunQualityDto } from "../../lib/api-types";
import { findQuotePage, textContainsQuote } from "../../lib/quote";
import { emptyCounts } from "../../lib/scoring";
import { isNativeDoc } from "../ai/content";
import type { SourceDoc } from "../ai/types";
import { loadRunContext } from "./context";
import { getRun, listSteps, readChecklist } from "./store";

const NOT_ASSESSED = "Not assessed by the model";
const CONF_WEIGHT = { high: 1, medium: 0.6, low: 0.25 } as const;

const round1 = (x: number) => Math.round(x * 10) / 10;
const pct = (num: number, den: number) => (den > 0 ? round1((num / den) * 100) : null);

function sentAs(d: SourceDoc): RunQualityDto["files"]["list"][number]["sentAs"] {
  if (!d.aiReadable) return "skipped";
  if (d.ext === "pdf") return "pdf";
  if (isNativeDoc(d)) return "image";
  return d.textContent ? "text" : "skipped";
}

export async function computeRunQuality(
  db: Db,
  storage: LocalStorage,
  runId: string,
): Promise<RunQualityDto> {
  const run = getRun(db, runId);
  const steps = listSteps(db, runId);
  const ctx = loadRunContext(db, run.projectId, run.config);
  const checklist = readChecklist(db, runId);
  const checklistDone = !!checklist;
  const analyzeStep = (proposalId: string) =>
    steps.find((s) => s.phase === "analyze" && s.proposalId === proposalId);

  // ─── Files ─────────────────────────────────────────────────────────────────
  const list: RunQualityDto["files"]["list"] = [
    ...ctx.rfpDocs.map((d) => ({ d, group: "rfp" as const, owner: "RFP", used: checklistDone })),
    ...ctx.standards.flatMap((s) =>
      s.docs.map((d) => ({ d, group: "standard" as const, owner: s.code, used: checklistDone })),
    ),
    ...ctx.vendors.flatMap((v) =>
      v.docs.map((d) => ({
        d,
        group: "proposal" as const,
        owner: v.name,
        used: analyzeStep(v.proposalId)?.status === "done",
      })),
    ),
  ].map(({ d, group, owner, used }) => {
    const as = sentAs(d);
    return {
      id: d.id,
      name: d.name,
      group,
      owner,
      pages: d.pageCount,
      sentAs: as,
      used: used && as !== "skipped",
    };
  });

  // ─── Findings + evidence ───────────────────────────────────────────────────
  const evals = db.select().from(evaluations).where(eq(evaluations.runId, runId)).all();
  const docById = new Map(ctx.vendors.flatMap((v) => v.docs).map((d) => [d.id, d]));
  const pageCache = new Map<string, Promise<string[] | null>>();
  const textOf = (d: SourceDoc): Promise<string[] | null> => {
    let hit = pageCache.get(d.id);
    if (!hit) {
      hit =
        d.ext === "pdf"
          ? storage
              .read(d.storagePath)
              .then((b) => readPdfPages(b))
              .then((p) => (p.length ? p : null))
              .catch(() => null)
          : Promise.resolve(d.textContent ? [d.textContent] : null);
      pageCache.set(d.id, hit);
    }
    return hit;
  };

  const byStatus = emptyCounts();
  const byConfidence = { high: 0, medium: 0, low: 0 };
  const evidence = { quoted: 0, verified: 0, otherPage: 0, notFound: 0, unchecked: 0 };
  let total = 0;
  let notAssessed = 0;
  const vendors: RunQualityDto["vendors"] = [];

  for (const v of ctx.vendors) {
    const ev = evals.find((e) => e.proposalId === v.proposalId);
    const rows = ev
      ? db.select().from(findingsTable).where(eq(findingsTable.evaluationId, ev.id)).all()
      : [];
    const ve = { quoted: 0, verified: 0, otherPage: 0, checkable: 0 };
    let confSum = 0;
    for (const f of rows) {
      total++;
      byStatus[f.status]++;
      byConfidence[f.confidence]++;
      confSum += CONF_WEIGHT[f.confidence];
      if (f.assessment.startsWith(NOT_ASSESSED)) notAssessed++;
      if (!f.evidenceQuote) continue;
      evidence.quoted++;
      ve.quoted++;
      const doc = f.evidenceDocId ? docById.get(f.evidenceDocId) : undefined;
      const pages = doc ? await textOf(doc) : null;
      if (!pages) {
        evidence.unchecked++;
        continue;
      }
      ve.checkable++;
      const cited = f.evidencePage && doc?.ext === "pdf" ? f.evidencePage - 1 : 0;
      if (doc?.ext !== "pdf") {
        if (textContainsQuote(pages[0], f.evidenceQuote)) {
          evidence.verified++;
          ve.verified++;
        } else evidence.notFound++;
        continue;
      }
      const at = findQuotePage(
        pages,
        f.evidenceQuote,
        Math.min(Math.max(cited, 0), pages.length - 1),
      );
      if (at < 0) evidence.notFound++;
      else if (!f.evidencePage || at === cited) {
        evidence.verified++;
        ve.verified++;
      } else {
        evidence.otherPage++;
        ve.otherPage++;
      }
    }
    const a = analyzeStep(v.proposalId);
    vendors.push({
      proposalId: v.proposalId,
      vendor: v.name,
      files: v.docs.length,
      pages: v.docs.reduce((s, d) => s + (d.pageCount ?? 0), 0),
      findings: rows.length,
      scorePct: ev?.scorePct ?? null,
      evidenceVerifiedPct: pct(ve.verified + ve.otherPage * 0.5, ve.checkable),
      aiConfidencePct: pct(confSum, rows.length),
      analysisStatus: a?.status ?? null,
      analysisAttempts: a?.attempt ?? 0,
    });
  }

  // ─── Steps, usage, score ───────────────────────────────────────────────────
  const count = (s: string) => steps.filter((x) => x.status === s).length;
  const attempts = steps.reduce((s, x) => s + x.attempt, 0);
  const u = run.usage;
  const prompt = u ? u.inputTokens + u.cacheReadTokens + u.cacheWriteTokens : 0;
  const checkable = evidence.verified + evidence.otherPage + evidence.notFound;
  const parts = {
    aiConfidence:
      total > 0
        ? (byConfidence.high * CONF_WEIGHT.high +
            byConfidence.medium * CONF_WEIGHT.medium +
            byConfidence.low * CONF_WEIGHT.low) /
          total
        : 0,
    evidence: checkable > 0 ? (evidence.verified + evidence.otherPage * 0.5) / checkable : 0,
    coverage: total > 0 ? (total - notAssessed) / total : 0,
    completion:
      ctx.vendors.length > 0
        ? (evals.length / ctx.vendors.length) * 0.9 +
          (steps.find((s) => s.phase === "summary")?.status === "done" ? 0.1 : 0)
        : 0,
  };
  const score = Math.round(
    100 *
      (0.35 * parts.aiConfidence +
        0.35 * parts.evidence +
        0.15 * parts.coverage +
        0.15 * parts.completion),
  );
  const started = run.startedAt ? Date.parse(run.startedAt) : null;
  const finished = run.finishedAt ? Date.parse(run.finishedAt) : null;

  return {
    runId,
    computedAt: new Date().toISOString(),
    model: run.model,
    mode: run.config.mode ?? "mock",
    status: run.status,
    durationMs: started && finished ? finished - started : null,
    costUsd: run.costUsd,
    usage: u ?? null,
    cacheHitPct: u && prompt > 0 ? round1((u.cacheReadTokens / prompt) * 100) : null,
    files: {
      total: list.length,
      pages: list.reduce((s, f) => s + (f.pages ?? 0), 0),
      processed: list.filter((f) => f.used).length,
      skipped: list.filter((f) => f.sentAs === "skipped").length,
      list,
    },
    steps: {
      total: steps.length,
      done: count("done"),
      failed: count("failed"),
      skipped: count("skipped"),
      cancelled: count("cancelled"),
      attempts,
      retries: steps.reduce((s, x) => s + Math.max(0, x.attempt - 1), 0),
    },
    findings: { total, byStatus, byConfidence, notAssessed },
    evidence,
    vendors,
    confidence: {
      score,
      label: score >= 85 ? "High" : score >= 70 ? "Good" : score >= 50 ? "Fair" : "Low",
      parts: {
        aiConfidence: Math.round(parts.aiConfidence * 100),
        evidence: Math.round(parts.evidence * 100),
        coverage: Math.round(parts.coverage * 100),
        completion: Math.round(parts.completion * 100),
      },
    },
  };
}

/** Compute and store (replacing an older computation). */
export async function saveRunQuality(db: Db, storage: LocalStorage, runId: string) {
  const metrics = await computeRunQuality(db, storage, runId);
  db.insert(runQuality)
    .values({ runId, metrics, computedAt: metrics.computedAt })
    .onConflictDoUpdate({
      target: runQuality.runId,
      set: { metrics, computedAt: metrics.computedAt },
    })
    .run();
  return metrics;
}

/**
 * Stored metrics, computed on first use for runs that finished before this feature existed (or
 * whose steps changed since: retries update the run after the metrics were saved).
 */
export async function getRunQuality(db: Db, storage: LocalStorage, runId: string) {
  const run = getRun(db, runId);
  const row = db.select().from(runQuality).where(eq(runQuality.runId, runId)).get();
  const lastStep = db
    .select({ f: analysisSteps.finishedAt })
    .from(analysisSteps)
    .where(eq(analysisSteps.runId, runId))
    .all()
    .reduce((m, s) => (s.f && s.f > m ? s.f : m), run.finishedAt ?? "");
  if (row && row.computedAt >= lastStep) return row.metrics as RunQualityDto;
  return saveRunQuality(db, storage, runId);
}
