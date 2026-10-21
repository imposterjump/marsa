/**
 * Loads what a run evaluates (RDD §7): the project's RFP documents and notes, the standards frozen
 * in the run config (rules + documents), and each proposal's documents. No `server-only` (G-08).
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { documents, projects, proposals, standardRules, standards, vendors } from "../db/schema";
import type { RunConfig } from "../../lib/domain";
import type { RunContext, SourceDoc } from "../ai/types";

type DocRow = typeof documents.$inferSelect;

const KIND_ORDER = { rfp: 0, standard: 0, commercial: 0, technical: 1 } as const;

function toSource(d: DocRow, title: string): SourceDoc {
  return {
    id: d.id,
    title,
    name: d.originalName,
    kind: d.kind,
    ext: d.ext,
    mimeType: d.mimeType,
    storagePath: d.storagePath,
    pageCount: d.pageCount,
    textContent: d.textContent,
    aiReadable: d.aiReadable,
    fileId: d.anthropicFileId,
  };
}

export function loadRunContext(db: Db, projectId: string, config: RunConfig): RunContext {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) throw new Error(`Project ${projectId} not found.`);

  const rfpDocs = db
    .select()
    .from(documents)
    .where(and(eq(documents.projectId, projectId), eq(documents.kind, "rfp")))
    .orderBy(asc(documents.originalName))
    .all()
    .map((d) => toSource(d, `RFP: ${d.originalName}`));

  const stdRows = config.standardIds.length
    ? db
        .select()
        .from(standards)
        .where(inArray(standards.id, config.standardIds))
        .orderBy(asc(standards.code))
        .all()
    : [];
  const ruleRows = stdRows.length
    ? db
        .select()
        .from(standardRules)
        .where(
          inArray(
            standardRules.standardId,
            stdRows.map((s) => s.id),
          ),
        )
        .orderBy(asc(standardRules.sortOrder), asc(standardRules.code))
        .all()
    : [];
  const stdDocs = stdRows.length
    ? db
        .select()
        .from(documents)
        .where(
          inArray(
            documents.standardId,
            stdRows.map((s) => s.id),
          ),
        )
        .orderBy(asc(documents.originalName))
        .all()
    : [];

  const props = config.proposalIds.length
    ? db
        .select({ id: proposals.id, submittedAt: proposals.submittedAt, name: vendors.name })
        .from(proposals)
        .innerJoin(vendors, eq(vendors.id, proposals.vendorId))
        .where(inArray(proposals.id, config.proposalIds))
        .all()
    : [];
  const order = new Map(config.proposalIds.map((id, i) => [id, i]));
  props.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  const propDocs = props.length
    ? db
        .select()
        .from(documents)
        .where(
          inArray(
            documents.proposalId,
            props.map((p) => p.id),
          ),
        )
        .all()
    : [];

  return {
    project: {
      code: project.code,
      name: project.name,
      description: project.description,
      notes: project.notes,
      category: project.category,
      deadline: project.deadline,
    },
    rfpDocs,
    standards: stdRows.map((s) => ({
      id: s.id,
      code: s.code,
      title: s.title,
      category: s.category,
      rules: ruleRows
        .filter((r) => r.standardId === s.id)
        .map((r) => ({ code: r.code, text: r.text, priority: r.priority })),
      docs: stdDocs
        .filter((d) => d.standardId === s.id)
        .map((d) => toSource(d, `Standard ${s.code}: ${d.originalName}`)),
    })),
    vendors: props.map((p) => ({
      proposalId: p.id,
      name: p.name,
      submittedAt: p.submittedAt,
      docs: propDocs
        .filter((d) => d.proposalId === p.id)
        .sort(
          (a, b) =>
            KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || a.originalName.localeCompare(b.originalName),
        )
        .map((d) => toSource(d, `${p.name} ${d.kind}: ${d.originalName}`)),
    })),
    reportLanguage: config.reportLanguage,
  };
}
