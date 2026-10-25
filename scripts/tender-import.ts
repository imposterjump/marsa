/**
 * Import a tender exported by the e-procurement portal (2026-10-25), from a folder or a zip on
 * this machine, the same way as Projects → Import tender. The files are only read.
 *   npx tsx scripts/tender-import.ts "<tender folder>"                 show what would be imported
 *   npx tsx scripts/tender-import.ts "<tender folder>" --commit [--round=opening|negotiation]
 *     [--name="…"] [--estimate=1250000]                              create the project in DATA_DIR
 * Stop the app first or not: SQLite allows both (WAL); refresh the page afterwards.
 */
import "./load-env";
import fs from "node:fs";
import path from "node:path";
import { migrateDb, openDb } from "../src/server/db/connect";
import { getBoqComparison } from "../src/server/boq/load";
import { commitTender } from "../src/server/imports/commit";
import { scanTender, type ImportEntry, type RoundKey } from "../src/server/imports/tender";
import { createLocalStorage } from "../src/server/storage/local";
import { WORKS_CATEGORY } from "../src/lib/domain";

const target = process.argv[2];
const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
if (!target || !fs.existsSync(target)) {
  console.error('Use: npx tsx scripts/tender-import.ts "<tender folder or zip>" [--commit]');
  process.exit(1);
}

function entries(root: string): ImportEntry[] {
  const base = path.dirname(path.resolve(root));
  const out: ImportEntry[] = [];
  const walk = (p: string) => {
    if (fs.statSync(p).isDirectory()) for (const e of fs.readdirSync(p)) walk(path.join(p, e));
    else
      out.push({
        path: path.relative(base, p).split(path.sep).join("/"),
        size: fs.statSync(p).size,
        read: async () => fs.readFileSync(p),
      });
  };
  walk(path.resolve(root));
  return out;
}

const mb = (n: number) => `${(n / 1024 / 1024).toFixed(1)} MB`;

(async () => {
  const scan = await scanTender(entries(target));
  console.log(`Tender: ${scan.name}${scan.reference ? ` (${scan.reference})` : ""}`);
  console.log(`Tender documents: ${scan.tenderDocs.length}`);
  for (const d of scan.tenderDocs)
    console.log(
      `  ${d.leftOut ? `✗ left out (${d.leftOut})` : "·"} ${d.name} (${mb(d.entry.size)})`,
    );
  console.log(`Internal papers (not imported): ${scan.internalDocs.length}`);
  console.log(
    `Estimate: ${scan.estimate ? `${scan.estimate.amount.toLocaleString("en")} ${scan.estimate.currency} (from ${scan.estimate.source})` : "not found"}`,
  );
  for (const r of scan.rounds) {
    console.log(`Round "${r.key}": ${r.vendors.length} companies`);
    for (const v of r.vendors) {
      const out = v.files.filter((f) => f.leftOut);
      const c = v.files.filter((f) => f.kind === "commercial" && !f.leftOut).length;
      console.log(
        `  · ${v.name}: ${v.files.length - out.length} files (${c} commercial, ${v.files.length - out.length - c} technical)${v.duplicates ? `, ${v.duplicates} duplicate(s) left out` : ""}${out.length ? `, left out: ${out.map((f) => `${f.name} (${f.leftOut})`).join(", ")}` : ""}`,
      );
    }
  }
  const sizes = (keep: boolean) =>
    [...scan.tenderDocs, ...scan.rounds.flatMap((r) => r.vendors.flatMap((v) => v.files))]
      .filter((f) => !f.leftOut === keep)
      .reduce((n, f) => n + f.entry.size, 0);
  console.log(`To import: ${mb(sizes(true))} · left out: ${mb(sizes(false))}`);
  if (scan.ignored.length) console.log(`Left out (no part of the tender): ${scan.ignored.length}`);
  if (!process.argv.includes("--commit")) return;

  const dataDir = path.resolve(process.env.DATA_DIR || "./data");
  const db = openDb(path.join(dataDir, "app.db"));
  migrateDb(db);
  const storage = createLocalStorage(path.join(dataDir, "uploads"));
  const round = (arg("round") as RoundKey | undefined) ?? scan.rounds[0]?.key;
  const res = await commitTender(db, storage, scan, {
    name: arg("name") ?? scan.name,
    category: WORKS_CATEGORY,
    round,
    estimateAmount: Number(arg("estimate")) || scan.estimate?.amount || null,
    estimateCurrency: "AED",
  });
  console.log(
    `\n✔ Imported as project ${res.projectId}: ${res.vendors} vendors, ${res.documents} documents.`,
  );
  for (const s of res.skipped) console.log(`  skipped ${s.name}: ${s.reason}`);
  const boq = await getBoqComparison(db, storage, res.projectId);
  if (boq) {
    console.log(`
Prices (${boq.items} lines, ${boq.currency}):`);
    for (const v of [...boq.vendors].sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)))
      console.log(
        `  #${v.rank ?? "-"} ${v.vendor}: ${v.statedTotal?.toLocaleString("en") ?? "no Excel bill of quantities"}${v.vsEstimatePct != null ? ` (${v.vsEstimatePct > 0 ? "+" : ""}${v.vsEstimatePct}% vs estimate)` : ""}`,
      );
  }
})().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
