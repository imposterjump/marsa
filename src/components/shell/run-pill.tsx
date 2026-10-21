"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useHydrationSafe } from "@/hooks/hydration-safe";
import { projectKey, projectsKey } from "@/hooks/use-projects";
import { activeRunsKey } from "@/hooks/use-runs";
import { api } from "@/lib/api-client";
import type { ActiveRunDto, RunStatusDto } from "@/lib/api-types";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";

/**
 * FR-11.5 / P7.3: "Analysing · 5/11" in the top bar on every page while a run is active, and the
 * completion toast with "View results" (wherever the user is when the run ends).
 */
export function RunPill() {
  const router = useRouter();
  const qc = useQueryClient();
  const reduce = useReducedMotion();
  const { data } = useHydrationSafe(
    useQuery({
      queryKey: activeRunsKey,
      queryFn: () => api<ActiveRunDto[]>("/api/runs/active"),
      refetchInterval: (q) => (q.state.data?.length ? 2000 : 15_000),
      refetchIntervalInBackground: true,
    }),
  );

  // A run that disappears from the active list has ended: announce it and refresh its project.
  const seen = useRef<Map<string, ActiveRunDto>>(new Map());
  useEffect(() => {
    if (!data) return;
    const now = new Map(data.map((r) => [r.runId, r]));
    for (const [id, r] of seen.current) {
      if (now.has(id)) continue;
      void (async () => {
        await Promise.all([
          qc.invalidateQueries({ queryKey: projectKey(r.projectId) }),
          qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
          qc.invalidateQueries({ queryKey: ["runs", id] }),
        ]);
        const s = await api<RunStatusDto>(`/api/runs/${id}`).catch(() => null);
        const status = s?.run.status;
        const view = {
          label: "View results",
          onClick: () => router.push(`/projects/${r.projectId}/evaluation`),
        };
        if (status === "completed") {
          toast.success(`Analysis complete · ${r.projectCode}`, { action: view, duration: 10_000 });
        } else if (status === "completed_with_errors") {
          toast.warning(`Analysis finished with errors · ${r.projectCode}`, {
            action: view,
            duration: 10_000,
          });
        } else if (status === "failed") {
          toast.error(`Analysis failed · ${r.projectCode}`, { action: view, duration: 10_000 });
        } else if (status === "cancelled") {
          toast(`Analysis cancelled · ${r.projectCode}`);
        }
      })();
    }
    seen.current = now;
  }, [data, qc, router]);

  const run = data?.[0];
  const pct = run && run.totalSteps ? run.doneSteps / run.totalSteps : 0;
  const R = 7;
  const C = 2 * Math.PI * R;

  return (
    <AnimatePresence initial={false}>
      {run && (
        <motion.div
          key="pill"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: -6, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.96 }}
          transition={{ duration: 0.25, ease: EASE_OUT_QUINT }}
        >
          <Link
            href={`/projects/${run.projectId}/evaluation`}
            className="flex h-9 items-center gap-2 rounded-full border border-brand/30 bg-brand-soft ps-2 pe-3 text-[13px] font-medium text-brand-ink transition-colors hover:border-brand/50 focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
            title={run.currentLabel ?? undefined}
          >
            <svg viewBox="0 0 18 18" className="size-[18px] -rotate-90" aria-hidden>
              <circle
                cx="9"
                cy="9"
                r={R}
                fill="none"
                strokeWidth="2.5"
                className="stroke-brand/20"
              />
              <circle
                cx="9"
                cy="9"
                r={R}
                fill="none"
                strokeWidth="2.5"
                strokeLinecap="round"
                className="stroke-brand transition-[stroke-dashoffset] duration-500 motion-reduce:transition-none"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - pct)}
              />
            </svg>
            <span aria-live="polite" className="whitespace-nowrap tabular-nums">
              <span className="hidden sm:inline">Analysing · </span>
              {run.doneSteps}/{run.totalSteps}
              <span className="sr-only"> steps finished for {run.projectCode}</span>
            </span>
            {data.length > 1 && (
              <span className="rounded-full bg-brand/15 px-1.5 text-2xs tabular-nums">
                +{data.length - 1}
              </span>
            )}
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
