import "server-only";
import { env } from "../env";
import { migrateDb, openDb, type Db } from "./connect";

// One connection per server process. Kept on globalThis so Next dev hot-reloads
// don't open a new SQLite handle on every edit.
const globalForDb = globalThis as typeof globalThis & { __marsaDb?: Db };

/**
 * Shared Drizzle client. Migrations run lazily on first use, so a fresh deployment
 * with an empty volume works without a separate migrate step.
 *
 * IMPORTANT: better-sqlite3 is synchronous. In request-time code (route handlers,
 * server components) call `await connection()` from "next/server" before querying,
 * otherwise Next 16 (cacheComponents) may prerender the result at build time.
 */
export function getDb(): Db {
  if (!globalForDb.__marsaDb) {
    const db = openDb(env.dbFile);
    migrateDb(db);
    globalForDb.__marsaDb = db;
  }
  return globalForDb.__marsaDb;
}

export * as schema from "./schema";
