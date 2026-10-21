/**
 * Sample data from the command line (same code as Settings → Demo tools).
 *   npm run seed            load or reload the sample projects, standards, vendors, proposals
 *   npm run seed -- --remove   remove sample data only
 * Uses DATA_DIR (default ./data) and SEED_DIR (default ./test-inputs).
 */
import "./load-env";
import path from "node:path";
import { migrateDb, openDb } from "../src/server/db/connect";
import { loadSampleData, removeSampleData } from "../src/server/seed";
import { createLocalStorage } from "../src/server/storage/local";

async function main() {
  const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || "./data");
  const seedDir = path.resolve(process.cwd(), process.env.SEED_DIR || "./test-inputs");
  const db = openDb(path.join(dataDir, "app.db"));
  migrateDb(db);
  const storage = createLocalStorage(path.join(dataDir, "uploads"));
  if (process.argv.includes("--remove")) {
    console.log("✔ Removed sample data", await removeSampleData(db, storage));
  } else {
    console.log("✔ Loaded sample data", await loadSampleData(db, storage, seedDir));
  }
  db.$client.close();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
