"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type { SettingsDto } from "@/lib/api-types";

export const settingsKey = ["settings"] as const;

export function useSettings() {
  return useQuery({
    queryKey: settingsKey,
    queryFn: () => api<SettingsDto>("/api/settings"),
    staleTime: 60_000,
  });
}

type SettingsPatch = Partial<Omit<SettingsDto, "runtime" | "updatedAt" | "appName">>;

/** Optimistic settings update: the UI changes instantly, rolls back if the server rejects it. */
export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (patch: SettingsPatch) =>
      api<SettingsDto>("/api/settings", { method: "PUT", body: JSON.stringify(patch) }),
    onMutate: async (patch) => {
      await qc.cancelQueries({ queryKey: settingsKey });
      const previous = qc.getQueryData<SettingsDto>(settingsKey);
      if (previous) qc.setQueryData<SettingsDto>(settingsKey, { ...previous, ...patch });
      return { previous };
    },
    onError: (_err, _patch, ctx) => {
      if (ctx?.previous) qc.setQueryData(settingsKey, ctx.previous);
    },
    onSuccess: (data) => qc.setQueryData(settingsKey, data),
  });
}
