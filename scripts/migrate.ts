import "./load-env";
import path from "node:path";
import { migrateDb, openDb } from "../src/server/db/connect";

const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || "./data");
const dbFile = path.join(dataDir, "app.db");

const db = openDb(dbFile);
migrateDb(db);
const tables = db.$client
  .prepare(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
  )
  .all() as { name: string }[];
db.$client.close();

console.log(`✔ Migrated ${dbFile}`);
console.log(`  ${tables.length} tables: ${tables.map((t) => t.name).join(", ")}`);
