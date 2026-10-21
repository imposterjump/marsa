/**
 * Inputs for the run cost estimate (src/lib/plan.ts estimateRun): real document sizes of what a
 * run would send (the same RFP, standards and proposals createRun picks) and the requirement
 * count of the latest finished run. No `server-only` (G-08).
 */
import { and, desc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import {
  analysisRuns,
  documents,
  projectStandards,
  requirements,
  standardRules,
} from "../db/schema";
import { requireProject } from "../services/projects";
import type { DocSizes, RunEstimateInput } from "../../lib/plan";
import { evaluableProposals } from "./store";

type DocRow = Pick<
  typeof documents.$inferSelect,
  "ext" | "pageCount" | "textContent" | "aiReadable"
>;

const IMAGE = new Set(["png", "jpg", "jpeg", "gif", "webp"]);

function sizes(docs: DocRow[]): DocSizes {
  const out: DocSizes = { pdfPages: 0, images: 0, textChars: 0 };
  for (const d of docs) {
    if (!d.aiReadable) continue;
    if (d.ext === "pdf") out.pdfPages += d.pageCount ?? 4;
    else if (IMAGE.has(d.ext)) out.images += 1;
    else out.textChars += d.textContent?.length ?? 0;
  }
  return out;
}

const COLS = {
  ext: documents.ext,
  pageCount: documents.pageCount,
  textContent: documents.textContent,
  aiReadable: documents.aiReadable,
  proposalId: documents.proposalId,
};

export function runEstimateInput(db: Db, projectId: string): RunEstimateInput {
  requireProject(db, projectId);
  const rfp = db
    .select(COLS)
    .from(documents)
    .where(and(eq(documents.projectId, projectId), eq(documents.kind, "rfp")))
    .all();
  const standardIds = db
    .select({ id: projectStandards.standardId })
    .from(projectStandards)
    .where(eq(projectStandards.projectId, projectId))
    .all()
    .map((r) => r.id);
  const stdDocs = standardIds.length
    ? db.select(COLS).from(documents).where(inArray(documents.standardId, standardIds)).all()
    : [];
  const rules = standardIds.length
    ? db
        .select({ text: standardRules.text })
        .from(standardRules)
        .where(inArray(standardRules.standardId, standardIds))
        .all()
    : [];
  const rfpSizes = sizes(rfp);
  const all = sizes([...rfp, ...stdDocs]);

  const props = evaluableProposals(db, projectId);
  const propDocs = props.length
    ? db
        .select(COLS)
        .from(documents)
        .where(
          inArray(
            documents.proposalId,
            props.map((p) => p.id),
          ),
        )
        .all()
    : [];

  const last = db
    .select({ id: analysisRuns.id })
    .from(analysisRuns)
    .where(
      and(
        eq(analysisRuns.projectId, projectId),
        inArray(analysisRuns.status, ["completed", "completed_with_errors"]),
      ),
    )
    .orderBy(desc(analysisRuns.createdAt))
    .get();
  const previous = last
    ? db
        .select({ id: requirements.id })
        .from(requirements)
        .where(eq(requirements.runId, last.id))
        .all().length
    : 0;

  return {
    shared: {
      ...all,
      rulesCount: rules.length,
      rulesChars: rules.reduce((s, r) => s + r.text.length, 0),
      rfpPageEquivalents: rfpSizes.pdfPages + rfpSizes.textChars / 3_000 + rfpSizes.images * 0.5,
    },
    vendors: props.map((p) => sizes(propDocs.filter((d) => d.proposalId === p.id))),
    previousRequirements: previous || null,
  };
}
