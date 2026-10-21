"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import type { HealthReport } from "./api/health/route";

// Temporary P0 widget: proves TanStack Query + Motion + shadcn Button + /api/health work together.
export function FoundationCheck() {
  const health = useQuery({
    queryKey: ["health"],
    queryFn: async (): Promise<HealthReport> => (await fetch("/api/health")).json(),
  });

  return (
    <div className="flex flex-col gap-4">
      <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
        <Button onClick={() => health.refetch()} disabled={health.isFetching}>
          {health.isFetching ? "Checking…" : "Run health check"}
        </Button>
      </motion.div>
      {health.data && (
        <ul className="text-sm text-muted-foreground" aria-live="polite">
          <li>Database: {health.data.checks.db.ok ? "ok" : "failed"}</li>
          <li>Storage: {health.data.checks.storage.ok ? "ok" : "failed"}</li>
          <li>
            AI: {health.data.ai.mode} mode · key{" "}
            {health.data.ai.apiKeyConfigured ? "configured" : "not configured"}
          </li>
        </ul>
      )}
    </div>
  );
}
