/**
 * The price comparison of a project (2026-10-25): the client's bill of quantities (an Excel RFP
 * document) and each bidder's priced copy (an Excel file of its bid), read and compared. A
 * project without an Excel bill of quantities has no price comparison (null). Parsed workbooks
 * are kept in memory by content hash. No `server-only`: tests use it with an in-memory DB.
 */
import { and, asc, eq, inArray } from "drizzle-orm";
import type { Db } from "../db/connect";
import { documents, projects, proposals, vendors } from "../db/schema";
import type { BoqComparisonDto } from "../../lib/api-types";
import type { LocalStorage } from "../storage/local";
import { alignItems, compareBoqs, type BoqBid } from "./compare";
import { parseBoq, type ParsedBoq } from "./parse";

type DocRow = typeof documents.$inferSelect;

const parsed = new Map<string, Promise<ParsedBoq | null>>();

function read(storage: LocalStorage, doc: DocRow): Promise<ParsedBoq | null> {
  let job = parsed.get(doc.sha256);
  if (!job) {
    job = storage
      .read(doc.storagePath)
      .then((bytes) => parseBoq(bytes))
      .catch(() => null);
    parsed.set(doc.sha256, job);
  }
  return job;
}

const isWorkbook = (d: DocRow) => d.ext.toLowerCase() === "xlsx";
const NAMED_BOQ = /كميات|boq|bill.?of.?quant|quantit/i;

/** The bidders of a project (or of one analysis) and their priced bills of quantities. */
export async function getBoqComparison(
  db: Db,
  storage: LocalStorage,
  projectId: string,
  proposalIds?: string[],
): Promise<BoqComparisonDto | null> {
  const project = db.select().from(projects).where(eq(projects.id, projectId)).get();
  if (!project) return null;

  // The client's bill of quantities: an Excel RFP document with lines to price and no prices.
  const rfp = db
    .select()
    .from(documents)
    .where(and(eq(documents.projectId, projectId), eq(documents.kind, "rfp")))
    .orderBy(asc(documents.createdAt))
    .all()
    .filter(isWorkbook);
  let client: { doc: DocRow; boq: ParsedBoq } | null = null;
  for (const doc of rfp.sort(
    (a, b) => +NAMED_BOQ.test(b.originalName) - +NAMED_BOQ.test(a.originalName),
  )) {
    const boq = await read(storage, doc);
    if (!boq) continue;
    const lines = boq.items.filter((i) => i.qty !== null || i.unit).length;
    if (!client || lines > client.boq.items.length) client = { doc, boq };
  }
  if (!client) return null;

  const ids =
    proposalIds ??
    db
      .select({ id: proposals.id })
      .from(proposals)
      .where(and(eq(proposals.projectId, projectId), eq(proposals.status, "submitted")))
      .orderBy(asc(proposals.submittedAt))
      .all()
      .map((p) => p.id);
  if (!ids.length) return null;
  const names = new Map(
    db
      .select({ id: proposals.id, name: vendors.name })
      .from(proposals)
      .innerJoin(vendors, eq(vendors.id, proposals.vendorId))
      .where(inArray(proposals.id, ids))
      .all()
      .map((r) => [r.id, r.name]),
  );
  const files = db
    .select()
    .from(documents)
    .where(inArray(documents.proposalId, ids))
    .orderBy(asc(documents.createdAt))
    .all()
    .filter(isWorkbook);

  const bids: BoqBid[] = [];
  for (const id of ids) {
    if (!names.has(id)) continue;
    // The bid's workbook that matches the most client lines (commercial envelope first).
    const own = files
      .filter((d) => d.proposalId === id)
      .sort((a, b) => +(b.kind === "commercial") - +(a.kind === "commercial"));
    let best: { doc: DocRow; boq: ParsedBoq; matched: number } | null = null;
    const seen = new Set<string>();
    for (const doc of own) {
      if (seen.has(doc.sha256)) continue;
      seen.add(doc.sha256);
      const boq = await read(storage, doc);
      if (!boq) continue;
      const matched = alignItems(client.boq.items, boq.items).match.size;
      if (!best || matched > best.matched) best = { doc, boq, matched };
    }
    bids.push({
      proposalId: id,
      vendor: names.get(id)!,
      document: best?.doc.originalName ?? null,
      boq: best && best.matched > 0 ? best.boq : null,
    });
  }
  if (!bids.some((b) => b.boq)) return null;

  return compareBoqs(client.boq, bids, {
    estimate: project.estimateAmount ?? null,
    clientDocument: client.doc.originalName,
  });
}
