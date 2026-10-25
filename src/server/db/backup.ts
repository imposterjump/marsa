/**
 * Automatic database copies (2026-10-26, user: "make sure that the ai analysis is saved after the
 * run"). After a paid analysis ends, the whole database (projects, results, reports, both
 * languages) is copied to `<DATA_DIR>/backups/auto/`, the newest 10 kept. The documents stay in
 * `<DATA_DIR>/uploads` (never changed). Restore: stop the app, copy a file back as `app.db`.
 * No `server-only`: tests call it with a temp folder.
 */
import fs from "node:fs";
import path from "node:path";
import type { Db } from "./connect";

export const AUTO_BACKUPS_KEPT = 10;

const stamp = (d: Date) => d.toISOString().slice(0, 19).replace(/[-:]/g, "").replace("T", "-");

/** Copies the live database (SQLite online backup, safe while the app runs). Returns the file. */
export async function backupDatabase(db: Db, dataDir: string, label: string): Promise<string> {
  const dir = path.join(/*turbopackIgnore: true*/ dataDir, "backups", "auto");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(
    /*turbopackIgnore: true*/ dir,
    `${stamp(new Date())}-${label.replace(/[^\w-]/g, "_")}.db`,
  );
  await db.$client.backup(file);
  const old = fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".db"))
    .sort()
    .slice(0, -AUTO_BACKUPS_KEPT);
  for (const f of old) fs.rmSync(path.join(/*turbopackIgnore: true*/ dir, f), { force: true });
  return file;
}
