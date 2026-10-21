"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BidProfileDto, GenJobDto } from "@/lib/api-types";
import { useHydrationSafe } from "./hydration-safe";
import { projectKey, projectsKey } from "./use-projects";

export const genJobKey = (projectId: string) => ["projects", projectId, "simulate"] as const;

/** The project's latest proposal-generation job; polls every second while it runs. */
export function useGenJob(projectId: string, enabled = true) {
  return useHydrationSafe(
    useQuery({
      queryKey: genJobKey(projectId),
      queryFn: () => api<GenJobDto | null>(`/api/projects/${projectId}/simulate`),
      enabled,
      refetchInterval: (q) => (q.state.data?.status === "running" ? 1000 : false),
    }),
  );
}

export function useStartGenJob(projectId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (profiles: BidProfileDto[]) =>
      api<GenJobDto>(`/api/projects/${projectId}/simulate`, {
        method: "POST",
        body: JSON.stringify({ profiles }),
      }),
    onSuccess: (job) => qc.setQueryData(genJobKey(projectId), job),
  });
}

/** New proposals appeared: refresh the table, counts and the Analyse panel. */
export function useInvalidateProposals(projectId: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: projectKey(projectId) }),
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
    ]);
}
