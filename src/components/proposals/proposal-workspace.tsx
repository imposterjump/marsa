"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ListChecks,
  Lock,
  Receipt,
  Scale,
  ShieldAlert,
} from "lucide-react";
import { cn } from "cn";
import { useProjectContext } from "@/components/projects/project-shell";
import { SetBreadcrumbs } from "@/components/shell/breadcrumbs";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DocumentCover } from "@/components/viewer/document-cover";
import { DocumentReader } from "@/components/viewer/document-reader";
import { ProposalResults, type AnalysisTab } from "./proposal-results";
import { useProposal, useProposals } from "@/hooks/use-proposals";
import { useLatestResultsRun } from "@/hooks/use-runs";
import { ApiClientError } from "@/lib/api-client";
import type { DocumentDto, ProposalDetailDto } from "@/lib/api-types";
import { formatBytes } from "@/lib/files";
import { formatDateTime } from "@/lib/format";
import { PROPOSAL_SOURCE_LABEL } from "@/lib/labels";

type Envelope = "commercial" | "technical";
const TABS = [
  { id: "commercial", label: "Commercial", icon: Receipt },
  { id: "technical", label: "Technical", icon: FileText },
  { id: "compliance", label: "Compliance", icon: ListChecks, analysis: true },
  { id: "comparison", label: "Comparison", icon: Scale, analysis: true },
  { id: "risk", label: "Risk", icon: ShieldAlert, analysis: true },
] as const;
const ANALYSIS_TABS: readonly string[] = ["compliance", "comparison", "risk"];
const ENVELOPE = {
  commercial: { title: "Financial proposal", note: "Envelope 2 · prices, terms and deviations" },
  technical: {
    title: "Technical proposal",
    note: "Envelope 1 · solution, compliance matrix, no prices",
  },
} as const;

const docsOf = (p: ProposalDetailDto, e: Envelope) =>
  e === "commercial" ? p.commercialDocuments : p.technicalDocuments;

/**
 * PRD FR-6: one vendor's proposal. Commercial / Technical open the full-screen reader directly
 * (user feedback 2026-10-21); the page underneath shows the envelope's documents as covers.
 * URL: ?tab=commercial|technical · &reader=<docId|1> (open) · &page=N · &q=<quote> (highlight,
 * RDD §8.4; evidence links use it). Compliance / Comparison / Risk unlock once a run has finished
 * and show the latest finished run (P6 basic view, P8 full results UX).
 */
