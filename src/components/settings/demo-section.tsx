"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, DatabaseZap, PackagePlus, PackageX, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useHydrationSafe } from "@/hooks/hydration-safe";
import { api } from "@/lib/api-client";
import { Section } from "./settings-section";

interface SeedStatus {
  available: boolean;
  sampleProjects: number;
  sampleProposals: number;
  sampleStandards: number;
  sampleVendors: number;
}

const statusKey = ["dev", "seed"] as const;

/** Settings → Demo tools (P4.3): vendor simulator link, sample data, full reset. */
export function DemoSection() {
  const qc = useQueryClient();
  const { data: status, isLoading } = useHydrationSafe(
    useQuery({ queryKey: statusKey, queryFn: () => api<SeedStatus>("/api/dev/seed") }),
  );
  // Everything cached may have changed: projects, standards, vendors, proposals.
  const refreshAll = () => qc.invalidateQueries();
  const load = useMutation({
    mutationFn: () =>
      api<{ projects: number; proposals: number }>("/api/dev/seed", { method: "POST" }),
    onSettled: refreshAll,
  });
  const remove = useMutation({
    mutationFn: () => api<{ projects: number }>("/api/dev/seed", { method: "DELETE" }),
    onSettled: refreshAll,
  });
  const reset = useMutation({
    mutationFn: () =>
      api<{ projects: number; standards: number }>("/api/dev/reset", {
        method: "POST",
        body: JSON.stringify({ confirm: "RESET" }),
      }),
    onSettled: refreshAll,
  });
  const [confirmLoad, setConfirmLoad] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const loaded = (status?.sampleProjects ?? 0) > 0;

  return (
    <Section
      id="demo"
      title="Demo tools"
      description="Tools for trying Marsa without real vendors. They change data, so each one asks first."
    >
      <div className="flex flex-col divide-y divide-border/70">
        <Tool
          icon={<Send />}
          title="Vendor simulator"
          text="Play a vendor: pick an open tender and submit a commercial and a technical proposal."
          action={
            <Button asChild variant="secondary">
              <Link href="/vendor-portal">
                Open simulator <ArrowRight />
              </Link>
            </Button>
          }
        />
        <Tool
          icon={<PackagePlus />}
          title="Sample data"
          text={
            isLoading || !status ? (
              <Skeleton className="h-4 w-64" />
            ) : !status.available ? (
              "The sample files (test-inputs/) aren't available on this server."
            ) : loaded ? (
              `Loaded: ${status.sampleProjects} sample projects with ${status.sampleProposals} vendor proposals. Reloading replaces them; your own projects are never touched.`
            ) : (
              "Two sample tenders (cargo X-ray scanners with four vendor proposals, and a Port Community System), plus sample standards. Your own data is kept."
            )
          }
          action={
            <div className="flex flex-wrap justify-end gap-2">
              {loaded && (
                <Button
                  variant="ghost"
                  onClick={() => setConfirmRemove(true)}
                  disabled={remove.isPending}
                >
                  <PackageX /> Remove
                </Button>
              )}
              <Button
                variant="secondary"
                loading={load.isPending}
                disabled={!status?.available}
                onClick={() => setConfirmLoad(true)}
              >
                {loaded ? "Reload sample data" : "Load sample data"}
              </Button>
            </div>
          }
        />
        <Tool
          icon={<DatabaseZap />}
          title="Reset all data"
          text="Delete every project, standard, vendor, proposal and uploaded file. Your profile and settings are kept."
          action={
            <Button
              variant="destructive-soft"
              loading={reset.isPending}
              onClick={() => setConfirmReset(true)}
            >
              Reset all data
            </Button>
          }
        />
      </div>

      <ConfirmDialog
        open={confirmLoad}
        onOpenChange={setConfirmLoad}
        title={loaded ? "Reload the sample data?" : "Load the sample data?"}
        description={
          loaded
            ? "The sample projects are deleted and created again, with their proposals. Your own projects and standards are not changed."
            : "Adds two sample tenders, four vendors with proposals and two sample standards. Standards you already have with the same code (e.g. CITS-2026) are reused, not changed."
        }
        confirmLabel={loaded ? "Reload" : "Load sample data"}
        destructive={false}
        onConfirm={async () => {
          try {
            const r = await load.mutateAsync();
            toast.success("Sample data loaded", {
              description: `${r.projects} projects, ${r.proposals} proposals.`,
            });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Couldn't load the sample data.");
          }
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title="Remove the sample data?"
        description="Sample projects and their proposals are deleted, with sample standards and vendors that nothing else uses. Your own data stays."
        confirmLabel="Remove sample data"
        onConfirm={async () => {
          const r = await remove.mutateAsync();
          toast.success(`Removed ${r.projects} sample project${r.projects === 1 ? "" : "s"}.`);
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title="Reset all data?"
        description="Every project, standard, vendor, proposal and uploaded file is permanently deleted. This can't be undone."
        typeToConfirm="RESET"
        confirmLabel="Reset all data"
        onConfirm={async () => {
          const r = await reset.mutateAsync();
          toast.success("All data deleted", {
            description: `${r.projects} projects and ${r.standards} standards removed.`,
          });
        }}
      />
    </Section>
  );
}

function Tool({
  icon,
  title,
  text,
  action,
}: {
  icon: React.ReactNode;
  title: string;
  text: React.ReactNode;
  action: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 py-5 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-ink-muted [&_svg]:size-4">
          {icon}
        </span>
        <div className="flex flex-col gap-1">
          <h3 className="font-medium text-ink">{title}</h3>
          <div className="max-w-md text-[13px] leading-relaxed text-ink-muted">{text}</div>
        </div>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
