/**
 * Settings service (single row, id = 1). Takes a `db` so tests can pass an in-memory DB.
 * No `server-only` / `connection()` here — see HANDOFF G-03 / G-08.
 */
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db/connect";
import { settings } from "../db/schema";
import { AI_MODELS, REPORT_LANGUAGES, THEMES } from "../../lib/domain";

const weight = z.number().min(0).max(10);

export const settingsPatchSchema = z
  .object({
    customerName: z.string().trim().min(1, "Please enter your name.").max(80),
    organization: z.string().trim().max(120),
    theme: z.enum(THEMES),
    sidebarCollapsed: z.boolean(),
    aiModel: z.enum(AI_MODELS),
    reportLanguage: z.enum(REPORT_LANGUAGES),
    weights: z.object({ mandatory: weight, important: weight, desirable: weight }).strict(),
    partialCredit: z.number().min(0).max(1),
    concurrency: z.number().int().min(1).max(6),
    onboarded: z.boolean(),
  })
  .partial()
  .strict();

export type SettingsPatch = z.infer<typeof settingsPatchSchema>;
export type SettingsRow = typeof settings.$inferSelect;

export function getSettings(db: Db): SettingsRow {
  const row = db.select().from(settings).where(eq(settings.id, 1)).get();
  if (row) return row;
  db.insert(settings).values({ id: 1 }).onConflictDoNothing().run();
  return db.select().from(settings).where(eq(settings.id, 1)).get()!;
}

export function updateSettings(db: Db, patch: SettingsPatch): SettingsRow {
  getSettings(db); // ensure the row exists
  if (Object.keys(patch).length > 0) {
    db.update(settings)
      .set({ ...patch, updatedAt: sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))` })
      .where(eq(settings.id, 1))
      .run();
  }
  return getSettings(db);
}
