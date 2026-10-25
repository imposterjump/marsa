"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  Calculator,
  ChevronDown,
  CircleAlert,
  ClipboardCheck,
  FileText,
  Columns3,
  History,
  Languages,
  LayoutDashboard,
  Lock,
  Play,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import { RunQuality } from "@/components/ai-review/ai-review-view";
import { type T, useT } from "@/components/i18n-provider";
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
import { useBoqComparison } from "@/hooks/use-boq";
import {
  isRunActive,
  useAnalysisResults,
  useInvalidateRun,
  useProjectRuns,
  useRunAction,
  useRunStatus,
} from "@/hooks/use-runs";
import type { AnalysisResultsDto, RunDto, RunStatusDto } from "@/lib/api-types";
import type { AiModel, ProposalSection, RunStatus } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { AI_MODEL_LABEL } from "@/lib/labels";
import { setSidebarCollapsed } from "@/lib/theme";
import { ComparisonTab } from "./comparison-tab";
import { type ComplianceFocus, ComplianceTab } from "./compliance-tab";
import { OverviewTab } from "./overview-tab";
import { ReportsTab } from "./reports-tab";
import type { ComplianceView } from "./point-list";
import { PricesTab } from "./prices-tab";
import { RisksTab } from "./risks-tab";
import { type OpenEvidence, type Scope, vendorColors } from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";

// RFP and Standards are separate tabs (user, 2026-10-23: "remove the compliances tab and replace
// them with rfp and standards each one has its own tab").
const TABS = [
  { id: "overview", label: msg("Overview"), icon: LayoutDashboard },
  { id: "rfp", label: msg("RFP"), icon: FileText },
  { id: "standards", label: msg("Standards"), icon: ShieldCheck },
  { id: "risks", label: msg("Risks"), icon: ShieldAlert },
  { id: "comparison", label: msg("Comparison"), icon: Columns3 },
  // Building works only (2026-10-25): shown when the tender has an Excel bill of quantities.
  { id: "prices", label: msg("Prices"), icon: Calculator },
  { id: "reports", label: msg("Reports"), icon: ScrollText },
  { id: "quality", label: msg("AI quality"), icon: ClipboardCheck },
] as const;
type TabId = (typeof TABS)[number]["id"];

const RUN_TITLE: Record<RunStatus, string> = {
  queued: msg("Starting the analysis…"),
  running: msg("Analysing proposals"),
  completed: msg("Analysis complete"),
  completed_with_errors: msg("Analysis complete, with errors"),
  failed: msg("Analysis failed"),
  cancelled: msg("Analysis cancelled"),
  interrupted: msg("Analysis interrupted"),
};

// No prices on screen (user, 2026-10-25): the client never sees what a run cost.
const modelText = (r: RunDto, t: T) =>
  r.mode === "mock" ? t("Demo AI") : (AI_MODEL_LABEL[r.model as AiModel] ?? r.model);

const isFinished = (s: RunStatus) => s === "completed" || s === "completed_with_errors";
/** Runs that stopped before giving results; they never hide the results before them. */
const STOPPED: RunStatus[] = ["cancelled", "interrupted", "failed"];

/**
 * AI analysis results (P8, user's design): its own full-width page outside the project tabs, so
 * it can have tabs of its own. The sidebar collapses while it is open. A running analysis shows
 * mission control; a finished one Overview · Compliance · Risks · Comparison · AI quality.
 * URL: /analysis/<projectId>?run=<id>&tab=… · &reader=<docId>&page=N&q=<quote> (evidence)
 * · &v=<proposalId> (whose finding opened the RFP, so the reader keeps that vendor's envelopes).
 */
