import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { ingestDocument } from "@/server/documents/ingest";
import {
  createRule,
  createRulesBulk,
  createStandard,
  deleteRule,
  deleteStandard,
  getStandard,
  listStandards,
  reorderRules,
  standardInputSchema,
  standardPatchSchema,
  updateRule,
  updateStandard,
} from "@/server/services/standards";
import { createLocalStorage, type LocalStorage } from "@/server/storage/local";

let db: Db;
let storage: LocalStorage;
let tmp: string;

beforeAll(() => {
  tmp = fs.mkdtempSync(path.join(os.tmpdir(), "marsa-std-"));
  storage = createLocalStorage(tmp);
});
afterAll(() => fs.rmSync(tmp, { recursive: true, force: true }));
beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});

const mk = (code = "CITS-2026") =>
  createStandard(
    db,
    standardInputSchema.parse({ code, title: "Customs IT Security", category: "IT & security" }),
  );

describe("standards service", () => {
  it("creates with uppercase code and lists with counts", () => {
    const s = createStandard(
      db,
      standardInputSchema.parse({
        code: "pese-03",
        title: "Safety",
        category: "Safety & environment",
      }),
    );
    expect(s.code).toBe("PESE-03");
    createRule(db, s.id, { text: "Rule A", priority: "mandatory" });
    createRule(db, s.id, { text: "Rule B", priority: "important" });
    expect(listStandards(db)[0]).toMatchObject({
      rulesCount: 2,
      mandatoryCount: 1,
      documentsCount: 0,
    });
  });

  it("rejects a duplicate standard code (SQLite UNIQUE → 409 via the API layer)", () => {
    mk();
    expect(() => mk()).toThrow(/UNIQUE/);
  });

  it("generates rule codes from the last rule's prefix, else the standard code", () => {
    const s = mk();
    expect(createRule(db, s.id, { text: "first", priority: "important" }).code).toBe("CITS-01");
    createRule(db, s.id, { code: "SEC-05", text: "explicit", priority: "important" });
    expect(createRule(db, s.id, { text: "next", priority: "important" }).code).toBe("SEC-06");
  });

  it("refuses duplicate rule codes (case-insensitive) with 409", () => {
    const s = mk();
    createRule(db, s.id, { code: "SEC-01", text: "a", priority: "important" });
    expect(() =>
      createRule(db, s.id, { code: "sec-01", text: "b", priority: "important" }),
    ).toThrow(/already exists/);
  });

  it("bulk-adds atomically and reports clashing codes", () => {
    const s = mk();
    createRule(db, s.id, { code: "SEC-01", text: "a", priority: "important" });
    expect(() =>
      createRulesBulk(db, s.id, [
        { code: "SEC-02", text: "b", priority: "mandatory" },
        { code: "SEC-01", text: "dup", priority: "mandatory" },
      ]),
    ).toThrow(/SEC-01/);
    expect(getStandard(db, s.id).rules).toHaveLength(1); // nothing partially inserted
    const rules = createRulesBulk(db, s.id, [
      { code: "SEC-02", text: "b", priority: "mandatory" },
      { code: null, text: "auto", priority: "desirable" },
    ]);
    expect(rules.map((r) => r.code)).toEqual(["SEC-01", "SEC-02", "SEC-03"]);
  });

  it("reorders and validates the full id list", () => {
    const s = mk();
    const a = createRule(db, s.id, { text: "a", priority: "important" });
    const b = createRule(db, s.id, { text: "b", priority: "important" });
    const c = createRule(db, s.id, { text: "c", priority: "important" });
    expect(reorderRules(db, s.id, [c.id, a.id, b.id]).map((r) => r.text)).toEqual(["c", "a", "b"]);
    expect(() => reorderRules(db, s.id, [a.id, b.id])).toThrow(/every rule/);
  });

  it("updates, deletes and restores a rule at its old position (undo)", () => {
    const s = mk();
    createRule(db, s.id, { text: "a", priority: "important" });
    const b = createRule(db, s.id, { text: "b", priority: "important" });
    createRule(db, s.id, { text: "c", priority: "important" });
    expect(updateRule(db, s.id, b.id, { priority: "mandatory", text: "B!" })).toMatchObject({
      priority: "mandatory",
      text: "B!",
    });
    const deleted = deleteRule(db, s.id, b.id);
    createRule(db, s.id, {
      code: deleted.code,
      text: deleted.text,
      priority: deleted.priority,
      sortOrder: deleted.sortOrder,
    });
    expect(getStandard(db, s.id).rules.map((r) => r.text)).toEqual(["a", "B!", "c"]);
  });

  it("deleting a standard cascades to rules, document rows and files", async () => {
    const s = mk();
    createRule(db, s.id, { text: "a", priority: "important" });
    const doc = await ingestDocument(db, storage, {
      owner: { kind: "standard", standardId: s.id },
      fileName: "std.txt",
      bytes: new TextEncoder().encode("standard text"),
      maxSizeMb: 50,
    });
    await deleteStandard(db, storage, s.id);
    expect(listStandards(db)).toEqual([]);
    expect(await storage.exists(doc.storagePath)).toBe(false);
    expect(() => getStandard(db, s.id)).toThrow(/not found/);
  });
});

describe("patch schemas (G-42: zod .partial() keeps defaults)", () => {
  it("a partial standard patch never fills in defaults", async () => {
    const { rulePatchSchema } = await import("@/server/services/standards");
    expect(standardPatchSchema.parse({ isActive: false })).toEqual({ isActive: false });
    expect(standardPatchSchema.parse({ description: "x" })).toEqual({ description: "x" });
    expect(rulePatchSchema.parse({ text: "Edited" })).toEqual({ text: "Edited" });
  });

  it("toggling a standard keeps its description", () => {
    const s = createStandard(
      db,
      standardInputSchema.parse({
        code: "CITS-2026",
        title: "Customs IT Security",
        category: "IT & security",
        description: "Applies to all IT systems.",
      }),
    );
    updateStandard(db, s.id, standardPatchSchema.parse({ isActive: false }));
    expect(getStandard(db, s.id)).toMatchObject({
      isActive: false,
      description: "Applies to all IT systems.",
    });
  });
});
