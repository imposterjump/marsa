"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocale } from "@/components/i18n-provider";
import { api } from "@/lib/api-client";
import type {
  AnalysisResultsDto,
  ProposalResultDto,
  RunDto,
  RunResultsDto,
  RunStatusDto,
} from "@/lib/api-types";
import type { RunStatus } from "@/lib/domain";
import { useHydrationSafe } from "./hydration-safe";
import { projectKey, projectsKey } from "./use-projects";

export const runsKey = (projectId: string) => ["projects", projectId, "runs"] as const;
export const runKey = (runId: string) => ["runs", runId] as const;
export const runResultsKey = (runId: string) => ["runs", runId, "results"] as const;
export const activeRunsKey = ["runs", "active"] as const;

export const isRunActive = (s: RunStatus | undefined) => s === "queued" || s === "running";

export function useProjectRuns(projectId: string) {
  return useHydrationSafe(
    useQuery({
      queryKey: runsKey(projectId),
      queryFn: () => api<RunDto[]>(`/api/projects/${projectId}/runs`),
    }),
  );
}

/** Polls every second while the run is active (RDD §6 polling endpoint). */
export function useRunStatus(runId: string | null) {
  return useHydrationSafe(
    useQuery({
      queryKey: runKey(runId ?? "none"),
      queryFn: () => api<RunStatusDto>(`/api/runs/${runId}`),
      enabled: !!runId,
      // RDD §10: every second while active, every 2 s while the tab is hidden.
      refetchInterval: (q) =>
        isRunActive(q.state.data?.run.status)
          ? typeof document !== "undefined" && document.hidden
            ? 2000
            : 1000
          : false,
      refetchIntervalInBackground: true,
    }),
  );
}

export function useRunResults(runId: string | null, enabled = true) {
  return useHydrationSafe(
    useQuery({
      queryKey: runResultsKey(runId ?? "none"),
      queryFn: () => api<RunResultsDto>(`/api/runs/${runId}/results`),
      enabled: !!runId && enabled,
    }),
  );
}

/** Everything the AI analysis results page shows (P8), with the AI's texts in the screen's language. */
export function useAnalysisResults(runId: string | null, enabled = true) {
  const { locale } = useLocale();
  return useHydrationSafe(
    useQuery({
      queryKey: ["runs", runId ?? "none", "analysis", locale],
      queryFn: () => api<AnalysisResultsDto>(`/api/runs/${runId}/analysis?lang=${locale}`),
      enabled: !!runId && enabled,
      // Switching language keeps the page on screen while the other version loads.
      placeholderData: (prev) => prev,
    }),
  );
}

export function useProposalResult(runId: string | null, proposalId: string) {
  const { locale } = useLocale();
  return useHydrationSafe(
    useQuery({
      queryKey: ["runs", runId ?? "none", "proposals", proposalId, locale],
      queryFn: () =>
        api<ProposalResultDto>(`/api/runs/${runId}/proposals/${proposalId}?lang=${locale}`),
      enabled: !!runId,
      placeholderData: (prev) => prev,
    }),
  );
}

/** Latest run whose results can be shown (completed, with or without errors). */
export function useLatestResultsRun(projectId: string) {
  const { data } = useProjectRuns(projectId);
  return (
    data?.find((r) => r.status === "completed" || r.status === "completed_with_errors") ?? null
  );
}

/** Refresh everything a run touches: its status, results, the run list and the project status. */
export function useInvalidateRun(projectId: string) {
  const qc = useQueryClient();
  return (runId?: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: projectKey(projectId) }), // also run lists and proposals
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
      runId ? qc.invalidateQueries({ queryKey: ["runs", runId] }) : Promise.resolve(),
      qc.invalidateQueries({ queryKey: activeRunsKey }), // global RunPill
    ]);
}

export function useStartRun(projectId: string) {
  const invalidate = useInvalidateRun(projectId);
  return useMutation({
    mutationFn: () => api<RunDto>(`/api/projects/${projectId}/runs`, { method: "POST" }),
    // Not awaited: the caller navigates to the run right away; data refreshes in the background.
    onSettled: (run) => {
      void invalidate(run?.id);
    },
  });
}

export function useRunAction(projectId: string) {
  const invalidate = useInvalidateRun(projectId);
  return useMutation({
    mutationFn: ({
      runId,
      action,
      stepId,
    }: {
      runId: string;
      action: "cancel" | "resume" | "retry";
      stepId?: string;
    }) =>
      api<RunDto>(
        action === "retry"
          ? `/api/runs/${runId}/steps/${stepId}/retry`
          : `/api/runs/${runId}/${action}`,
        { method: "POST" },
      ),
    onSettled: (_r, _e, v) => {
      void invalidate(v.runId);
    },
  });
}
