"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Download,
  ExternalLink,
  FileText,
  Lock,
  Receipt,
  ShieldAlert,
  Scale,
  ListChecks,
} from "lucide-react";
import { cn } from "cn";
import { useProjectContext } from "@/components/projects/project-shell";
import { SetBreadcrumbs } from "@/components/shell/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { FileIcon } from "@/components/ui/file-icon";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useProposal, useProposals } from "@/hooks/use-proposals";
import { ApiClientError } from "@/lib/api-client";
import type { DocumentDto } from "@/lib/api-types";
import { fileKind, formatBytes, middleTruncate } from "@/lib/files";
import { formatDateTime } from "@/lib/format";
import { PROPOSAL_SOURCE_LABEL } from "@/lib/labels";

const TABS = [
  { id: "commercial", label: "Commercial", icon: Receipt },
  { id: "technical", label: "Technical", icon: FileText },
  { id: "compliance", label: "Compliance", icon: ListChecks, locked: true },
  { id: "comparison", label: "Comparison", icon: Scale, locked: true },
  { id: "risk", label: "Risk", icon: ShieldAlert, locked: true },
] as const;
type TabId = "commercial" | "technical";

/**
 * PRD FR-6 (first cut, P4): one vendor's proposal with Commercial / Technical tabs.
 * The analysis tabs are locked until P6; the custom paginated viewer replaces the browser
 * PDF viewer in P5 (HANDOFF I-14).
 */
