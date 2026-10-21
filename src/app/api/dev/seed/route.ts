import fs from "node:fs";
import path from "node:path";
import { connection } from "next/server";
import { count, eq } from "drizzle-orm";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { projects, proposals, standards, vendors } from "@/server/db/schema";
import { env } from "@/server/env";
import { loadSampleData, removeSampleData } from "@/server/seed";
import { getStorage } from "@/server/storage";

/** Settings → Demo tools: what sample data is loaded, and whether the sample files exist. */
export const GET = withErrors(async () => {
  await connection();
  const db = getDb();
  const n = (q: { n: number } | undefined) => q?.n ?? 0;
  return json({
    available: fs.existsSync(
      path.join(/*turbopackIgnore: true*/ env.seedDir, "seed", "manifest.json"),
    ),
    sampleProjects: n(
      db.select({ n: count() }).from(projects).where(eq(projects.isSample, true)).get(),
    ),
    sampleProposals: n(
      db.select({ n: count() }).from(proposals).where(eq(proposals.source, "seed")).get(),
    ),
    sampleStandards: n(
      db.select({ n: count() }).from(standards).where(eq(standards.isSample, true)).get(),
    ),
    sampleVendors: n(
      db.select({ n: count() }).from(vendors).where(eq(vendors.isSample, true)).get(),
    ),
  });
});

/** Load (or reload) the sample projects, standards, vendors and proposals. */
export const POST = withErrors(async () => {
  return json(await loadSampleData(getDb(), getStorage(), env.seedDir));
});

/** Remove sample data only; the user's own projects and standards are kept. */
export const DELETE = withErrors(async () => {
  return json(await removeSampleData(getDb(), getStorage()));
});
