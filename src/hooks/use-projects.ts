"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  ProjectDetailDto,
  ProjectDto,
  ProjectStandardRef,
  ProjectSummaryDto,
} from "@/lib/api-types";
import type { ProjectCategory } from "@/lib/domain";
import { useHydrationSafe } from "./hydration-safe";

export const projectsKey = ["projects"] as const;
export const projectKey = (id: string) => ["projects", id] as const;

export interface ProjectInput {
  name: string;
  description: string;
  category: ProjectCategory;
  deadline: string | null;
  notes: string;
  /** The client's internal cost estimate (building works only; never shown to vendors). */
  estimateAmount?: number | null;
  estimateCurrency?: string | null;
}

export function useProjects() {
  return useHydrationSafe(useProjectsQuery());
}
function useProjectsQuery() {
  return useQuery({
    queryKey: projectsKey,
    queryFn: () => api<ProjectSummaryDto[]>("/api/projects"),
  });
}

export function useProject(id: string | null) {
  return useHydrationSafe(useProjectQuery(id));
}
function useProjectQuery(id: string | null) {
  return useQuery({
    queryKey: projectKey(id ?? "none"),
    queryFn: () => api<ProjectDetailDto>(`/api/projects/${id}`),
    enabled: !!id,
  });
}

export function useInvalidateProject(id?: string | null) {
  const qc = useQueryClient();
  return () =>
    Promise.all([
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
      id ? qc.invalidateQueries({ queryKey: projectKey(id) }) : Promise.resolve(),
    ]);
}

export function useCreateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) =>
      api<ProjectDto>("/api/projects", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
  });
}

type ProjectPatch = Partial<ProjectInput> & { status?: "draft" | "open" | "archived" };

export function useUpdateProject(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (patch: ProjectPatch) =>
      api<ProjectDto>(`/api/projects/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
    onSettled: () => invalidate(),
  });
}

export function useSetProjectStandards(id: string) {
  const invalidate = useInvalidateProject(id);
  return useMutation({
    mutationFn: (standardIds: string[]) =>
      api<ProjectStandardRef[]>(`/api/projects/${id}/standards`, {
        method: "PUT",
        body: JSON.stringify({ standardIds }),
      }),
    onSettled: () => invalidate(),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/projects/${id}`, { method: "DELETE" }),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: projectKey(id) });
      return qc.invalidateQueries({ queryKey: projectsKey, exact: true });
    },
  });
}

export function useDeleteProjectDocument(projectId: string) {
  const invalidate = useInvalidateProject(projectId);
  return useMutation({
    mutationFn: (docId: string) => api<void>(`/api/documents/${docId}`, { method: "DELETE" }),
    onSuccess: () => invalidate(),
  });
}
