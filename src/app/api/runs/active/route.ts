import { connection } from "next/server";
import { json, withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getActiveRuns } from "@/server/runs/read";
import { getRunner } from "@/server/runs/instance";

/** Runs in progress (global run pill). */
export const GET = withErrors(async () => {
  await connection();
  getRunner(); // first touch after a restart reconciles interrupted runs
  return json(getActiveRuns(getDb()));
});