export function ProposalWorkspace({ proposalId }: { proposalId: string }) {
  const project = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { data: p, isLoading, error } = useProposal(proposalId);
  const { data: all } = useProposals(project.id);
  const resultsRun = useLatestResultsRun(project.id);

  const tabParam = params.get("tab") ?? "";
  const analysisTab =
    resultsRun && ANALYSIS_TABS.includes(tabParam) ? (tabParam as AnalysisTab) : null;
  const tab: Envelope = tabParam === "technical" ? "technical" : "commercial";
  const activeTab: string = analysisTab ?? tab;
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

  const docs = docsOf(p, tab);
  const readerParam = params.get("reader");
  // The tender's RFP documents open in the same reader (requirement source links on the results).
  const allDocs = [...p.commercialDocuments, ...p.technicalDocuments, ...project.rfpDocuments];
  const readerDoc =
    readerParam === null
      ? null
      : (allDocs.find((d) => d.id === readerParam) ?? (analysisTab ? null : (docs[0] ?? null)));
  const readerPage = Math.max(1, Number(params.get("page")) || 1);
  const openReader = (envelope: Envelope, doc?: DocumentDto, page = 1) => {
    const target = doc ?? docsOf(p, envelope)[0];
    setQuery({
      tab: envelope,
      reader: target ? target.id : null,
      page: target && page > 1 ? String(page) : null,
      q: null,
    });
  };

  // ‹ › vendor navigation in submission order (keeps the current envelope).
  const order = [...(all ?? [])].sort((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  const idx = order.findIndex((x) => x.id === p.id);
  const prev = idx > 0 ? order[idx - 1] : null;
  const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : null;
  const href = (id: string) => `/projects/${project.id}/proposals/${id}?tab=${activeTab}`;

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
          <VendorNav
            to={prev && href(prev.id)}
            label={prev ? `Previous vendor: ${prev.vendor.name}` : "No previous vendor"}
          >
            <ChevronLeft className="rtl:rotate-180" />
          </VendorNav>
          <VendorNav
            to={next && href(next.id)}
            label={next ? `Next vendor: ${next.vendor.name}` : "No next vendor"}
          >
            <ChevronRight className="rtl:rotate-180" />
          </VendorNav>
        </div>
      </div>

      <div
        role="tablist"
        aria-label="Proposal sections"
        className="flex [scrollbar-width:none] gap-1 overflow-x-auto rounded-lg bg-surface-muted p-1 sm:w-fit"
      >
        {TABS.map((t) => {
          const active = t.id === activeTab;
          const locked = "analysis" in t && !resultsRun;
          const btn = (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-disabled={locked || undefined}
              onClick={() => {
                if (locked) return;
                if ("analysis" in t) setQuery({ tab: t.id, reader: null, page: null, q: null });
                else openReader(t.id as Envelope);
              }}
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
          return (
            <Tooltip key={t.id}>
              <TooltipTrigger asChild>{btn}</TooltipTrigger>
              <TooltipContent>
                {locked
                  ? "Unlocks after Analyse & process"
                  : "analysis" in t
                    ? `${t.label} results of the latest analysis`
                    : `Open the ${t.label.toLowerCase()} proposal`}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </div>

      <AnimatePresence mode="wait" initial={false}>
        {analysisTab && resultsRun ? (
          <motion.section
            key={analysisTab}
            role="tabpanel"
            aria-label={`${analysisTab} results`}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            <ProposalResults
              runId={resultsRun.id}
              proposalId={p.id}
              tab={analysisTab}
              onEvidence={(docId, page, quote) =>
                setQuery({
                  reader: docId,
                  page: page && page > 1 ? String(page) : null,
                  q: quote || null,
                })
              }
            />
          </motion.section>
        ) : (
          <motion.section
            key={tab}
            role="tabpanel"
            aria-label={ENVELOPE[tab].title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-4"
          >
            <div className="flex flex-col gap-0.5">
              <h3 className="font-heading text-base font-semibold tracking-tight text-ink">
                {ENVELOPE[tab].title}
              </h3>
              <p className="text-[13px] text-ink-muted">{ENVELOPE[tab].note}</p>
            </div>
            {docs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
                <EmptyState
                  art={<FileText className="size-10 text-ink-faint" strokeWidth={1.5} />}
                  title={`No ${tab} proposal`}
                  description={`${p.vendor.name} didn't submit a ${tab} file.`}
                />
              </div>
            ) : (
              <ul className="grid gap-5 xl:grid-cols-2">
                {docs.map((d) => (
                  <DocumentCard key={d.id} doc={d} onOpen={() => openReader(tab, d)} />
                ))}
              </ul>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      <DocumentReader
        open={!!readerDoc}
        onOpenChange={(o) => !o && setQuery({ reader: null, page: null, q: null })}
        leading={<InitialsAvatar name={p.vendor.name} size="sm" />}
        title={p.vendor.name}
        subtitle={`${project.code} · Submitted ${formatDateTime(p.submittedAt)}`}
        groups={[
          { id: "commercial", label: "Commercial", docs: p.commercialDocuments },
          { id: "technical", label: "Technical", docs: p.technicalDocuments },
          { id: "rfp", label: "RFP", docs: project.rfpDocuments },
        ]}
        docId={readerDoc?.id ?? null}
        quote={params.get("q")}
        page={readerPage}
        onNavigate={(docId, page) => {
          const envelope: Envelope = p.technicalDocuments.some((d) => d.id === docId)
            ? "technical"
            : "commercial";
          const isRfp = project.rfpDocuments.some((d) => d.id === docId);
          setQuery({
            tab: analysisTab ?? (isRfp ? tab : envelope),
            reader: docId,
            page: page > 1 ? String(page) : null,
            // The evidence quote belongs to its document; switching documents drops it.
            ...(docId !== readerDoc?.id ? { q: null } : {}),
          });
        }}
      />
    </div>
  );
}

function DocumentCard({ doc, onOpen }: { doc: DocumentDto; onOpen: () => void }) {
  return (
    <li className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 shadow-xs sm:flex-row sm:items-center sm:gap-7">
      <button
        type="button"
        onClick={onOpen}
        aria-label={`Open ${doc.originalName} in the reader`}
        className="self-center rounded-sm p-3 outline-none focus-visible:ring-3 focus-visible:ring-ring/30 sm:self-auto"
      >
        <DocumentCover doc={doc} width={150} />
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="truncate font-medium text-ink" dir="auto" title={doc.originalName}>
            {doc.originalName}
          </span>
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-ink-muted tabular-nums">
            {doc.pageCount != null && (
              <span>
                {doc.pageCount} page{doc.pageCount === 1 ? "" : "s"}
              </span>
            )}
            <span aria-hidden>·</span>
            <span>{formatBytes(doc.sizeBytes)}</span>
            {doc.aiReadable && (
              <Pill tone="ok" size="sm">
                AI-readable
              </Pill>
            )}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={onOpen}>
            <BookOpen /> Open reader
          </Button>
          <Button asChild variant="ghost">
            <a href={`${doc.url}?download=1`}>
              <Download /> Download
            </a>
          </Button>
        </div>
      </div>
    </li>
  );
}

function VendorNav({
  to,
  label,
  children,
}: {
  to: string | null;
  label: string;
  children: React.ReactNode;
}) {
  return to ? (
    <Button asChild variant="secondary" size="icon-sm" aria-label={label}>
      <Link href={to}>{children}</Link>
    </Button>
  ) : (
    <Button variant="secondary" size="icon-sm" disabled aria-label={label}>
      {children}
    </Button>
  );
}

export function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col gap-6" aria-busy>
      <Skeleton className="h-24 rounded-xl" />
      <Skeleton className="h-10 w-96 rounded-lg" />
      <Skeleton className="h-64 rounded-xl" />
    </div>
  );
}
