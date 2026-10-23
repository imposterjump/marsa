"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Eye, FileStack, Megaphone, MoreHorizontal, Trash2, UserPlus, Users, Wand2 } from "lucide-react";
import { DataTable, type Column } from "@/components/data/data-table";
import { useProjectContext } from "@/components/projects/project-shell";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { VendorsEditor } from "./vendors-editor";
import { GenerateProposalsDialog } from "./generate-proposals-dialog";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Pill } from "@/components/ui/status-pill";
import { useDeleteProposal, useProposals } from "@/hooks/use-proposals";
import { AnalysePanel } from "./analyse-panel";
import type { ProposalSummaryDto } from "@/lib/api-types";
import { formatDate, formatDateTime } from "@/lib/format";
import { PROPOSAL_SOURCE_LABEL } from "@/lib/labels";

const plural = (n: number, w: string) => `${n} ${w}${n === 1 ? "" : "s"}`;

/**
 * PRD FR-5: one row per vendor (name, date, files) with a View action. P8: the customer enters
 * vendors here too ("Add vendor": same form as the guided project form), also after an analysis,
 * then runs the analysis again with them.
 */
export function ProposalsTab() {
  const p = useProjectContext();
  const { data, isLoading, isError, refetch } = useProposals(p.id);
  const [removing, setRemoving] = useState<ProposalSummaryDto | null>(null);
  const remove = useDeleteProposal(p.id);
  const base = `/projects/${p.id}/proposals`;
  const canAdd = p.status === "open" || p.status === "evaluated" || p.status === "draft";
  const canSimulate = canAdd;
  const canRemove = canAdd;

  const [generating, setGenerating] = useState(false);
  const [adding, setAdding] = useState(false);
  const simulate = canAdd && (
    <span className="flex flex-wrap gap-2">
      <Button onClick={() => setAdding(true)}>
        <UserPlus /> Add vendor
      </Button>
      <Button variant="brand" onClick={() => setGenerating(true)}>
        <Wand2 /> Generate with AI
      </Button>
    </span>
  );
  // Rendered once, outside both layouts below: the first generated proposal switches the tab from
  // the empty state to the table, which would otherwise remount the dialog and lose its progress.
  const generateDialog = canSimulate && (
    <>
      <GenerateProposalsDialog project={p} open={generating} onOpenChange={setGenerating} />
      <Dialog open={adding} onOpenChange={setAdding}>
        <DialogContent className="sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Add vendor</DialogTitle>
            <DialogDescription>
              The vendor and its two proposals: the commercial (financial) and the technical one.
              {p.status === "evaluated" && " Run the AI analysis again afterwards to include it."}
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <VendorsEditor projectId={p.id} compact onSaved={() => setAdding(false)} />
          </DialogBody>
        </DialogContent>
      </Dialog>
    </>
  );

  if (!isLoading && !isError && data?.length === 0) {
    return (
      <>
        {generateDialog}
        <div className="flex flex-col gap-6">
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
            <EmptyState
              size="lg"
              art={
                canSimulate ? (
                  <Users className="size-12 text-brand" strokeWidth={1.25} />
                ) : (
                  <Megaphone className="size-12 text-ink-faint" strokeWidth={1.25} />
                )
              }
              title={canAdd ? "No vendors yet" : "No proposals"}
              description={
                canAdd
                  ? `Add each vendor with its commercial and technical proposal${
                      p.deadline ? ` (submission deadline ${formatDate(`${p.deadline}T00:00:00`)})` : ""
                    }. Then run the AI analysis from the header.`
                  : "This project has no proposals."
              }
              actions={simulate}
            />
          </div>
          {canAdd && <AnalysePanel project={p} proposals={[]} />}
        </div>
      </>
    );
  }

  const columns: Column<ProposalSummaryDto>[] = [
    {
      id: "vendor",
      header: "Vendor",
      sortValue: (r) => r.vendor.name,
      cell: (r) => (
        <span className="flex min-w-0 items-center gap-3">
          <InitialsAvatar name={r.vendor.name} size="sm" />
          <span className="flex min-w-0 flex-col">
            <Link
              href={`${base}/${r.id}`}
              className="truncate font-medium text-ink underline-offset-2 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
              dir="auto"
            >
              {r.vendor.name}
            </Link>
            {r.vendor.country && <span className="text-xs text-ink-muted">{r.vendor.country}</span>}
          </span>
        </span>
      ),
    },
    {
      id: "submitted",
      header: "Proposal date",
      sortValue: (r) => r.submittedAt,
      cell: (r) => (
        <span className="whitespace-nowrap text-ink-2 tabular-nums">
          {formatDateTime(r.submittedAt)}
        </span>
      ),
    },
    {
      id: "files",
      header: "Documents",
      sortValue: (r) => r.documentCounts.commercial + r.documentCounts.technical,
      cell: (r) => {
        const c = r.documentCounts;
        const missing = c.commercial === 0 || c.technical === 0;
        return (
          <span className="flex flex-col gap-0.5 text-xs">
            <span className="whitespace-nowrap text-ink-2">
              {plural(c.commercial, "commercial")} · {plural(c.technical, "technical")}
            </span>
            <span className={missing ? "text-partial" : "text-ink-muted"}>
              {missing
                ? c.commercial === 0
                  ? "No commercial file"
                  : "No technical file"
                : c.pages > 0
                  ? plural(c.pages, "page")
                  : ""}
            </span>
          </span>
        );
      },
    },
    {
      id: "source",
      header: "Source",
      sortValue: (r) => r.source,
      cell: (r) => (
        <Pill
          tone={r.source === "seed" ? "info" : r.source === "ai" ? "brand" : "neutral"}
          size="sm"
        >
          {PROPOSAL_SOURCE_LABEL[r.source]}
        </Pill>
      ),
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "end",
      cell: (r) => (
        <span className="flex items-center justify-end gap-1">
          <Button asChild size="sm">
            <Link
              href={`${base}/${r.id}?tab=commercial&reader=1`}
              aria-label={`View ${r.vendor.name}'s proposal`}
            >
              <Eye /> View
            </Link>
          </Button>
          {canRemove && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  aria-label={`More actions for ${r.vendor.name}`}
                >
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  className="gap-2.5"
                  onSelect={() => setRemoving(r)}
                >
                  <Trash2 className="size-4" /> Remove proposal
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </span>
      ),
    },
  ];

  return (
    <>
      {generateDialog}
      <section aria-labelledby="proposals-title" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-1">
            <h2
              id="proposals-title"
              className="flex items-center gap-2 font-heading text-lg font-semibold tracking-tight text-ink"
            >
              <FileStack className="size-5 text-ink-faint" aria-hidden />
              Proposals{" "}
              {data && <span className="text-ink-muted tabular-nums">({data.length})</span>}
            </h2>
            <p className="text-[13px] text-ink-muted">
              Each vendor has a commercial (financial) and a technical proposal. Open one to read
              its documents.
            </p>
          </div>
          {simulate}
        </div>
        {isError ? (
          <div className="rounded-xl border border-fail/30 bg-fail-soft/40 p-6 text-fail">
            Couldn&apos;t load proposals.{" "}
            <button className="font-medium underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : (
          <DataTable
            caption={`Proposals received for ${p.code}`}
            columns={columns}
            rows={data ?? []}
            rowKey={(r) => r.id}
            loading={isLoading}
            initialSort={{ id: "submitted", dir: "asc" }}
          />
        )}
        {data && data.length > 0 && <AnalysePanel project={p} proposals={data} />}
        <ConfirmDialog
          open={!!removing}
          onOpenChange={(o) => !o && setRemoving(null)}
          title={`Remove ${removing?.vendor.name ?? "this"}'s proposal?`}
          description="Its commercial and technical files are deleted. In a real tender this is what happens when a vendor withdraws its bid."
          confirmLabel="Remove proposal"
          onConfirm={async () => {
            if (!removing) return;
            await remove.mutateAsync(removing.id);
            toast.success(`${removing.vendor.name}'s proposal removed.`);
            setRemoving(null);
          }}
        />
      </section>
    </>
  );
}
