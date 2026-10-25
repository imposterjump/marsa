/**
 * Engine selection (RDD §7.8): `AI_MODE=mock` (default) → deterministic fixture engine at $0;
 * `AI_MODE=live` → Claude. The live engine uploads PDFs/images to the Files API once per document
 * (file id cached in `documents.anthropicFileId`) and builds each step's content blocks.
 */
import "server-only";
import { eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { documents } from "../db/schema";
import { env } from "../env";
import { sectionTemplateFor } from "../../lib/domain";
import { getStorage } from "../storage";
import type { LocalStorage } from "../storage/local";
import { AiError, callStructured, uploadFile } from "./client";
import { buildContent, nativeDocsFor } from "./content";
import { checkInParts } from "./parts";
import { createMockEngine, createPageLoader } from "./mock";
import { reportSystemPrompt, systemPrompt } from "./prompts";
import { translateTexts } from "./translate";
import {
  OUTPUT_FIELD,
  OUTPUT_SCHEMA,
  fromWire,
  normalizeAnalysis,
  normalizeChecklist,
  normalizeReport,
  normalizeRisks,
  requirementsFor,
  withStandardRules,
  type AnalysisOutput,
  type ChecklistOutput,
  type ReportOutput,
  type StepOutput,
  type RiskOutput,
} from "./schemas";
import type { AiEngine, AnalysisStepInput, SourceDoc, StepInput } from "./types";

/** Upload any native document of this step that has no Files API id yet (and remember it). */
export async function ensureUploaded(db: Db, storage: LocalStorage, docs: SourceDoc[]) {
  for (const doc of docs) {
    if (doc.fileId) continue;
    const bytes = await storage.read(doc.storagePath);
    doc.fileId = await uploadFile(doc.name, bytes, doc.mimeType);
    db.update(documents).set({ anthropicFileId: doc.fileId }).where(eq(documents.id, doc.id)).run();
  }
}

/** Forget cached ids (a file expired or was deleted on Anthropic's side); the next call re-uploads. */
export function forgetUploads(db: Db, docs: SourceDoc[]) {
  if (!docs.length) return;
  for (const d of docs) d.fileId = null;
  db.update(documents)
    .set({ anthropicFileId: null })
    .where(
      inArray(
        documents.id,
        docs.map((d) => d.id),
      ),
    )
    .run();
}

export function createLiveEngine(db: Db, storage: LocalStorage, model: string): AiEngine {
  return {
    mode: "live",
    async runStep(input, hooks) {
      const i = input as StepInput;
      if (i.phase === "translate") {
        // Text only, no documents; Haiku whatever the run's model (translate.ts).
        return (await translateTexts(i.texts, {
          source: i.source,
          target: i.target,
          signal: hooks.signal,
          onStarted: hooks.onStarted,
        })) as never;
      }
      await ensureUploaded(db, storage, nativeDocsFor(i));
      /** One request; its answer is the step's field of the shared output object. */
      const ask = async (input: AnalysisStepInput) => {
        const res = await callStructured({
          model,
          system:
            input.phase === "report"
              ? reportSystemPrompt(input.ctx.reportLanguage)
              : systemPrompt(input.ctx.reportLanguage),
          content: buildContent(input),
          // Shared output formats keep the cached prefix identical across phases (schemas.ts).
          schema: OUTPUT_SCHEMA[input.phase],
          signal: hooks.signal,
          onStarted: hooks.onStarted,
        });
        const field = OUTPUT_FIELD[input.phase];
        const answer = (res.data as Partial<StepOutput>)[field] ?? null;
        if (answer === null) {
          throw new AiError(
            "invalid_output",
            `The answer left the "${field}" field empty.`,
            undefined,
            res.usage,
          );
        }
        return { ...res, data: fromWire(field, answer) as unknown };
      };
      if (i.phase === "standards" || i.phase === "analyze") {
        // A long checklist is checked in parts, each answer well under the size limit (parts.ts).
        const scope = i.phase === "standards" ? "standards" : "rfp";
        const codes = requirementsFor(i.checklist, scope).map((r) => r.code);
        const res = await checkInParts(model, codes, async (part) => {
          const r = await ask({ ...i, part });
          return { ...r, data: r.data as AnalysisOutput };
        });
        return { ...res, data: normalizeAnalysis(res.data) } as never;
      }
      const res = await ask(i);
      let data = res.data;
      const template = sectionTemplateFor(i.ctx.project.category);
      if (i.phase === "checklist") {
        // The model lists the RFP requirements; every standard rule is added as its own one.
        data = withStandardRules(
          normalizeChecklist(data as ChecklistOutput, template),
          i.ctx.standards,
          template,
        );
      } else if (i.phase === "risk") {
        data = normalizeRisks(data as RiskOutput, template);
      } else if (i.phase === "report") {
        data = normalizeReport(data as ReportOutput, {
          recommended: i.recommended === i.vendor.name,
        });
      }
      return { ...res, data } as never;
    },
  };
}

/** The engine a run was started with (a mock run stays mock even if AI_MODE changes later). */
export function getEngine(db: Db, model: string, mode: "mock" | "live" = env.AI_MODE): AiEngine {
  const storage = getStorage();
  if (mode === "live") return createLiveEngine(db, storage, model);
  const ms = Number(process.env.MOCK_STEP_MS);
  return createMockEngine({
    loadPages: createPageLoader(storage),
    stepMs: Number.isFinite(ms) && ms >= 0 && process.env.MOCK_STEP_MS ? ms : undefined,
  });
}
