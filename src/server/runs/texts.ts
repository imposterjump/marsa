/**
 * The AI-written texts of a run, for the Translator (2026-10-25). Every text is keyed by item and
 * field (`<kind>:<id>:<field>`, plus `:<i>` for list items) so its translation can be swapped in
 * when the results are read in the run's other language. Data stays as it is: vendor names,
 * codes, quotes from the documents, evidence references, numbers, and the rules of the customer's
 * own standards. No `server-only`: tests use it with an in-memory DB.
 */
import { and, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import {
  analysisMeta,
  analysisSteps,
  evaluations,
  findings,
  requirements,
  risks,
  runSummaries,
  runTranslations,
} from "../db/schema";
import type { CommercialSnapshot, ReportLanguage } from "../../lib/domain";
import type { ChecklistOutput, ReportOutput } from "../ai/schemas";
import type { RunRow } from "./store";

export interface RunText {
  key: string;
  text: string;
}

export const textKey = (kind: string, id: string, field: string, i?: number) =>
  i == null ? `${kind}:${id}:${field}` : `${kind}:${id}:${field}:${i}`;

/** Commercial snapshot fields written by the AI (the price and currency are data). */
const COMMERCIAL_TEXT = ["paymentTerms", "deliveryTime", "warranty", "validity"] as const;
/** Report fields that are enums or document references, never prose. */
const REPORT_KEEP = new Set(["verdict", "rating", "reference"]);

/** Every string leaf of a report with its dotted path ("technical.strengths.0.point"). */
function reportLeaves(value: unknown, path: string, out: [string, string][]) {
  if (typeof value === "string") out.push([path, value]);
  else if (Array.isArray(value)) value.forEach((v, i) => reportLeaves(v, `${path}.${i}`, out));
  else if (value && typeof value === "object") {
    for (const [k, v] of Object.entries(value)) {
      if (!REPORT_KEEP.has(k)) reportLeaves(v, path ? `${path}.${k}` : k, out);
    }
  }
}

/** The texts of a run's finished steps, in reading order. */
export function collectRunTexts(db: Db, runId: string): RunText[] {
  const out: RunText[] = [];
  const add = (key: string, text: string | null | undefined) => {
    if (text && text.trim()) out.push({ key, text });
  };
  const list = (kind: string, id: string, field: string, items: string[]) =>
    items.forEach((t, i) => add(textKey(kind, id, field, i), t));

  // (Read here rather than through store.ts, which imports this module.)
  const step = db
    .select({ output: analysisSteps.output, status: analysisSteps.status })
    .from(analysisSteps)
    .where(and(eq(analysisSteps.runId, runId), eq(analysisSteps.phase, "checklist")))
    .get();
  const checklist = step?.status === "done" ? (step.output as ChecklistOutput) : null;
  checklist?.keyConstraints.forEach((c, i) => {
    add(textKey("constraint", runId, "label", i), c.label);
    add(textKey("constraint", runId, "value", i), c.value);
  });
  for (const r of db.select().from(requirements).where(eq(requirements.runId, runId)).all()) {
    if (r.sourceType === "standard") continue; // the customer's own rule text
    add(textKey("req", r.id, "title"), r.title);
    add(textKey("req", r.id, "description"), r.description);
    add(textKey("req", r.id, "acceptance"), r.acceptance);
  }
  const evs = db.select().from(evaluations).where(eq(evaluations.runId, runId)).all();
  for (const e of evs) {
    add(textKey("eval", e.id, "summary"), e.summary);
    list("eval", e.id, "strengths", e.strengths);
    list("eval", e.id, "weaknesses", e.weaknesses);
    for (const f of COMMERCIAL_TEXT) add(textKey("eval", e.id, f), e.commercial[f]);
    list("eval", e.id, "exclusions", e.commercial.exclusions ?? []);
  }
  if (evs.length) {
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
    for (const f of rows) {
      add(textKey("finding", f.id, "vendorResponse"), f.vendorResponse);
      add(textKey("finding", f.id, "assessment"), f.assessment);
      add(textKey("finding", f.id, "gap"), f.gap);
    }
  }
  for (const m of db.select().from(analysisMeta).where(eq(analysisMeta.runId, runId)).all()) {
    add(textKey("meta", m.itemId, "headline"), m.headline);
  }
  for (const r of db.select().from(risks).where(eq(risks.runId, runId)).all()) {
    add(textKey("risk", r.id, "title"), r.title);
    add(textKey("risk", r.id, "description"), r.description);
    add(textKey("risk", r.id, "consequence"), r.consequence);
    add(textKey("risk", r.id, "mitigation"), r.mitigation);
  }
  const summary = db.select().from(runSummaries).where(eq(runSummaries.runId, runId)).get();
  if (summary) {
    add(textKey("summary", runId, "executiveSummary"), summary.executiveSummary);
    list("summary", runId, "conditions", summary.conditions);
    list("summary", runId, "negotiationPoints", summary.negotiationPoints);
  }
  const reports = db
    .select()
    .from(analysisSteps)
    .where(and(eq(analysisSteps.runId, runId), eq(analysisSteps.phase, "report")))
    .all();
  for (const s of reports) {
    if (s.status !== "done" || !s.proposalId || !s.output) continue;
    const leaves: [string, string][] = [];
    reportLeaves(s.output, "", leaves);
    for (const [path, text] of leaves) add(textKey("report", s.proposalId, path), text);
  }
  return out;
}

/** The language a run was written in (runs before 2026-10-25 kept the setting's choice). */
export const originalLanguage = (run: RunRow): ReportLanguage => run.config.reportLanguage ?? "en";

/** The other language: the Translator's target. */
export const otherLanguage = (lang: ReportLanguage): ReportLanguage =>
  lang === "ar" ? "en" : "ar";

/** Swaps in a run's translated texts; the identity when the run is read in its own language. */
export interface Localizer {
  /** The language the texts come out in (the requested one when a translation exists). */
  language: ReportLanguage;
  /** When the translation in use was written (null for the original texts). */
  version: string | null;
  text(key: string, original: string): string;
  maybe(key: string, original: string | null): string | null;
  list(kind: string, id: string, field: string, items: string[]): string[];
  commercial(evaluationId: string, c: CommercialSnapshot): CommercialSnapshot;
  report(proposalId: string, report: ReportOutput): ReportOutput;
}

export function localizer(
  db: Db,
  run: RunRow,
  requested: ReportLanguage | null | undefined,
): Localizer {
  const own = originalLanguage(run);
  const row =
    requested && requested !== own
      ? db
          .select({ texts: runTranslations.texts, createdAt: runTranslations.createdAt })
          .from(runTranslations)
          .where(and(eq(runTranslations.runId, run.id), eq(runTranslations.locale, requested)))
          .get()
      : undefined;
  const map = row?.texts ?? null;
  const get = (key: string, original: string) => (map ? (map[key] ?? original) : original);
  return {
    language: map ? requested! : own,
    version: map ? row!.createdAt : null,
    text: get,
    maybe: (key, original) => (original == null ? original : get(key, original)),
    list: (kind, id, field, items) => items.map((t, i) => get(textKey(kind, id, field, i), t)),
    commercial(evaluationId, c) {
      if (!map) return c;
      const out: CommercialSnapshot = { ...c };
      for (const f of COMMERCIAL_TEXT) {
        if (c[f]) out[f] = get(textKey("eval", evaluationId, f), c[f]!);
      }
      if (c.exclusions)
        out.exclusions = c.exclusions.map((t, i) =>
          get(textKey("eval", evaluationId, "exclusions", i), t),
        );
      return out;
    },
    report(proposalId, report) {
      if (!map) return report;
      const walk = (value: unknown, path: string): unknown => {
        if (typeof value === "string") return get(textKey("report", proposalId, path), value);
        if (Array.isArray(value)) return value.map((v, i) => walk(v, `${path}.${i}`));
        if (value && typeof value === "object") {
          return Object.fromEntries(
            Object.entries(value).map(([k, v]) => [
              k,
              REPORT_KEEP.has(k) ? v : walk(v, path ? `${path}.${k}` : k),
            ]),
          );
        }
        return value;
      };
      return walk(report, "") as ReportOutput;
    },
  };
}

/** Save (replace) a run's translation into one language. */
export function saveTranslations(
  db: Db,
  runId: string,
  locale: ReportLanguage,
  texts: Record<string, string>,
) {
  db.insert(runTranslations)
    .values({ runId, locale, texts })
    .onConflictDoUpdate({
      target: [runTranslations.runId, runTranslations.locale],
      set: { texts, createdAt: new Date().toISOString() },
    })
    .run();
}
