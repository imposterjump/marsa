/**
 * The app's runner: one per server process, kept on globalThis so Next dev hot reloads don't
 * start a second engine (or lose track of live runs).
 */
import "server-only";
import { getDb } from "../db/client";
import { env, isApiKeyConfigured } from "../env";
import { forgetUploads, getEngine } from "../ai/engine";
import { createRunner, type Runner } from "./runner";

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
    });
  }
  return globalForRunner.__marsaRunner;
}
