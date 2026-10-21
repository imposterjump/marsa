/**
 * Server start (src/instrumentation.ts): runs a previous process left running are marked
 * `interrupted` so the UI offers Resume (RDD §7.2). Uses its own short-lived connection and no
 * `server-only` import, because instrumentation loads outside the React server graph.
 */
import path from "node:path";
import { migrateDb, openDb } from "../db/connect";
import { reconcileInterruptedRuns } from "./store";

export function markInterruptedRuns(): string[] {
  // turbopackIgnore: runtime-only paths (same as env.ts); otherwise tracing copies the whole repo.
  const dataDir = path.resolve(
    /*turbopackIgnore: true*/ process.cwd(),
    process.env.DATA_DIR?.trim() || "./data",
  );
  const db = openDb(path.join(/*turbopackIgnore: true*/ dataDir, "app.db"));
  try {
    migrateDb(db);
    return reconcileInterruptedRuns(db);
  } finally {
    db.$client.close();
  }
}
