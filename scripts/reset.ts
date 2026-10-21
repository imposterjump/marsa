/**
 * Delete ALL projects, standards, vendors and stored files (settings are kept).
 *   npm run reset -- --yes
 */
import "./load-env";
import path from "node:path";
import { migrateDb, openDb } from "../src/server/db/connect";
import { resetAllData } from "../src/server/seed";
import { createLocalStorage } from "../src/server/storage/local";

async function main() {
  if (!process.argv.includes("--yes")) {
    console.error(
      "This deletes every project, standard, vendor and file in DATA_DIR. Re-run with: npm run reset -- --yes",
    );
    process.exit(1);
  }
  const dataDir = path.resolve(process.cwd(), process.env.DATA_DIR || "./data");
  const db = openDb(path.join(dataDir, "app.db"));
  migrateDb(db);
  console.log("✔ Reset", await resetAllData(db, createLocalStorage(path.join(dataDir, "uploads"))));
  db.$client.close();
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
