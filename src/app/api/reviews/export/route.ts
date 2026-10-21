import { connection } from "next/server";
import { withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { exportReviews } from "@/server/runs/reviews";

/** Download every human review with its run metrics, for improving prompts, models and scoring. */
export const GET = withErrors(async () => {
  await connection();
  const body = JSON.stringify(
    { exportedAt: new Date().toISOString(), reviews: exportReviews(getDb()) },
    null,
    2,
  );
  return new Response(body, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="marsa-ai-reviews-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
});
