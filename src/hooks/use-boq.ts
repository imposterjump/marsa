"use client";

import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { BoqComparisonDto } from "@/lib/api-types";
import { useHydrationSafe } from "./hydration-safe";

/** Under the project's key, so refreshing the project refreshes the price comparison too. */
export const boqKey = (projectId: string, runId: string | null) =>
  ["projects", projectId, "boq", runId] as const;

/**
 * The price comparison of a building works tender (2026-10-25): the bidders' priced bills of
 * quantities against the client's, computed by the server (never by the AI). With a run, only the
 * bids of that analysis. `null` when the tender has no Excel bill of quantities.
 */
export function useBoqComparison(projectId: string, runId: string | null) {
  return useHydrationSafe(
    useQuery({
      queryKey: boqKey(projectId, runId),
      queryFn: () =>
        api<{ comparison: BoqComparisonDto | null }>(
          `/api/projects/${projectId}/boq${runId ? `?run=${encodeURIComponent(runId)}` : ""}`,
        ),
      select: (r) => r.comparison,
    }),
  );
}