export function ProposalWorkspace({ proposalId }: { proposalId: string }) {
  const project = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: p, isLoading, error } = useProposal(proposalId);
  const { data: all } = useProposals(project.id);

  const tab: TabId = params.get("tab") === "technical" ? "technical" : "commercial";
  const setQuery = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    router.replace(`${pathname}?${q}`, { scroll: false });
  };

  if (isLoading) return <WorkspaceSkeleton />;
  if (error || !p) {
    const notFound = error instanceof ApiClientError && error.status === 404;
    return (
      <EmptyState
        size="lg"
        art={<FileText className="size-12 text-ink-faint" strokeWidth={1.25} />}
        title={notFound ? "Proposal not found" : "Couldn't load this proposal"}
        description={
          notFound ? "It may have been withdrawn." : "Check your connection and try again."
        }
        actions={
          <Button asChild variant="secondary">
            <Link href={`/projects/${project.id}/proposals`}>
              <ArrowLeft /> All proposals
            </Link>
          </Button>
        }
      />
    );
  }

  const docs = tab === "commercial" ? p.commercialDocuments : p.technicalDocuments;
  const docId = params.get("doc");
  const doc = docs.find((d) => d.id === docId) ?? docs[0];

  // ‹ › vendor navigation in submission order
  const order = [...(all ?? [])].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const idx = order.findIndex((x) => x.id === p.id);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  const href = (id: string) => `/projects/${project.id}/proposals/${id}?tab=${tab}`;

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: project.code, href: `/projects/${project.id}/proposals` },
          { label: p.vendor.name },
        ]}
      />
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-center gap-4">
          <InitialsAvatar name={p.vendor.name} size="lg" />
          <div className="flex min-w-0 flex-col gap-1">
            <h2
              className="truncate font-heading text-lg font-semibold tracking-tight text-ink"
              dir="auto"
            >
              {p.vendor.name}
            </h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-muted">
              {p.vendor.country && <span>{p.vendor.country}</span>}
              <span className="tabular-nums">Submitted {formatDateTime(p.submittedAt)}</span>
              <Pill tone={p.source === "seed" ? "info" : "neutral"} size="sm">
                {PROPOSAL_SOURCE_LABEL[p.source]}
              </Pill>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {order.length > 1 && (
            <span className="me-1 text-xs text-ink-muted tabular-nums">
              Vendor {idx + 1} of {order.length}
            </span>
          )}
          <Button
            asChild={!!prev}
            variant="secondary"
            size="icon-sm"
            disabled={!prev}
            aria-label={prev ? `Previous vendor: ${prev.vendor.name}` : "No previous vendor"}
          >
            {prev ? (
              <Link href={href(prev.id)}>
                <ChevronLeft className="rtl:rotate-180" />
              </Link>
            ) : (
              <ChevronLeft className="rtl:rotate-180" />
            )}
          </Button>
          <Button
            asChild={!!next}
            variant="secondary"
            size="icon-sm"
            disabled={!next}
            aria-label={next ? `Next vendor: ${next.vendor.name}` : "No next vendor"}
          >
            {next ? (
              <Link href={href(next.id)}>
                <ChevronRight className="rtl:rotate-180" />
              </Link>
            ) : (
              <ChevronRight className="rtl:rotate-180" />
            )}
          </Button>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Proposal sections"
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto rounded-lg bg-surface-muted p-1 sm:w-fit"
      >
        {TABS.map((t) => {
          const active = t.id === tab;
          const locked = "locked" in t && t.locked;
          const btn = (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={locked || undefined}
              onClick={() => !locked && setQuery({ tab: t.id, doc: null })}
              className={cn(
                "relative flex h-8 shrink-0 items-center gap-2 rounded-md px-3 text-sm font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                active
                  ? "text-ink"
                  : locked
                    ? "cursor-not-allowed text-ink-faint"
                    : "text-ink-muted hover:text-ink",
              )}
            >
              {active && (
                <motion.span
                  layoutId="proposal-tab"
                  className="absolute inset-0 rounded-md bg-surface shadow-xs"
                  transition={{ type: "spring", stiffness: 480, damping: 38 }}
                />
              )}
              <span className="relative flex items-center gap-2">
                {locked ? (
                  <Lock className="size-3.5" aria-hidden />
                ) : (
                  <t.icon className="size-4" aria-hidden />
                )}
                {t.label}
              </span>
            </button>
          );
          return locked ? (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent>Unlocks after Analyse &amp; process</TooltipContent>
            </Tooltip>
          ) : (
            btn
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={tab}
          role="tabpanel"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col gap-4"
        >
          {docs.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
              <EmptyState
                art={<FileText className="size-10 text-ink-faint" strokeWidth={1.5} />}
                title={`No ${tab} proposal`}
                description={`${p.vendor.name} didn't submit a ${tab} file.`}
              />
            </div>
          ) : (
            <>
              {docs.length > 1 && (
                <div className="flex flex-wrap gap-2" role="list" aria-label={`${tab} files`}>
                  {docs.map((d) => (
                    <button
                      key={d.id}
                      type="button"
                      role="listitem"
                      onClick={() => setQuery({ doc: d.id })}
                      aria-current={d.id === doc?.id || undefined}
                      className={cn(
                        "flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                        d.id === doc?.id
                          ? "border-brand bg-brand-soft/40 text-brand-ink"
                          : "border-border bg-surface text-ink-2 hover:border-border-strong",
                      )}
                      dir="auto"
                    >
                      <FileText className="size-3.5" aria-hidden />
                      {middleTruncate(d.originalName, 40)}
                    </button>
                  ))}
                </div>
              )}
              {doc && <DocumentPane doc={doc} />}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function DocumentPane({ doc }: { doc: DocumentDto }) {
  const kind = fileKind(doc.originalName);
  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
      <div className="flex flex-wrap items-center gap-3 border-b border-border px-4 py-3">
        <FileIcon name={doc.originalName} />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate font-medium text-ink" dir="auto" title={doc.originalName}>
            {doc.originalName}
          </span>
          <span className="text-xs text-ink-muted tabular-nums">
            {formatBytes(doc.sizeBytes)}
            {doc.pageCount != null && ` · ${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}`}
          </span>
        </div>
        <Button asChild variant="ghost" size="sm">
          <a href={doc.url} target="_blank" rel="noreferrer">
            <ExternalLink /> Open
          </a>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <a href={`${doc.url}?download=1`}>
            <Download /> Download
          </a>
        </Button>
      </div>
      <div className="h-[max(560px,calc(100dvh-380px))] bg-sunken">
        {kind === "pdf" ? (
          <iframe
            key={doc.id}
            title={`${doc.originalName}`}
            src={doc.url}
            className="size-full border-0"
          />
        ) : kind === "image" ? (
          <div className="flex size-full items-center justify-center overflow-auto p-6">
            {/* eslint-disable-next-line @next/next/no-img-element -- user-uploaded file served by our API */}
            <img
              src={doc.url}
              alt={doc.originalName}
              className="max-h-full max-w-full rounded-md shadow-paper"
            />
          </div>
        ) : (
          <EmptyState
            art={<FileText className="size-10 text-ink-faint" strokeWidth={1.5} />}
            title="Preview arrives with the document viewer"
            description="Word, Excel and other formats get an in-app viewer in Phase 5. Download the file to open it now."
          />
        )}
      </div>
    </div>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-96 rounded-lg" />
      <Skeleton className="h-[560px] rounded-xl" />
    </div>
  );
}
