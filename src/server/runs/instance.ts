/**
 * The app's runner: one per server process, kept on globalThis so Next dev hot reloads don't
 * start a second engine (or lose track of live runs).
 */
import "server-only";
import { backupDatabase } from "../db/backup";
import { getDb } from "../db/client";
import { env, isApiKeyConfigured } from "../env";
import { forgetUploads, getEngine } from "../ai/engine";
import { getBoqComparison } from "../boq/load";
import { getStorage } from "../storage";
import { saveRunQuality } from "./quality";
import { createRunner, type Runner } from "./runner";
import { getRun } from "./store";

const globalForRunner = globalThis as typeof globalThis & { __marsaRunner?: Runner };

export function getRunner(): Runner {
  if (!globalForRunner.__marsaRunner) {
    const db = getDb();
    globalForRunner.__marsaRunner = createRunner({
      db,
      engineFor: (run) => getEngine(db, run.model, run.config.mode ?? "mock"),
      forgetUploads: (docs) => forgetUploads(db, docs),
      mode: env.AI_MODE,
      apiKeyConfigured: isApiKeyConfigured(),
      // Building works: the price comparison of the run's bids (src/server/boq).
      pricesFor: (run) => getBoqComparison(db, getStorage(), run.projectId, run.config.proposalIds),
      // AI review: store the run's quality metrics as soon as it ends. Then a paid run (finished,
      // paused or stopped) is copied with the whole database (src/server/db/backup.ts).
      onFinished: async (runId) => {
        await saveRunQuality(db, getStorage(), runId).catch((err) =>
          console.error(`[runner] quality metrics for ${runId} failed:`, err),
        );
        if (getRun(db, runId).costUsd > 0) {
          await backupDatabase(db, env.dataDir, runId).catch((err) =>
            console.error(`[runner] backup after ${runId} failed:`, err),
          );
        }
      },
    });
  }
  return globalForRunner.__marsaRunner;
}
