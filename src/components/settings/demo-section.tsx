"use client";

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowRight, DatabaseZap, PackagePlus, PackageX, Send } from "lucide-react";
import { currentT, useT } from "@/components/i18n-provider";
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
  const t = useT();
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
      title={t("Demo tools")}
      description={t(
        "Tools for trying {app} without real vendors. They change data, so each one asks first.",
        { app: t.appName },
      )}
    >
      <div className="flex flex-col divide-y divide-border/70">
        <Tool
          icon={<Send />}
          title={t("Vendor simulator")}
          text={t(
            "Play a vendor: pick an open tender and submit a commercial and a technical proposal.",
          )}
          action={
            <Button asChild variant="secondary">
              <Link href="/vendor-portal">
                {t("Open simulator")} <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
          }
        />
        <Tool
          icon={<PackagePlus />}
          title={t("Sample data")}
          text={
            isLoading || !status ? (
              <Skeleton className="h-4 w-64" />
            ) : !status.available ? (
              t("The sample files (test-inputs/) aren't available on this server.")
            ) : loaded ? (
              t(
                "Loaded: {projects} sample projects with {proposals} vendor proposals. Reloading replaces them; your own projects are never touched.",
                { projects: status.sampleProjects, proposals: status.sampleProposals },
              )
            ) : (
              t(
                "Two sample tenders (cargo X-ray scanners with four vendor proposals, and a Port Community System), plus sample standards. Your own data is kept.",
              )
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
                  <PackageX /> {t("Remove")}
                </Button>
              )}
              <Button
                variant="secondary"
                loading={load.isPending}
                disabled={!status?.available}
                onClick={() => setConfirmLoad(true)}
              >
                {loaded ? t("Reload sample data") : t("Load sample data")}
              </Button>
            </div>
          }
        />
        <Tool
          icon={<DatabaseZap />}
          title={t("Reset all data")}
          text={t(
            "Delete every project, standard, vendor, proposal and uploaded file. Your profile and settings are kept.",
          )}
          action={
            <Button
              variant="destructive-soft"
              loading={reset.isPending}
              onClick={() => setConfirmReset(true)}
            >
              {t("Reset all data")}
            </Button>
          }
        />
      </div>

      <ConfirmDialog
        open={confirmLoad}
        onOpenChange={setConfirmLoad}
        title={loaded ? t("Reload the sample data?") : t("Load the sample data?")}
        description={
          loaded
            ? t(
                "The sample projects are deleted and created again, with their proposals. Your own projects and standards are not changed.",
              )
            : t(
                "Adds two sample tenders, four vendors with proposals and two sample standards. Standards you already have with the same code (e.g. CITS-2026) are reused, not changed.",
              )
        }
        confirmLabel={loaded ? t("Reload") : t("Load sample data")}
        destructive={false}
        onConfirm={async () => {
          try {
            const r = await load.mutateAsync();
            const t = currentT(); // the language on screen when the call returns
            toast.success(t("Sample data loaded"), {
              description: t("{projects} projects, {proposals} proposals.", {
                projects: r.projects,
                proposals: r.proposals,
              }),
            });
          } catch (err) {
            toast.error(
              err instanceof Error ? err.message : currentT()("Couldn't load the sample data."),
            );
          }
        }}
      />
      <ConfirmDialog
        open={confirmRemove}
        onOpenChange={setConfirmRemove}
        title={t("Remove the sample data?")}
        description={t(
          "Sample projects and their proposals are deleted, with sample standards and vendors that nothing else uses. Your own data stays.",
        )}
        confirmLabel={t("Remove sample data")}
        onConfirm={async () => {
          const r = await remove.mutateAsync();
          toast.success(
            currentT().plural(
              r.projects,
              "Removed {n} sample project.",
              "Removed {n} sample projects.",
            ),
          );
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        title={t("Reset all data?")}
        description={t(
          "Every project, standard, vendor, proposal and uploaded file is permanently deleted. This can't be undone.",
        )}
        typeToConfirm="RESET"
        confirmLabel={t("Reset all data")}
        onConfirm={async () => {
          const r = await reset.mutateAsync();
          const t = currentT(); // the language on screen when the call returns
          toast.success(t("All data deleted"), {
            description: t("{projects} projects and {standards} standards removed.", {
              projects: r.projects,
              standards: r.standards,
            }),
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
