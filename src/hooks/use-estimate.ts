"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import { DEFAULT_AI_MODEL, DEFAULT_CONCURRENCY } from "@/lib/domain";
import { estimateBidsUsd, estimateRun, type RunEstimateInput } from "@/lib/plan";
import { useHydrationSafe } from "./hydration-safe";
import { useSettings } from "./use-settings";

/** Document sizes behind the cost estimates; refetched with the project (same key prefix). */
export function useEstimateInput(projectId: string, enabled = true) {
  return useHydrationSafe(
    useQuery({
      queryKey: ["projects", projectId, "estimate"],
      queryFn: () => api<RunEstimateInput>(`/api/projects/${projectId}/estimate`),
      enabled,
    }),
  );
}

/** Realistic cost / time of an analysis run with the current settings (model, parallel steps). */
export function useRunEstimate(projectId: string) {
  const { data: settings } = useSettings();
  const { data: input } = useEstimateInput(projectId);
  if (!settings || !input) return null;
  const model = settings.aiModel ?? DEFAULT_AI_MODEL;
  return {
    model,
    live: settings.runtime.aiMode === "live",
    ...estimateRun(input, { model, concurrency: settings.concurrency ?? DEFAULT_CONCURRENCY }),
  };
}

export function useBidsEstimate(projectId: string, count: number, enabled: boolean) {
  const { data: settings } = useSettings();
  const { data: input } = useEstimateInput(projectId, enabled);
  if (!settings || !input) return null;
  return estimateBidsUsd(input, { model: settings.aiModel ?? DEFAULT_AI_MODEL, count });
}
