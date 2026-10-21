import { eq } from "drizzle-orm";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { projects, proposals, settings, vendors } from "@/server/db/schema";
import { DEFAULT_WEIGHTS } from "@/lib/domain";
import { newId } from "@/lib/ids";

let db: Db;

beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});

afterEach(() => {
  db.$client.close();
});

describe("database", () => {
  it("creates the settings row with defaults", () => {
    const row = db.select().from(settings).where(eq(settings.id, 1)).get();
    expect(row).toMatchObject({
      appName: "Marsa",
      aiModel: "claude-opus-5-5",
      theme: "system",
      partialCredit: 0.5,
      concurrency: 3,
      onboarded: false,
      weights: DEFAULT_WEIGHTS,
    });
  });

  it("migrations are idempotent", () => {
    expect(() => migrateDb(db)).not.toThrow();
    expect(db.select().from(settings).all()).toHaveLength(1);
  });

  it("enforces one proposal per vendor per project and cascades deletes", () => {
    const projectId = newId("project");
    const vendorId = newId("vendor");
    db.insert(projects).values({ id: projectId, code: "PRJ-2026-001", name: "Test" }).run();
    db.insert(vendors).values({ id: vendorId, name: "Vendor A" }).run();
    db.insert(proposals)
      .values({ id: newId("proposal"), projectId, vendorId })
      .run();

    expect(() =>
      db
        .insert(proposals)
        .values({ id: newId("proposal"), projectId, vendorId })
        .run(),
    ).toThrow(/UNIQUE/);

    db.delete(projects).where(eq(projects.id, projectId)).run();
    expect(db.select().from(proposals).all()).toHaveLength(0);
  });
});
