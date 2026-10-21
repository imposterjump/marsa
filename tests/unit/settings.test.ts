import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { migrateDb, openDb, type Db } from "@/server/db/connect";
import { getSettings, settingsPatchSchema, updateSettings } from "@/server/services/settings";

let db: Db;
beforeEach(() => {
  db = openDb(":memory:");
  migrateDb(db);
});
afterEach(() => db.$client.close());

describe("settings service", () => {
  it("returns defaults for a fresh workspace (not onboarded)", () => {
    const s = getSettings(db);
    expect(s.onboarded).toBe(false);
    expect(s.customerName).toBe("");
    expect(s.theme).toBe("system");
  });

  it("updates profile fields and bumps updatedAt", async () => {
    const before = getSettings(db).updatedAt;
    await new Promise((r) => setTimeout(r, 5));
    const after = updateSettings(db, {
      customerName: "Layla Mansour",
      organization: "NGPA",
      onboarded: true,
    });
    expect(after).toMatchObject({
      customerName: "Layla Mansour",
      organization: "NGPA",
      onboarded: true,
    });
    expect(after.updatedAt > before).toBe(true);
  });

  it("keeps Arabic names intact", () => {
    const s = updateSettings(db, { customerName: "ليلى منصور" });
    expect(s.customerName).toBe("ليلى منصور");
  });

  it("an empty patch is a no-op", () => {
    const s = getSettings(db);
    expect(updateSettings(db, {})).toEqual(s);
  });
});

describe("settings patch validation", () => {
  it("trims and accepts valid input", () => {
    expect(settingsPatchSchema.parse({ customerName: "  Layla  " })).toEqual({
      customerName: "Layla",
    });
  });

  const invalid: [unknown, string][] = [
    [{ customerName: "   " }, "blank name"],
    [{ customerName: "x".repeat(81) }, "name too long"],
    [{ organization: "x".repeat(121) }, "organization too long"],
    [{ theme: "sepia" }, "unknown theme"],
    [{ partialCredit: 1.5 }, "partial credit above 1"],
    [{ concurrency: 0 }, "concurrency below 1"],
    [{ weights: { mandatory: 3, important: 2 } }, "incomplete weights"],
    [{ appName: "Other" }, "read-only field"],
    [{ unknown: true }, "unknown key"],
  ];
  it.each(invalid)("rejects %j (%s)", (input) => {
    expect(settingsPatchSchema.safeParse(input).success).toBe(false);
  });
});
