import { connection } from "next/server";
import { withErrors } from "@/server/api";
import { getDb } from "@/server/db/client";
import { getReportPdf } from "@/server/reports/pdf";
import { getStorage } from "@/server/storage";

type Ctx = RouteContext<"/api/runs/[runId]/reports/[proposalId]">;

/** A vendor's consultant report as PDF. Inline by default (reader, new tab); `?download=1` saves. */
export const GET = withErrors(async (req: Request, ctx: Ctx) => {
  await connection();
  const { runId, proposalId } = await ctx.params;
  const { bytes, filename } = await getReportPdf(getDb(), getStorage(), runId, proposalId);
  const download = new URL(req.url).searchParams.get("download") === "1";
  const ascii = filename.replace(/[^\x20-\x7e]/g, "_").replace(/"/g, "'");
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${download ? "attachment" : "inline"}; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
      "Content-Length": String(bytes.byteLength),
      "Cache-Control": "private, no-cache",
      "X-Content-Type-Options": "nosniff",
    },
  });
});
