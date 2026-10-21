/**
 * Low-level DB factory without `server-only`, so scripts (tsx) and tests (vitest) can use it.
 * App code should import `getDb()` from ./client instead.
 */
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle, type BetterSQLite3Database } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

export type Db = BetterSQLite3Database<typeof schema> & { $client: Database.Database };

export const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

/** Open (and create if needed) a SQLite database. Pass ":memory:" for tests. */
export function openDb(file: string): Db {
  if (file !== ":memory:")
    fs.mkdirSync(path.dirname(/*turbopackIgnore: true*/ file), { recursive: true });
  const sqlite = new Database(file);
  if (file !== ":memory:") sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");
  sqlite.pragma("synchronous = NORMAL");
  return drizzle(sqlite, { schema }) as Db;
}

/** Apply pending SQL migrations from /drizzle and make sure the settings row exists. */
export function migrateDb(db: Db, migrationsFolder: string = MIGRATIONS_DIR): void {
  migrate(db, { migrationsFolder });
  db.insert(schema.settings).values({ id: 1 }).onConflictDoNothing().run();
}
