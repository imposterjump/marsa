"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { RuleDto, StandardDetailDto, StandardDto, StandardSummaryDto } from "@/lib/api-types";
import type { Priority, StandardCategory } from "@/lib/domain";
import { useHydrationSafe } from "./hydration-safe";

export const standardsKey = ["standards"] as const;
export const standardKey = (id: string) => ["standards", id] as const;

export interface StandardInput {
  code: string;
  title: string;
  category: StandardCategory;
  description: string;
  isActive: boolean;
}

export interface RuleInput {
  code?: string | null;
  text: string;
  priority: Priority;
  sortOrder?: number;
}

export function useStandards() {
  return useHydrationSafe(useStandardsQuery());
}

function useStandardsQuery() {
  return useQuery({
    queryKey: standardsKey,
    queryFn: () => api<StandardSummaryDto[]>("/api/standards"),
  });
}

export function useStandard(id: string) {
  return useHydrationSafe(useStandardQuery(id));
}

function useStandardQuery(id: string) {
  return useQuery({
    queryKey: standardKey(id),
    queryFn: () => api<StandardDetailDto>(`/api/standards/${id}`),
  });
}

/** Invalidate list + detail after any change so counts stay right everywhere. */
function useInvalidate(id?: string) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: standardsKey, exact: true }),
      id ? qc.invalidateQueries({ queryKey: standardKey(id) }) : Promise.resolve(),
    ]);
}

export function useCreateStandard() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (input: StandardInput) =>
      api<StandardDto>("/api/standards", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateStandard(id: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidate(id);
  return useMutation({
    mutationFn: (patch: Partial<StandardInput>) =>
      api<StandardDto>(`/api/standards/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    // Optimistic for the list (active switch on cards).
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: standardsKey, exact: true });
      const prev = qc.getQueryData<StandardSummaryDto[]>(standardsKey);
      if (prev)
        qc.setQueryData(
          standardsKey,
          prev.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        );
      return { prev };
    },
    onError: (_e, _p, ctx) => ctx?.prev && qc.setQueryData(standardsKey, ctx.prev),
    onSettled: () => invalidate(),
  });
}

export function useDeleteStandard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/standards/${id}`, { method: "DELETE" }),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: standardKey(id) });
      return qc.invalidateQueries({ queryKey: standardsKey, exact: true });
    },
  });
}

export function useCreateRule(standardId: string) {
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: (input: RuleInput) =>
      api<RuleDto>(`/api/standards/${standardId}/rules`, {
        method: "POST",
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useBulkCreateRules(standardId: string) {
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: (rules: Omit<RuleInput, "sortOrder">[]) =>
      api<RuleDto[]>(`/api/standards/${standardId}/rules/bulk`, {
        method: "POST",
        body: JSON.stringify({ rules }),
      }),
    onSuccess: () => invalidate(),
  });
}

export function useUpdateRule(standardId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: ({ id, ...patch }: Partial<RuleInput> & { id: string }) =>
      api<RuleDto>(`/api/standards/${standardId}/rules/${id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      }),
    onMutate: async ({ id, ...patch }) => {
      await qc.cancelQueries({ queryKey: standardKey(standardId) });
      const prev = qc.getQueryData<StandardDetailDto>(standardKey(standardId));
      if (prev) {
        qc.setQueryData(standardKey(standardId), {
          ...prev,
          rules: prev.rules.map((r) =>
            r.id === id ? { ...r, ...patch, code: patch.code ?? r.code } : r,
          ),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(standardKey(standardId), ctx.prev),
    onSettled: () => invalidate(),
  });
}

export function useDeleteRule(standardId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: (id: string) =>
      api<RuleDto>(`/api/standards/${standardId}/rules/${id}`, { method: "DELETE" }),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: standardKey(standardId) });
      const prev = qc.getQueryData<StandardDetailDto>(standardKey(standardId));
      if (prev)
        qc.setQueryData(standardKey(standardId), {
          ...prev,
          rules: prev.rules.filter((r) => r.id !== id),
        });
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(standardKey(standardId), ctx.prev),
    onSettled: () => invalidate(),
  });
}

export function useReorderRules(standardId: string) {
  const qc = useQueryClient();
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: (ids: string[]) =>
      api<RuleDto[]>(`/api/standards/${standardId}/rules/reorder`, {
        method: "POST",
        body: JSON.stringify({ ids }),
      }),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: standardKey(standardId) });
      const prev = qc.getQueryData<StandardDetailDto>(standardKey(standardId));
      if (prev) {
        const byId = new Map(prev.rules.map((r) => [r.id, r]));
        qc.setQueryData(standardKey(standardId), {
          ...prev,
          rules: ids.map((id, i) => ({ ...byId.get(id)!, sortOrder: i })),
        });
      }
      return { prev };
    },
    onError: (_e, _v, ctx) => ctx?.prev && qc.setQueryData(standardKey(standardId), ctx.prev),
    onSettled: () => invalidate(),
  });
}

export function useDeleteDocument(standardId: string) {
  const invalidate = useInvalidate(standardId);
  return useMutation({
    mutationFn: (docId: string) => api<void>(`/api/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => invalidate(),
  });
}

export function useInvalidateStandard(id: string) {
  return useInvalidate(id);
}
