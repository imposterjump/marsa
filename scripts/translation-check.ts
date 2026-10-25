/**
 * Checks a run's Arabic translation (2026-10-25): how many AI texts it covers, which are missing,
 * and a sample of each kind side by side. Read-only.
 *   npx tsx scripts/translation-check.ts <runId>
 */
import "./load-env";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { openDb } from "../src/server/db/connect";
import { runTranslations } from "../src/server/db/schema";
import { collectRunTexts } from "../src/server/runs/texts";

const runId = process.argv[2];
if (!runId) throw new Error("Use: npx tsx scripts/translation-check.ts <runId>");
const db = openDb(path.resolve(process.env.DATA_DIR || "./data", "app.db"));
const texts = collectRunTexts(db, runId);
const row = db
  .select()
  .from(runTranslations)
  .where(and(eq(runTranslations.runId, runId), eq(runTranslations.locale, "ar")))
  .get();
const map = row?.texts ?? {};
const missing = texts.filter((t) => !map[t.key]);
const english = texts.filter((t) => map[t.key] && !/[؀-ۿ]/.test(map[t.key]));
console.log(
  `${texts.length} texts · ${Object.keys(map).length} translated · ${missing.length} missing`,
);
console.log(`translations without Arabic letters (codes, names): ${english.length}`);
for (const t of english.slice(0, 8)) console.log(`  = ${t.key}: ${map[t.key].slice(0, 80)}`);
for (const t of missing.slice(0, 8)) console.log(`  ! ${t.key}: ${t.text.slice(0, 80)}`);
const seen = new Set<string>();
for (const t of texts) {
  const kind = t.key.split(":")[0] + ":" + t.key.split(":").slice(2).join(":").replace(/\d+/g, "#");
  if (seen.has(kind) || !map[t.key]) continue;
  seen.add(kind);
  console.log(`\n[${kind}]\n  EN ${t.text.slice(0, 220)}\n  AR ${map[t.key].slice(0, 220)}`);
}
