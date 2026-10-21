"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { RunDto, RunQualityDto, RunReviewDto } from "@/lib/api-types";
import type { ReviewVerdict } from "@/lib/domain";
import { useHydrationSafe } from "./hydration-safe";

export interface RunReviewSummary {
  run: RunDto;
  confidence: number | null;
  reviews: number;
  rating: number | null;
}

export const reviewSummaryKey = (projectId: string) =>
  ["projects", projectId, "ai-review"] as const;

export function useReviewSummary(projectId: string) {
  return useHydrationSafe(
    useQuery({
      queryKey: reviewSummaryKey(projectId),
      queryFn: () => api<RunReviewSummary[]>(`/api/projects/${projectId}/ai-review`),
    }),
  );
}

export function useRunQuality(runId: string | null) {
  return useHydrationSafe(
    useQuery({
      queryKey: ["runs", runId ?? "none", "quality"],
      queryFn: () => api<RunQualityDto>(`/api/runs/${runId}/quality`),
      enabled: !!runId,
    }),
  );
}

export function useRunReviews(runId: string | null) {
  return useHydrationSafe(
    useQuery({
      queryKey: ["runs", runId ?? "none", "reviews"],
      queryFn: () => api<RunReviewDto[]>(`/api/runs/${runId}/reviews`),
      enabled: !!runId,
    }),
  );
}

export interface ReviewInput {
  reviewer: string;
  overall: number;
  accuracy: number | null;
  evidence: number | null;
  completeness: number | null;
  usefulness: number | null;
  verdict: ReviewVerdict;
  comment: string;
}

export function useCreateReview(projectId: string, runId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ReviewInput) =>
      api<RunReviewDto>(`/api/runs/${runId}/reviews`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSettled: () =>
      Promise.all([
        qc.invalidateQueries({ queryKey: ["runs", runId, "reviews"] }),
        qc.invalidateQueries({ queryKey: reviewSummaryKey(projectId) }),
      ]),
  });
}
