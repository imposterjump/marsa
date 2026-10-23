"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  Columns3,
  History,
  LayoutDashboard,
  ListChecks,
  Lock,
  Play,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import { RunQuality } from "@/components/ai-review/ai-review-view";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { MissionControl } from "@/components/evaluation/mission-control";
import { RunIcon, StepTimeline } from "@/components/evaluation/run-parts";
import { StartRunButton } from "@/components/evaluation/start-run-button";
import { useProjectContext } from "@/components/projects/project-shell";
import { SetBreadcrumbs } from "@/components/shell/breadcrumbs";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DocumentReader } from "@/components/viewer/document-reader";
import {
  isRunActive,
  useAnalysisResults,
  useInvalidateRun,
  useProjectRuns,
  useRunAction,
  useRunStatus,
} from "@/hooks/use-runs";
import type { AnalysisResultsDto, RunDto, RunStatusDto } from "@/lib/api-types";
import type { AiModel, RunStatus } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";
import { AI_MODEL_LABEL } from "@/lib/labels";
import { setSidebarCollapsed } from "@/lib/theme";
import { ComparisonTab } from "./comparison-tab";
import { ComplianceTab } from "./compliance-tab";
import { OverviewTab } from "./overview-tab";
import { RisksTab } from "./risks-tab";
import { vendorColors } from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";

const TABS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "compliance", label: "Compliance", icon: ListChecks },
  { id: "risks", label: "Risks", icon: ShieldAlert },
  { id: "comparison", label: "Comparison", icon: Columns3 },
  { id: "quality", label: "AI quality", icon: ClipboardCheck },
] as const;
type TabId = (typeof TABS)[number]["id"];

const RUN_TITLE: Record<RunStatus, string> = {
  queued: "Starting the analysis…",
  running: "Analysing proposals",
  completed: "Analysis complete",
  completed_with_errors: "Analysis complete, with errors",
  failed: "Analysis failed",
  cancelled: "Analysis cancelled",
  interrupted: "Analysis interrupted",
};

const modelText = (r: RunDto) =>
  r.mode === "mock" ? "Demo AI (free)" : `${AI_MODEL_LABEL[r.model as AiModel] ?? r.model} · $${r.costUsd.toFixed(2)}`;

/**
 * AI analysis results (P8, user's design): its own full-width page outside the project tabs, so
 * it can have tabs of its own. The sidebar collapses while it is open. A running analysis shows
 * mission control; a finished one Overview · Compliance · Risks · Comparison · AI quality.
 * URL: /analysis/<projectId>?run=<id>&tab=… · &reader=<docId>&page=N&q=<quote> (evidence).
 */
