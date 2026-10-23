"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";
import type {
  DocumentDto,
  ProposalDetailDto,
  ProposalDto,
  ProposalSummaryDto,
  VendorDto,
  VendorSummaryDto,
} from "@/lib/api-types";
import { uploadFile } from "@/lib/upload";
import { useHydrationSafe } from "./hydration-safe";
import { projectKey, projectsKey } from "./use-projects";

export const vendorsKey = ["vendors"] as const;
export const proposalsKey = (projectId: string) => ["projects", projectId, "proposals"] as const;
export const proposalKey = (id: string) => ["proposals", id] as const;

export interface VendorInput {
  name: string;
  country: string;
  contactName: string;
  contactEmail: string;
}

export function useVendors() {
  return useHydrationSafe(useVendorsQuery());
}
function useVendorsQuery() {
  return useQuery({ queryKey: vendorsKey, queryFn: () => api<VendorSummaryDto[]>("/api/vendors") });
}

export function useCreateVendor() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: VendorInput) =>
      api<VendorDto>("/api/vendors", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: vendorsKey }),
  });
}

/** `null`: no project yet (the guided form before its draft exists), nothing to load. */
export function useProposals(projectId: string | null) {
  return useHydrationSafe(useProposalsQuery(projectId));
}
function useProposalsQuery(projectId: string | null) {
  return useQuery({
    queryKey: proposalsKey(projectId ?? "none"),
    queryFn: () => api<ProposalSummaryDto[]>(`/api/projects/${projectId}/proposals`),
    enabled: !!projectId,
  });
}

export function useProposal(id: string) {
  return useHydrationSafe(useProposalQuery(id));
}
function useProposalQuery(id: string) {
  return useQuery({
    queryKey: proposalKey(id),
    queryFn: () => api<ProposalDetailDto>(`/api/proposals/${id}`),
  });
}

/** Everything that shows proposal counts: project lists, the project, its proposals, vendors. */
function useInvalidateProposals() {
  const qc = useQueryClient();
  return (projectId: string) =>
    Promise.all([
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
      qc.invalidateQueries({ queryKey: projectKey(projectId) }), // also matches proposalsKey
      qc.invalidateQueries({ queryKey: vendorsKey }),
      qc.invalidateQueries({ queryKey: ["proposals"] }),
    ]);
}

export interface SubmissionFile {
  file: File;
  kind: "commercial" | "technical";
}

/**
 * Vendor-side submission (simulator): open/reset the proposal, then upload each file with its
 * own progress (one file per request, G-39). Resolves with the proposal and upload errors.
 */
export function useSubmitProposal(projectId: string | null) {
  const invalidate = useInvalidateProposals();
  return useMutation({
    mutationFn: async ({
      vendorId,
      files,
      onFileProgress,
      projectId: target = projectId,
    }: {
      vendorId: string;
      files: SubmissionFile[];
      onFileProgress?: (index: number, pct: number) => void;
      /** A project created at save time (guided form: the draft may not exist before). */
      projectId?: string | null;
    }) => {
      if (!target) throw new Error("Save the project first.");
      const proposal = await api<ProposalDto & { replaced: boolean }>(
        `/api/projects/${target}/proposals`,
        { method: "POST", body: JSON.stringify({ vendorId }) },
      );
      const uploaded: DocumentDto[] = [];
      const failed: { name: string; message: string }[] = [];
      for (const [i, f] of files.entries()) {
        try {
          uploaded.push(
            await uploadFile<DocumentDto>(
              `/api/proposals/${proposal.id}/documents`,
              f.file,
              (pct) => onFileProgress?.(i, pct),
              { kind: f.kind },
            ),
          );
        } catch (err) {
          failed.push({
            name: f.file.name,
            message: err instanceof Error ? err.message : "Upload failed.",
          });
        }
      }
      return { proposal, uploaded, failed };
    },
    onSettled: (_d, _e, vars) => {
      const target = vars.projectId ?? projectId;
      if (target) void invalidate(target);
    },
  });
}

export function useDeleteProposal(projectId: string) {
  const invalidate = useInvalidateProposals();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api<void>(`/api/proposals/${id}`, { method: "DELETE" }),
    onSuccess: (_d, id) => {
      qc.removeQueries({ queryKey: proposalKey(id) });
      return invalidate(projectId);
    },
  });
}
