/**
 * Demo data snapshot (2026-10-25): the projects, standards, vendors, AI analyses and consultant
 * reports of a working app, kept in git so a fresh clone can show real results without paying
 * for runs.
 *   npm run demo:save            copy DATA_DIR (default ./data) into test-inputs/demo-data/
 *   npm run demo:load            copy test-inputs/demo-data/ into an empty DATA_DIR
 *   npm run demo:load -- --yes   replace a DATA_DIR that already has data (backed up first)
 *   demo:save refuses data with imported tenders (they may be real company files) unless
 *   `-- --include-imports` is given.
 * Stop the app before loading. The snapshot leaves out the owner's name and organisation (the
 * welcome dialog asks again) and the Files API ids cached for the owner's API key.
 */
import "./load-env";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";

const root = process.cwd();
const dataDir = path.resolve(root, process.env.DATA_DIR || "./data");
const snapDir = path.join(root, "test-inputs", "demo-data");

function copyDir(from: string, to: string, skip: (rel: string) => boolean = () => false) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    if (skip(entry.name)) continue;
    const a = path.join(from, entry.name);
    const b = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(a, b);
    else fs.copyFileSync(a, b);
  }
}

function count(file: string, table: string): number {
  const db = new Database(file, { readonly: true });
  try {
    return (db.prepare(`select count(*) as n from ${table}`).get() as { n: number }).n;
  } catch {
    return 0;
  } finally {
    db.close();
  }
}

async function save() {
  const src = path.join(dataDir, "app.db");
  if (!fs.existsSync(src)) throw new Error(`No database at ${src}.`);
  // Imported tenders can be real company files (bank guarantees, licences): never into git by
  // accident (2026-10-25).
  const imported = (() => {
    const db = new Database(src, { readonly: true });
    try {
      return (
        db.prepare("select count(*) as n from proposals where source = 'import'").get() as {
          n: number;
        }
      ).n;
    } catch {
      return 0;
    } finally {
      db.close();
    }
  })();
  if (imported && !process.argv.includes("--include-imports")) {
    throw new Error(
      `The data holds ${imported} imported bids (Projects → Import tender), which may be real company files. Delete those projects first, or run: npm run demo:save -- --include-imports (only for fictional tenders).`,
    );
  }
  fs.rmSync(snapDir, { recursive: true, force: true });
  fs.mkdirSync(snapDir, { recursive: true });
  const dest = path.join(snapDir, "app.db");
  // A consistent copy even while the app runs (the WAL is folded in).
  const live = new Database(src, { readonly: true });
  await live.backup(dest);
  live.close();
  const db = new Database(dest);
  db.prepare(
    "update settings set customer_name = '', organization = '', onboarded = 0, sidebar_collapsed = 0",
  ).run();
  db.prepare("update documents set anthropic_file_id = null").run();
  db.pragma("journal_mode = DELETE");
  db.exec("VACUUM");
  db.close();
  copyDir(path.join(dataDir, "uploads"), path.join(snapDir, "uploads"), (n) => n === "_health");
  console.log(
    `✔ Saved the demo data: ${count(dest, "projects")} projects, ${count(dest, "standards")} standards, ` +
      `${count(dest, "vendors")} vendors, ${count(dest, "analysis_runs")} analyses → ${path.relative(root, snapDir)}`,
  );
}

function load() {
  const src = path.join(snapDir, "app.db");
  if (!fs.existsSync(src)) throw new Error(`No demo data at ${path.relative(root, snapDir)}.`);
  const target = path.join(dataDir, "app.db");
  if (fs.existsSync(target) && count(target, "projects") > 0) {
    if (!process.argv.includes("--yes")) {
      throw new Error(
        `${path.relative(root, dataDir)} already has projects. Stop the app, then run: npm run demo:load -- --yes (your data is backed up first).`,
      );
    }
    const backup = path.join(
      dataDir,
      "backups",
      `before-demo-${new Date().toISOString().replace(/[:.]/g, "-")}`,
    );
    fs.mkdirSync(backup, { recursive: true });
    for (const f of ["app.db", "app.db-wal", "app.db-shm"]) {
      if (fs.existsSync(path.join(dataDir, f)))
        fs.copyFileSync(path.join(dataDir, f), path.join(backup, f));
    }
    if (fs.existsSync(path.join(dataDir, "uploads")))
      copyDir(path.join(dataDir, "uploads"), path.join(backup, "uploads"));
    console.log(`  backed up the old data to ${path.relative(root, backup)}`);
  }
  fs.mkdirSync(dataDir, { recursive: true });
  for (const f of ["app.db-wal", "app.db-shm"]) fs.rmSync(path.join(dataDir, f), { force: true });
  fs.copyFileSync(src, target);
  fs.rmSync(path.join(dataDir, "uploads"), { recursive: true, force: true });
  copyDir(path.join(snapDir, "uploads"), path.join(dataDir, "uploads"));
  console.log(
    `✔ Loaded the demo data: ${count(target, "projects")} projects, ${count(target, "analysis_runs")} analyses. Start the app: npm run dev`,
  );
}

async function main() {
  const mode = process.argv[2];
  if (mode === "save") return save();
  if (mode === "load") return load();
  throw new Error("Use: save | load");
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