export function AnalysisPage() {
  const p = useProjectContext();
  const params = useSearchParams();
  const runs = useProjectRuns(p.id);
  useCollapsedSidebar();

  const runId = params.get("run");
  const selected = runs.data?.find((r) => r.id === runId) ?? runs.data?.[0] ?? null;

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        crumbs={[
          { label: "Projects", href: "/projects" },
          { label: p.code, href: `/projects/${p.id}` },
          { label: "AI analysis" },
        ]}
      />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href={`/projects/${p.id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-ink-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            <span className="font-mono">{p.code}</span>
            <span className="truncate" dir="auto">
              {p.name}
            </span>
          </Link>
          <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-tight text-ink">
            AI analysis results
          </h1>
          <span aria-hidden className="rta-rule w-16" />
        </div>
        {selected && <RunActions runs={runs.data ?? []} selected={selected} />}
      </header>

      {runs.isLoading ? (
        <Skeleton className="h-96 w-full rounded-xl" />
      ) : !selected ? (
        <NoRunYet />
      ) : (
        <RunArea key={selected.id} runId={selected.id} />
      )}
    </div>
  );
}

/** Collapse the sidebar while the page is open; give it back as it was on leaving. */
function useCollapsedSidebar() {
  useEffect(() => {
    const root = document.documentElement;
    const was = root.dataset.sidebar === "collapsed";
    if (!was) setSidebarCollapsed(true, false);
    return () => {
      if (!was && root.dataset.sidebar === "collapsed") setSidebarCollapsed(false, false);
    };
  }, []);
}

function NoRunYet() {
  const p = useProjectContext();
  const canRun = p.status === "open" || p.status === "evaluated";
  return (
    <div className={cn(card, "border-dashed")}>
      <EmptyState
        size="lg"
        art={
          p.proposalCount ? (
            <Sparkles className="size-12 text-brand" strokeWidth={1.25} />
          ) : (
            <Lock className="size-12 text-ink-faint" strokeWidth={1.25} />
          )
        }
        title={p.proposalCount ? "Not analysed yet" : "No vendors yet"}
        description={
          p.proposalCount
            ? `Marsa checks each of the ${p.proposalCount} vendor${p.proposalCount === 1 ? "" : "s"} against the standards and, separately, the RFP, section by section, then builds a risk register and recommends one.`
            : "Add at least one vendor with its proposal in the Proposals tab, then run the analysis."
        }
        actions={
          p.proposalCount && canRun ? (
            <StartRunButton projectId={p.id} />
          ) : (
            <Button asChild variant="secondary">
              <Link href={`/projects/${p.id}/proposals`}>Go to Proposals</Link>
            </Button>
          )
        }
      />
    </div>
  );
}

/** Earlier analyses (a menu) and "Run a new analysis", e.g. after adding a vendor. */
function RunActions({ runs, selected }: { runs: RunDto[]; selected: RunDto }) {
  const p = useProjectContext();
  const router = useRouter();
  const canRun = (p.status === "open" || p.status === "evaluated") && p.proposalCount > 0;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {runs.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <History /> {runs[0].id === selected.id ? "Latest analysis" : formatDateTime(selected.createdAt)}
              <ChevronDown className="text-ink-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-72">
            <DropdownMenuLabel>Analyses of this project</DropdownMenuLabel>
            {runs.map((r, i) => (
              <DropdownMenuItem
                key={r.id}
                onSelect={() => router.push(`/analysis/${p.id}${i === 0 ? "" : `?run=${r.id}`}`)}
                className={cn(r.id === selected.id && "bg-surface-muted")}
              >
                <RunIcon status={r.status} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm text-ink">
                    {formatDateTime(r.createdAt)}
                    {i === 0 && <span className="text-ink-muted"> · latest</span>}
                  </span>
                  <span className="text-xs text-ink-muted">{modelText(r)}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canRun && !isRunActive(runs[0]?.status) && <StartRunButton projectId={p.id} again size="default" />}
    </div>
  );
}

function RunArea({ runId }: { runId: string }) {
  const p = useProjectContext();
  const reduce = useReducedMotion();
  const { data, isLoading } = useRunStatus(runId);
  const status = data?.run.status;
  const active = isRunActive(status);
  const finished = status === "completed" || status === "completed_with_errors";
  const results = useAnalysisResults(runId, finished);
  const invalidate = useInvalidateRun(p.id);

  // Leaving the active states: refresh the project (status pill, locks) and this run's data.
  const prev = useRef(status);
  useEffect(() => {
    if (prev.current && isRunActive(prev.current) && status && !isRunActive(status)) {
      void invalidate(runId);
    }
    prev.current = status;
  }, [status, runId, invalidate]);

  if (isLoading || !data) return <Skeleton className="h-96 w-full rounded-xl" />;

  return (
    <AnimatePresence mode="wait" initial={false}>
      {active ? (
        <motion.div
          key="live"
          // Curtain lift: mission control rolls up and uncovers the results.
          exit={
            reduce
              ? { opacity: 0, transition: { duration: 0.15 } }
              : { clipPath: "inset(0 0 100% 0)", transition: { duration: 0.7, ease: EASE_OUT_QUINT } }
          }
          style={{ clipPath: "inset(0 0 0% 0)" }}
        >
          <MissionControl data={data} />
        </motion.div>
      ) : (
        <motion.div
          key="done"
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? 0.15 : 0.55, ease: EASE_OUT_QUINT }}
          className="flex flex-col gap-6"
        >
          <RunBar data={data} />
          {finished ? (
            results.data ? (
              <Results d={results.data} />
            ) : results.isError ? (
              <p role="alert" className="text-sm text-fail">
                Couldn&apos;t load the results. Reload the page to try again.
              </p>
            ) : (
              <Skeleton className="h-96 w-full rounded-xl" />
            )
          ) : (
            <StepTimeline data={data} defaultOpen />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** One line about the run: when, which model, cost, steps; Resume and the error note if any. */
function RunBar({ data }: { data: RunStatusDto }) {
  const p = useProjectContext();
  const action = useRunAction(p.id);
  const { run } = data;
  const failed = data.steps.filter((s) => s.status === "failed");

  const resume = async () => {
    try {
      await action.mutateAsync({ runId: run.id, action: "resume" });
      toast.success("Analysis resumed");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Something went wrong.");
    }
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink-muted">
        <span className="inline-flex items-center gap-1.5 font-medium text-ink">
          <RunIcon status={run.status} /> {RUN_TITLE[run.status]}
        </span>
        <span aria-hidden>·</span>
        <span>{formatDateTime(run.startedAt ?? run.createdAt)}</span>
        <span aria-hidden>·</span>
        <span>{modelText(run)}</span>
        <span aria-hidden>·</span>
        <span className="tabular-nums">
          {run.doneSteps} of {run.totalSteps} steps
        </span>
        {(run.status === "interrupted" || run.status === "cancelled") && (
          <Button size="sm" onClick={() => void resume()} disabled={action.isPending} className="ms-auto">
            <Play /> Resume
          </Button>
        )}
      </div>
      {(run.status === "completed_with_errors" || run.status === "failed") && (
        <div role="alert" className="flex items-start gap-3 rounded-lg bg-partial-soft p-4 text-[13px] text-ink-2">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-partial" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-ink">
              {failed.length
                ? `${failed.length} step${failed.length === 1 ? "" : "s"} failed`
                : "The analysis stopped early"}
            </span>
            <span>
              {run.status === "completed_with_errors"
                ? "The results leave out what those steps would have added. Retry them under AI quality → Steps; finished steps are not re-run."
                : (run.error ?? "Retry the failed step in the step list.")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ d }: { d: AnalysisResultsDto }) {
  const p = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const colors = useMemo(() => vendorColors(d.vendors), [d.vendors]);
  const { data: status } = useRunStatus(d.run.id);

  const tabParam = params.get("tab");
  const tab: TabId = TABS.some((t) => t.id === tabParam) ? (tabParam as TabId) : "overview";
  const setQuery = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // Evidence and clause links open the reader: the vendor's two envelopes plus the RFP.
  const readerId = params.get("reader");
  const owner = readerId
    ? d.vendors.find((v) => [...v.commercialDocuments, ...v.technicalDocuments].some((x) => x.id === readerId))
    : undefined;
  const groups = [
    ...(owner
      ? [
          { id: "commercial", label: "Commercial", docs: owner.commercialDocuments },
          { id: "technical", label: "Technical", docs: owner.technicalDocuments },
        ]
      : []),
    { id: "rfp", label: "RFP", docs: p.rfpDocuments },
  ];
  const readerOpen = !!readerId && groups.some((g) => g.docs.some((x) => x.id === readerId));
  const onEvidence = (docId: string, page: number | null, quote: string) =>
    setQuery({ reader: docId, page: page && page > 1 ? String(page) : null, q: quote || null });

  return (
    <>
      <Tabs value={tab} onValueChange={(v) => setQuery({ tab: v === "overview" ? null : v })} className="gap-6">
        <TabsList variant="line" className="w-full justify-start overflow-x-auto border-b border-border">
          {TABS.map((t) => (
            <TabsTrigger key={t.id} value={t.id}>
              <t.icon aria-hidden /> {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab d={d} colors={colors} />
        </TabsContent>
        <TabsContent value="compliance">
          <ComplianceTab d={d} colors={colors} onEvidence={onEvidence} />
        </TabsContent>
        <TabsContent value="risks">
          <RisksTab d={d} colors={colors} />
        </TabsContent>
        <TabsContent value="comparison">
          <ComparisonTab d={d} colors={colors} onEvidence={onEvidence} />
        </TabsContent>
        <TabsContent value="quality" className="flex flex-col gap-6">
          <RunQuality runId={d.run.id} />
          {status && <StepTimeline data={status} defaultOpen={false} />}
        </TabsContent>
      </Tabs>

      <DocumentReader
        open={readerOpen}
        onOpenChange={(o) => !o && setQuery({ reader: null, page: null, q: null })}
        title={owner ? owner.vendor.name : `${p.code} · RFP`}
        subtitle={owner ? `${p.code} · proposal` : p.name}
        groups={groups}
        docId={readerOpen ? readerId : null}
        quote={params.get("q")}
        page={Math.max(1, Number(params.get("page")) || 1)}
        onNavigate={(docId, page) =>
          setQuery({
            reader: docId,
            page: page > 1 ? String(page) : null,
            // The evidence quote belongs to its document; switching documents drops it.
            ...(docId !== readerId ? { q: null } : {}),
          })
        }
      />
    </>
  );
}