export function AnalysisPage() {
  const t = useT();
  const p = useProjectContext();
  const params = useSearchParams();
  const runs = useProjectRuns(p.id);
  useCollapsedSidebar();

  const runId = params.get("run");
  const all = runs.data ?? [];
  const latest = all[0] ?? null;
  const lastFinished = all.find((r) => isFinished(r.status)) ?? null;
  // A run stopped before it finished doesn't hide the results before it (user, 2026-10-25: "if i
  // started by mistake and cancled i dont have to lose the previous evaluation"): with no run in
  // the URL, the page opens on the latest finished analysis and says a newer one was stopped.
  const stopped =
    !runId && latest && STOPPED.includes(latest.status) && lastFinished ? latest : null;
  const selected = all.find((r) => r.id === runId) ?? (stopped ? lastFinished : latest);

  return (
    <div className="flex flex-col gap-6">
      <SetBreadcrumbs
        crumbs={[
          { label: t("Projects"), href: "/projects" },
          { label: p.code, href: `/projects/${p.id}` },
          { label: t("AI analysis") },
        ]}
      />
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <Link
            href={`/projects/${p.id}`}
            className="inline-flex w-fit items-center gap-1.5 rounded-sm text-[13px] text-ink-muted transition-colors outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            <ArrowLeft className="size-3.5 rtl:rotate-180" aria-hidden />
            <span className="shrink-0 font-mono whitespace-nowrap">{p.code}</span>
            <span className="truncate" dir="auto">
              {p.name}
            </span>
          </Link>
          <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-tight text-ink">
            {t("AI analysis results")}
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
        <>
          {stopped && <StoppedNotice run={stopped} />}
          <RunArea key={selected.id} runId={selected.id} />
        </>
      )}
    </div>
  );
}

