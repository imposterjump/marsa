import { sql } from "drizzle-orm";
import { connection } from "next/server";
import { getDb } from "@/server/db/client";
import { env, isApiKeyConfigured } from "@/server/env";
import { getStorage } from "@/server/storage";

interface Check {
  ok: boolean;
  ms: number;
  error?: string;
}

export interface HealthReport {
  status: "ok" | "degraded";
  checks: { db: Check; storage: Check };
  ai: { mode: "mock" | "live"; apiKeyConfigured: boolean; ready: boolean };
  time: string;
}

async function timed(fn: () => unknown): Promise<Check> {
  const start = performance.now();
  try {
    await fn();
    return { ok: true, ms: Math.round(performance.now() - start) };
  } catch (err) {
    return {
      ok: false,
      ms: Math.round(performance.now() - start),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function GET() {
  await connection(); // request-time only — never prerender health

  const db = await timed(() => getDb().get(sql`select 1 as ok`));
  const storage = await timed(async () => {
    const s = getStorage();
    const probe = s.buildPath(["_health"], `probe-${process.pid}-${Date.now()}`, "txt");
    await s.save(probe, Buffer.from("ok"));
    await s.delete(probe);
  });

  const apiKeyConfigured = isApiKeyConfigured();
  const report: HealthReport = {
    status: db.ok && storage.ok ? "ok" : "degraded",
    checks: { db, storage },
    ai: {
      mode: env.AI_MODE,
      apiKeyConfigured,
      ready: env.AI_MODE === "mock" || apiKeyConfigured,
    },
    time: new Date().toISOString(),
  };

  return Response.json(report, {
    status: report.status === "ok" ? 200 : 503,
    headers: { "Cache-Control": "no-store" },
  });
}
