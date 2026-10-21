/**
 * Standards library service (PRD FR-8, RDD §4). Takes `db` (and `storage` where files are
 * touched) so tests can inject in-memory instances. No `server-only` (HANDOFF G-08).
 */
import { and, asc, count, desc, eq, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { documents, standardRules, standards } from "../db/schema";
import type { LocalStorage } from "../storage/local";
import { ApiError, notFound } from "../api-errors";
import { PRIORITIES, STANDARD_CATEGORIES } from "../../lib/domain";
import { newId } from "../../lib/ids";
import { nextRuleCode, RULE_TEXT_MAX } from "../../lib/rules-parse";

const now = sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`;

// ─── Validation ──────────────────────────────────────────────────────────────
const code = z
  .string()
  .trim()
  .min(1, "Code is required.")
  .max(24, "Keep the code under 24 characters.")
  .regex(/^[A-Za-z][A-Za-z0-9._-]*$/, "Use letters, digits, - . _ and start with a letter.")
  .transform((v) => v.toUpperCase());

// Patch schemas are built from default-free fields: zod 4's .partial() still applies
// .default()s, which made a PATCH {isActive} wipe the description (HANDOFF G-42).
const standardFields = {
  code,
  title: z.string().trim().min(3, "Title must be at least 3 characters.").max(140),
  category: z.enum(STANDARD_CATEGORIES),
  description: z.string().trim().max(2000),
  isActive: z.boolean(),
};
export const standardInputSchema = z
  .object({
    ...standardFields,
    description: standardFields.description.default(""),
    isActive: standardFields.isActive.default(true),
  })
  .strict();
export const standardPatchSchema = z.object(standardFields).partial().strict();

const ruleFields = {
  code: code.optional().nullable(),
  text: z.string().trim().min(1, "Rule text is required.").max(RULE_TEXT_MAX),
  priority: z.enum(PRIORITIES),
};
export const ruleInputSchema = z
  .object({
    ...ruleFields,
    priority: ruleFields.priority.default("important"),
    /** Only used to restore a deleted rule at its old position (undo). */
    sortOrder: z.number().int().min(0).optional(),
  })
  .strict();
export const rulePatchSchema = z.object(ruleFields).partial().strict();
export const bulkRulesSchema = z
  .object({
    rules: z
      .array(ruleInputSchema.omit({ sortOrder: true }))
      .min(1)
      .max(200),
  })
  .strict();
export const reorderSchema = z.object({ ids: z.array(z.string()).min(1) }).strict();

export type StandardInput = z.infer<typeof standardInputSchema>;
export type RuleInput = z.infer<typeof ruleInputSchema>;

// ─── Reads ───────────────────────────────────────────────────────────────────
export function listStandards(db: Db) {
  const rows = db
    .select()
    .from(standards)
    .orderBy(desc(standards.isActive), asc(standards.code))
    .all();
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);
  const ruleStats = db
    .select({
      standardId: standardRules.standardId,
      total: count(),
      mandatory: sql<number>`sum(case when ${standardRules.priority} = 'mandatory' then 1 else 0 end)`,
    })
    .from(standardRules)
    .where(inArray(standardRules.standardId, ids))
    .groupBy(standardRules.standardId)
    .all();
  const docStats = db
    .select({ standardId: documents.standardId, total: count() })
    .from(documents)
    .where(inArray(documents.standardId, ids))
    .groupBy(documents.standardId)
    .all();
  const rs = new Map(ruleStats.map((r) => [r.standardId, r]));
  const ds = new Map(docStats.map((d) => [d.standardId, d.total]));
  return rows.map((r) => ({
    ...r,
    rulesCount: rs.get(r.id)?.total ?? 0,
    mandatoryCount: Number(rs.get(r.id)?.mandatory ?? 0),
    documentsCount: ds.get(r.id) ?? 0,
  }));
}

function requireStandard(db: Db, id: string) {
  const row = db.select().from(standards).where(eq(standards.id, id)).get();
  if (!row) throw notFound("Standard");
  return row;
}

export function listRules(db: Db, standardId: string) {
  return db
    .select()
    .from(standardRules)
    .where(eq(standardRules.standardId, standardId))
    .orderBy(asc(standardRules.sortOrder), asc(standardRules.createdAt))
    .all();
}

export function getStandard(db: Db, id: string) {
  const standard = requireStandard(db, id);
  const docs = db
    .select()
    .from(documents)
    .where(eq(documents.standardId, id))
    .orderBy(asc(documents.createdAt))
    .all();
  return { ...standard, rules: listRules(db, id), documents: docs };
}

// ─── Standards CRUD ──────────────────────────────────────────────────────────
export function createStandard(db: Db, input: StandardInput) {
  const id = newId("standard");
  db.insert(standards)
    .values({ id, ...input })
    .run();
  return requireStandard(db, id);
}

export function updateStandard(db: Db, id: string, patch: Partial<StandardInput>) {
  requireStandard(db, id);
  if (Object.keys(patch).length) {
    db.update(standards)
      .set({ ...patch, updatedAt: now })
      .where(eq(standards.id, id))
      .run();
  }
  return requireStandard(db, id);
}

export async function deleteStandard(db: Db, storage: LocalStorage, id: string) {
  requireStandard(db, id);
  const files = db
    .select({ path: documents.storagePath })
    .from(documents)
    .where(eq(documents.standardId, id))
    .all();
  db.delete(standards).where(eq(standards.id, id)).run(); // rules + documents rows cascade
  await Promise.all(files.map((f) => storage.delete(f.path).catch(() => {})));
}

const touch = (db: Db, standardId: string) =>
  db.update(standards).set({ updatedAt: now }).where(eq(standards.id, standardId)).run();

// ─── Rules ───────────────────────────────────────────────────────────────────
/** Code prefix for generated rule codes: the last rule's prefix, else the standard code's first part. */
function rulePrefix(standardCode: string, existing: string[]): string {
  const last = existing[existing.length - 1];
  const fromRule = last?.match(/^([A-Za-z]+)-\d+$/)?.[1];
  return fromRule ?? standardCode.split(/[-._]/)[0];
}

function assertCodeFree(db: Db, standardId: string, code: string, exceptRuleId?: string) {
  const clash = db
    .select({ id: standardRules.id })
    .from(standardRules)
    .where(
      and(
        eq(standardRules.standardId, standardId),
        sql`upper(${standardRules.code}) = ${code.toUpperCase()}`,
      ),
    )
    .get();
  if (clash && clash.id !== exceptRuleId) {
    throw new ApiError(
      409,
      "duplicate_code",
      `A rule with code ${code} already exists in this standard.`,
    );
  }
}

export function createRule(db: Db, standardId: string, input: RuleInput) {
  const standard = requireStandard(db, standardId);
  const existing = listRules(db, standardId);
  const ruleCode =
    input.code ??
    nextRuleCode(
      rulePrefix(
        standard.code,
        existing.map((r) => r.code),
      ),
      existing.map((r) => r.code),
    );
  assertCodeFree(db, standardId, ruleCode);
  const sortOrder =
    input.sortOrder ?? (existing.length ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 0);
  const id = newId("rule");
  db.insert(standardRules)
    .values({
      id,
      standardId,
      code: ruleCode,
      text: input.text,
      priority: input.priority,
      sortOrder,
    })
    .run();
  touch(db, standardId);
  return db.select().from(standardRules).where(eq(standardRules.id, id)).get()!;
}

/** Add many rules atomically. Fails (409, with the list) if any code already exists. */
export function createRulesBulk(db: Db, standardId: string, rules: Omit<RuleInput, "sortOrder">[]) {
  const standard = requireStandard(db, standardId);
  const existing = listRules(db, standardId);
  const taken = new Set(existing.map((r) => r.code.toUpperCase()));
  const clashes = rules
    .filter((r) => r.code && taken.has(r.code.toUpperCase()))
    .map((r) => r.code!);
  if (clashes.length) {
    throw new ApiError(
      409,
      "duplicate_code",
      `These codes already exist in this standard: ${clashes.join(", ")}.`,
      { codes: clashes },
    );
  }
  const codes = existing.map((r) => r.code);
  let sortOrder = existing.length ? Math.max(...existing.map((r) => r.sortOrder)) + 1 : 0;
  const values = rules.map((r) => {
    const c = r.code ?? nextRuleCode(rulePrefix(standard.code, codes), codes);
    codes.push(c);
    return {
      id: newId("rule"),
      standardId,
      code: c,
      text: r.text,
      priority: r.priority,
      sortOrder: sortOrder++,
    };
  });
  db.transaction((tx) => {
    for (const v of values) tx.insert(standardRules).values(v).run();
  });
  touch(db, standardId);
  return listRules(db, standardId);
}

export function updateRule(
  db: Db,
  standardId: string,
  ruleId: string,
  patch: z.infer<typeof rulePatchSchema>,
) {
  const rule = db
    .select()
    .from(standardRules)
    .where(and(eq(standardRules.id, ruleId), eq(standardRules.standardId, standardId)))
    .get();
  if (!rule) throw notFound("Rule");
  if (patch.code) assertCodeFree(db, standardId, patch.code, ruleId);
  const set = { ...patch, code: patch.code ?? undefined };
  if (Object.values(set).some((v) => v !== undefined)) {
    db.update(standardRules).set(set).where(eq(standardRules.id, ruleId)).run();
    touch(db, standardId);
  }
  return db.select().from(standardRules).where(eq(standardRules.id, ruleId)).get()!;
}

export function deleteRule(db: Db, standardId: string, ruleId: string) {
  const rule = db
    .select()
    .from(standardRules)
    .where(and(eq(standardRules.id, ruleId), eq(standardRules.standardId, standardId)))
    .get();
  if (!rule) throw notFound("Rule");
  db.delete(standardRules).where(eq(standardRules.id, ruleId)).run();
  touch(db, standardId);
  return rule; // returned so the client can offer "Undo"
}

export function reorderRules(db: Db, standardId: string, ids: string[]) {
  const current = listRules(db, standardId).map((r) => r.id);
  const same =
    current.length === ids.length &&
    new Set(ids).size === ids.length &&
    ids.every((id) => current.includes(id));
  if (!same)
    throw new ApiError(
      400,
      "invalid_order",
      "The order must list every rule of this standard exactly once.",
    );
  db.transaction((tx) => {
    ids.forEach((id, i) =>
      tx.update(standardRules).set({ sortOrder: i }).where(eq(standardRules.id, id)).run(),
    );
  });
  touch(db, standardId);
  return listRules(db, standardId);
}