/** Above the previous results: the newer run that was stopped, with Resume and a link to it. */
function StoppedNotice({ run }: { run: RunDto }) {
  const t = useT();
  const p = useProjectContext();
  const router = useRouter();
  const action = useRunAction(p.id);
  const resumable = run.status === "cancelled" || run.status === "interrupted";
  const resume = async () => {
    try {
      await action.mutateAsync({ runId: run.id, action: "resume" });
      toast.success(t("Analysis resumed"));
      router.push(`/analysis/${p.id}?run=${run.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Something went wrong."));
    }
  };
  return (
    <div
      role="status"
      aria-label={t("A newer analysis was stopped")}
      className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border border-border bg-surface px-5 py-3.5 text-[13px] text-ink-2 shadow-xs"
    >
      <RunIcon status={run.status} />
      <span className="min-w-0 flex-1">
        <span className="font-medium text-ink">{t(RUN_TITLE[run.status])}.</span>{" "}
        {t(
          "The newer analysis of {date} stopped before it finished, so these are the results of the previous analysis.",
          { date: t.dateTime(run.startedAt ?? run.createdAt) },
        )}
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Button variant="ghost" size="sm" asChild>
          <Link href={`/analysis/${p.id}?run=${run.id}`}>{t("Open it")}</Link>
        </Button>
        {resumable && (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => void resume()}
            disabled={action.isPending}
          >
            <Play /> {t("Resume it")}
          </Button>
        )}
      </span>
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
  const t = useT();
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
        title={p.proposalCount ? t("Not analysed yet") : t("No vendors yet")}
        description={
          p.proposalCount
            ? t.plural(
                p.proposalCount,
                "{app} checks each of the {n} vendor against the standards and, separately, the RFP, section by section, then builds a risk register and recommends one.",
                "{app} checks each of the {n} vendors against the standards and, separately, the RFP, section by section, then builds a risk register and recommends one.",
                { app: t.appName },
              )
            : t(
                "Add at least one vendor with its proposal in the Proposals tab, then run the analysis.",
              )
        }
        actions={
          p.proposalCount && canRun ? (
            <StartRunButton projectId={p.id} />
          ) : (
            <Button asChild variant="secondary">
              <Link href={`/projects/${p.id}/proposals`}>{t("Go to Proposals")}</Link>
            </Button>
          )
        }
      />
    </div>
  );
}

/** Earlier analyses (a menu) and "Run a new analysis", e.g. after adding a vendor. */
function RunActions({ runs, selected }: { runs: RunDto[]; selected: RunDto }) {
  const t = useT();
  const p = useProjectContext();
  const router = useRouter();
  const canRun = (p.status === "open" || p.status === "evaluated") && p.proposalCount > 0;
  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2">
      {runs.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">
              <History />{" "}
              {runs[0].id === selected.id ? t("Latest analysis") : t.dateTime(selected.createdAt)}
              <ChevronDown className="text-ink-muted" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-72">
            <DropdownMenuLabel>{t("Analyses of this project")}</DropdownMenuLabel>
            {runs.map((r, i) => (
              <DropdownMenuItem
                key={r.id}
                onSelect={() => router.push(`/analysis/${p.id}${i === 0 ? "" : `?run=${r.id}`}`)}
                className={cn(r.id === selected.id && "bg-surface-muted")}
              >
                <RunIcon status={r.status} />
                <span className="flex min-w-0 flex-col">
                  <span className="text-sm text-ink">
                    {t.dateTime(r.createdAt)}
                    {i === 0 && <span className="text-ink-muted"> · {t("latest")}</span>}
                  </span>
                  <span className="text-xs text-ink-muted">{modelText(r, t)}</span>
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      {canRun && !isRunActive(runs[0]?.status) && (
        <StartRunButton projectId={p.id} again size="default" />
      )}
    </div>
  );
}

function RunArea({ runId }: { runId: string }) {
  const t = useT();
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
              : {
                  clipPath: "inset(0 0 100% 0)",
                  transition: { duration: 0.7, ease: EASE_OUT_QUINT },
                }
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
              <>
                <TextLanguageNote d={results.data} />
                <Results d={results.data} />
              </>
            ) : results.isError ? (
              <p role="alert" className="text-sm text-fail">
                {t("Couldn't load the results. Reload the page to try again.")}
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

/**
 * When the AI's texts are not in the screen's language: a run from the demo AI (which can't
 * translate) or one from before the Translator (2026-10-25) that was not translated afterwards.
 */
function TextLanguageNote({ d }: { d: AnalysisResultsDto }) {
  const t = useT();
  if (d.textLanguage === t.locale) return null;
  return (
    <p
      role="note"
      className="flex items-center gap-2 rounded-lg border border-border bg-surface-muted/60 px-3 py-2 text-[13px] text-ink-muted"
    >
      <Languages className="size-4 shrink-0" aria-hidden />
      {d.textLanguage === "en"
        ? t("The AI's text in this analysis is in English: it has no Arabic version yet.")
        : t("The AI's text in this analysis is in Arabic: it has no English version yet.")}
    </p>
  );
}

/** One line about the run: status, when, which model and cost, steps (+ an action, e.g. Resume). */
function RunSummary({ run, children }: { run: RunDto; children?: React.ReactNode }) {
  const t = useT();
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-ink-muted">
      <span className="inline-flex items-center gap-1.5 font-medium text-ink">
        <RunIcon status={run.status} /> {t(RUN_TITLE[run.status])}
      </span>
      <span aria-hidden>·</span>
      <span>{t.dateTime(run.startedAt ?? run.createdAt)}</span>
      <span aria-hidden>·</span>
      <span>{modelText(run, t)}</span>
      <span aria-hidden>·</span>
      <span className="tabular-nums">
        {t.plural(run.totalSteps, "{done} of {n} steps", "{done} of {n} steps", {
          done: run.doneSteps,
        })}
      </span>
      {children}
    </div>
  );
}

/**
 * Above the results: only what needs attention. A finished run's summary line lives in the
 * AI quality tab (user, 2026-10-25: "its taking so many space for nothing"); a stopped or failed
 * run has no tabs, so it keeps the line here with Resume and the error note.
 */
function RunBar({ data }: { data: RunStatusDto }) {
  const t = useT();
  const p = useProjectContext();
  const action = useRunAction(p.id);
  const { data: runs } = useProjectRuns(p.id);
  const { run } = data;
  // A stopped run opened on purpose: the way back to the results it didn't replace.
  const previous = runs?.find(
    (r) => r.id !== run.id && isFinished(r.status) && r.createdAt < run.createdAt,
  );
  const failed = data.steps.filter((s) => s.status === "failed");
  const finished = run.status === "completed" || run.status === "completed_with_errors";

  const resume = async () => {
    try {
      await action.mutateAsync({ runId: run.id, action: "resume" });
      toast.success(t("Analysis resumed"));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Something went wrong."));
    }
  };

  if (run.status === "completed") return null;
  return (
    <div className="flex flex-col gap-3">
      {!finished && (
        <RunSummary run={run}>
          <span className="ms-auto flex items-center gap-2">
            {previous && STOPPED.includes(run.status) && (
              <Button variant="secondary" size="sm" asChild>
                <Link href={`/analysis/${p.id}?run=${previous.id}`}>
                  {t("Show the previous results")}
                </Link>
              </Button>
            )}
            {(run.status === "interrupted" || run.status === "cancelled") && (
              <Button size="sm" onClick={() => void resume()} disabled={action.isPending}>
                <Play /> {t("Resume")}
              </Button>
            )}
          </span>
        </RunSummary>
      )}
      {/* Why it stopped (2026-10-26): credit, rate limit, connection, a held check, a restart. */}
      {run.status === "interrupted" && run.error && (
        <p
          role="status"
          className="flex items-start gap-3 rounded-lg bg-partial-soft p-4 text-[13px] text-ink-2"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-partial" aria-hidden />
          <span>{t.auto(run.error)}</span>
        </p>
      )}
      {(run.status === "completed_with_errors" || run.status === "failed") && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg bg-partial-soft p-4 text-[13px] text-ink-2"
        >
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-partial" aria-hidden />
          <div className="flex flex-col gap-1">
            <span className="font-medium text-ink">
              {failed.length
                ? t.plural(failed.length, "{n} step failed", "{n} steps failed")
                : t("The analysis stopped early")}
            </span>
            <span>
              {run.status === "completed_with_errors"
                ? t(
                    "The results leave out what those steps would have added. Retry them under AI quality → Steps; finished steps are not re-run.",
                  )
                : run.error != null
                  ? t.auto(run.error)
                  : t("Retry the failed step in the step list.")}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

function Results({ d }: { d: AnalysisResultsDto }) {
  const t = useT();
  const p = useProjectContext();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const colors = useMemo(() => vendorColors(d.vendors), [d.vendors]);
  const { data: status } = useRunStatus(d.run.id);

  // A risk's "see its points": switch to the RFP or Standards tab, scroll to and pulse the section.
  const [focus, setFocus] = useState<ComplianceFocus | null>(null);

  // The price comparison of the bids in this analysis; null when the tender has no Excel bill of
  // quantities, and then there is no Prices tab.
  const boq = useBoqComparison(p.id, d.run.id);
  const prices = boq.data ?? null;

  // Old links said ?tab=compliance: that is the RFP tab now. No standards applied: no Standards tab.
  const tabs = TABS.filter(
    (x) => (x.id !== "standards" || d.hasStandards) && (x.id !== "prices" || !!prices),
  );
  const tabParam = params.get("tab") === "compliance" ? "rfp" : params.get("tab");
  // ?tab=prices waits for the price comparison instead of falling back to the overview.
  const pricesPending = tabParam === "prices" && boq.isPending;
  const tab: TabId = pricesPending
    ? "prices"
    : tabs.some((x) => x.id === tabParam)
      ? (tabParam as TabId)
      : "overview";
  const setQuery = (next: Record<string, string | null>) => {
    const q = new URLSearchParams(params);
    for (const [k, v] of Object.entries(next)) {
      if (v === null) q.delete(k);
      else q.set(k, v);
    }
    const s = q.toString();
    router.replace(s ? `${pathname}?${s}` : pathname, { scroll: false });
  };

  // RFP / Standards / Risks: the view lives in the URL (?view=list), shared by the three tabs.
  const view: ComplianceView = params.get("view") === "list" ? "list" : "sections";
  const onView = (v: ComplianceView) => setQuery({ view: v === "list" ? v : null });

  // Evidence and clause links open the reader: the vendor's two envelopes plus the RFP.
  const readerId = params.get("reader");
  const owner = readerId
    ? (d.vendors.find((v) =>
        [...v.commercialDocuments, ...v.technicalDocuments].some((x) => x.id === readerId),
      ) ?? d.vendors.find((v) => v.proposalId === params.get("v")))
    : undefined;
  const groups = [
    ...(owner
      ? [
          { id: "commercial", label: t("Commercial"), docs: owner.commercialDocuments },
          { id: "technical", label: t("Technical"), docs: owner.technicalDocuments },
        ]
      : []),
    { id: "rfp", label: t("RFP"), docs: p.rfpDocuments },
  ];
  const readerOpen = !!readerId && groups.some((g) => g.docs.some((x) => x.id === readerId));
  const onSection = (section: ProposalSection | null, scope?: Scope, proposalId?: string) => {
    const has = (s: Scope) => d.requirements.some((r) => r.section === section && r.scope === s);
    const target: Scope = scope ?? (has("rfp") || !has("standard") ? "rfp" : "standard");
    setFocus({ section, scope: target, proposalId, at: Date.now() });
    // The section lives in the section view.
    setQuery({ tab: target === "standard" && d.hasStandards ? "standards" : "rfp", view: null });
  };
  const onEvidence: OpenEvidence = (docId, page, quote, vendorId) =>
    setQuery({
      reader: docId,
      page: page && page > 1 ? String(page) : null,
      q: quote || null,
      v: vendorId ?? null,
    });

  return (
    <>
      <Tabs
        value={tab}
        onValueChange={(v) => setQuery({ tab: v === "overview" ? null : v })}
        className="gap-6"
      >
        <TabsList
          variant="line"
          className="w-full justify-start overflow-x-auto border-b border-border"
        >
          {tabs.map((x) => (
            <TabsTrigger key={x.id} value={x.id}>
              <x.icon aria-hidden /> {t(x.label)}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="overview">
          <OverviewTab
            d={d}
            colors={colors}
            onOpen={(target) => {
              // A section title on the Overview opens its tab from the top (the shell's panel
              // scrolls on desktop, the window on phones).
              setQuery({ tab: target });
              window.scrollTo({ top: 0 });
              document.getElementById("app-scroll")?.scrollTo({ top: 0 });
            }}
          />
        </TabsContent>
        <TabsContent value="rfp">
          <ComplianceTab
            key={focus?.at ?? 0}
            scope="rfp"
            d={d}
            colors={colors}
            onEvidence={onEvidence}
            focus={focus}
            view={view}
            onView={onView}
          />
        </TabsContent>
        {d.hasStandards && (
          <TabsContent value="standards">
            <ComplianceTab
              key={focus?.at ?? 0}
              scope="standard"
              d={d}
              colors={colors}
              onEvidence={onEvidence}
              focus={focus}
              view={view}
              onView={onView}
            />
          </TabsContent>
        )}
        <TabsContent value="risks">
          <RisksTab
            d={d}
            colors={colors}
            onEvidence={onEvidence}
            onSection={onSection}
            view={view}
            onView={onView}
          />
        </TabsContent>
        <TabsContent value="comparison">
          <ComparisonTab d={d} colors={colors} onEvidence={onEvidence} />
        </TabsContent>
        {(prices || pricesPending) && (
          <TabsContent value="prices">
            {prices ? (
              <PricesTab c={prices} colors={colors} />
            ) : (
              <Skeleton className="h-96 w-full rounded-xl" />
            )}
          </TabsContent>
        )}
        <TabsContent value="reports">
          <ReportsTab d={d} colors={colors} />
        </TabsContent>
        <TabsContent value="quality" className="flex flex-col gap-6">
          {status && <RunSummary run={status.run} />}
          <RunQuality runId={d.run.id} />
          {status && <StepTimeline data={status} defaultOpen={false} />}
        </TabsContent>
      </Tabs>

      <DocumentReader
        open={readerOpen}
        onOpenChange={(o) => !o && setQuery({ reader: null, page: null, q: null, v: null })}
        title={owner ? owner.vendor.name : t("{code} · RFP", { code: p.code })}
        subtitle={owner ? t("{code} · proposal", { code: p.code }) : p.name}
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
