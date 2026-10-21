"use client";

import { BookOpen, CircleAlert, Quote } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingStatusPill, Pill, PriorityPill, RiskPill } from "@/components/ui/status-pill";
import { useProposalResult } from "@/hooks/use-runs";
import type { FindingDto, ProposalResultDto, RequirementDto } from "@/lib/api-types";
import { FINDING_STATUSES, type FindingStatus } from "@/lib/domain";
import { FINDING_STATUS_LABEL } from "@/lib/labels";

export type AnalysisTab = "compliance" | "comparison" | "risk";

const card = "rounded-xl border border-border bg-surface shadow-xs";

/**
 * One vendor's analysis results (P6 basic view; P8 designs the full results UX): numbered
 * findings per status with evidence links into the reader, the comparison, and the risk register.
 */
export function ProposalResults({
  runId,
  proposalId,
  tab,
  onEvidence,
}: {
  runId: string;
  proposalId: string;
  tab: AnalysisTab;
  /** Open the reader at the quoted sentence. */
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  const { data, isLoading } = useProposalResult(runId, proposalId);
  if (isLoading) return <Skeleton className="h-64 w-full rounded-xl" />;
  if (!data?.evaluation) {
    return (
      <div className={cn(card, "border-dashed")}>
        <EmptyState
          art={<CircleAlert className="size-10 text-ink-faint" strokeWidth={1.5} />}
          title="No analysis for this vendor"
          description="Its analysis step failed or was skipped. Retry it from the Evaluation tab."
        />
      </div>
    );
  }
  if (tab === "compliance") return <Compliance data={data} onEvidence={onEvidence} />;
  if (tab === "comparison") return <Comparison data={data} />;
  return <Risks data={data} />;
}

function Compliance({
  data,
  onEvidence,
}: {
  data: ProposalResultDto;
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  const ev = data.evaluation!;
  const reqs = new Map(data.requirements.map((r) => [r.id, r]));
  const groups = FINDING_STATUSES.map((s) => ({
    status: s,
    items: data.findings.filter((f) => f.status === s),
  }));
  return (
    <div className="flex flex-col gap-5">
      <section className={cn(card, "flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:gap-8")}>
        <div className="flex flex-col">
          <span className="font-heading text-4xl font-semibold tracking-tight text-ink tabular-nums">
            {ev.scorePct}%
          </span>
          <span className="text-xs text-ink-muted">weighted compliance</span>
        </div>
        <ul className="flex flex-wrap gap-2" aria-label="Findings by status">
          {groups.map((g) => (
            <li key={g.status}>
              <FindingStatusPill
                status={g.status}
                label={`${g.items.length} ${FINDING_STATUS_LABEL[g.status].toLowerCase()}`}
              />
            </li>
          ))}
          {ev.mandatoryFailures > 0 && (
            <li>
              <Pill tone="fail">{ev.mandatoryFailures} mandatory not met</Pill>
            </li>
          )}
        </ul>
        {ev.summary && (
          <p className="text-[13px] leading-relaxed text-ink-2 sm:flex-1">{ev.summary}</p>
        )}
      </section>

      {groups.map(
        (g) =>
          g.items.length > 0 && (
            <section key={g.status} aria-labelledby={`grp-${g.status}`} className={cn(card, "p-5")}>
              <h3
                id={`grp-${g.status}`}
                className="mb-3 flex items-center gap-2 text-sm font-semibold text-ink"
              >
                <FindingStatusPill status={g.status} size="sm" />
                <span className="text-ink-muted tabular-nums">{g.items.length}</span>
              </h3>
              <ol className="flex flex-col divide-y divide-border/60">
                {g.items.map((f, i) => (
                  <FindingRow
                    key={f.id}
                    n={i + 1}
                    f={f}
                    req={reqs.get(f.requirementId)}
                    status={g.status}
                    onEvidence={onEvidence}
                  />
                ))}
              </ol>
            </section>
          ),
      )}
    </div>
  );
}

function FindingRow({
  n,
  f,
  req,
  status,
  onEvidence,
}: {
  n: number;
  f: FindingDto;
  req?: RequirementDto;
  status: FindingStatus;
  onEvidence: (docId: string, page: number | null, quote: string) => void;
}) {
  return (
    <li className="flex gap-3 py-3 text-[13px]">
      <span className="w-6 shrink-0 text-end font-semibold text-ink-muted tabular-nums">{n}.</span>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-xs text-ink-muted">{f.code}</span>
          <span className="font-medium text-ink">{req?.title ?? f.code}</span>
          {req && <PriorityPill priority={req.priority} size="sm" short />}
          {req?.sourceRef && <span className="text-xs text-ink-faint">{req.sourceRef}</span>}
        </div>
        {f.assessment && <p className="leading-relaxed text-ink-2">{f.assessment}</p>}
        {f.gap && status !== "compliant" && (
          <p className="leading-relaxed text-ink-2">
            <span className="font-medium text-ink">Gap: </span>
            {f.gap}
          </p>
        )}
        {f.evidenceQuote && (
          <div className="flex flex-wrap items-start gap-2 rounded-md bg-surface-muted/70 px-3 py-2">
            <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
            <q className="min-w-0 flex-1 text-ink-2 italic" dir="auto">
              {f.evidenceQuote}
            </q>
            {f.evidenceDocId && (
              <Button
                size="xs"
                variant="ghost"
                onClick={() => onEvidence(f.evidenceDocId!, f.evidencePage, f.evidenceQuote!)}
              >
                <BookOpen /> {f.evidencePage ? `Page ${f.evidencePage}` : "Open"}
              </Button>
            )}
          </div>
        )}
      </div>
    </li>
  );
}

function Comparison({ data }: { data: ProposalResultDto }) {
  const c = data.comparison;
  if (!c) {
    return (
      <div className={cn(card, "border-dashed")}>
        <EmptyState
          art={<CircleAlert className="size-10 text-ink-faint" strokeWidth={1.5} />}
          title="No comparison"
          description="The comparison needs at least two analysed proposals."
        />
      </div>
    );
  }
  const PRICE = {
    lowest: "Lowest price",
    mid: "Mid-range price",
    highest: "Highest price",
    unknown: "Price not comparable",
  };
  return (
    <div className="flex flex-col gap-5">
      <section className={cn(card, "flex flex-col gap-2 p-5")}>
        <Pill
          tone={
            c.pricePosition === "lowest"
              ? "ok"
              : c.pricePosition === "highest"
                ? "partial"
                : "neutral"
          }
          className="w-fit"
        >
          {PRICE[c.pricePosition]}
        </Pill>
        <p className="text-[13px] leading-relaxed text-ink-2">{c.positionStatement}</p>
      </section>
      <div className="grid gap-5 lg:grid-cols-2">
        <PointList
          title="Advantages"
          items={c.advantages.map((a) => ({ point: a.point, who: a.versus, prefix: "vs" }))}
        />
        <PointList
          title="Disadvantages"
          items={c.disadvantages.map((d) => ({
            point: d.point,
            who: d.betterVendors,
            prefix: "better:",
          }))}
        />
      </div>
      {c.uniqueOffers.length > 0 && (
        <PointList
          title="Unique offers"
          items={c.uniqueOffers.map((u) => ({ point: u, who: [], prefix: "" }))}
        />
      )}
    </div>
  );
}

function PointList({
  title,
  items,
}: {
  title: string;
  items: { point: string; who: string[]; prefix: string }[];
}) {
  return (
    <section className={cn(card, "p-5")}>
      <h3 className="mb-3 text-sm font-semibold text-ink">{title}</h3>
      {items.length ? (
        <ol className="flex list-decimal flex-col gap-2 ps-5 text-[13px] text-ink-2 marker:text-ink-muted">
          {items.map((x) => (
            <li key={x.point} className="leading-relaxed">
              {x.point}
              {x.who.length > 0 && (
                <span className="ms-1 text-xs text-ink-muted">
                  ({x.prefix} {x.who.join(", ")})
                </span>
              )}
            </li>
          ))}
        </ol>
      ) : (
        <p className="text-[13px] text-ink-muted">None.</p>
      )}
    </section>
  );
}

function Risks({ data }: { data: ProposalResultDto }) {
  const overall = data.evaluation?.overallRisk;
  return (
    <div className="flex flex-col gap-5">
      {overall && (
        <section className={cn(card, "flex items-center gap-3 p-5 text-sm")}>
          <span className="font-medium text-ink">Overall risk of awarding to this vendor</span>
          <RiskPill severity={overall} />
        </section>
      )}
      <ol className="flex flex-col gap-3">
        {data.risks.map((r, i) => (
          <li key={r.id} className={cn(card, "flex flex-col gap-2 p-5 text-[13px]")}>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-semibold text-ink-muted tabular-nums">{i + 1}.</span>
              <span className="font-medium text-ink">{r.title}</span>
              <RiskPill severity={r.severity} size="sm" />
              <span className="text-xs text-ink-muted tabular-nums">
                L{r.likelihood} × I{r.impact} = {r.likelihood * r.impact} ·{" "}
                {r.category.replace(/_/g, " ")}
              </span>
            </div>
            <p className="leading-relaxed text-ink-2">{r.description}</p>
            <dl className="grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
              <div>
                <dt className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
                  If it happens
                </dt>
                <dd className="text-ink-2">{r.consequence}</dd>
              </div>
              <div>
                <dt className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
                  Mitigation
                </dt>
                <dd className="text-ink-2">{r.mitigation}</dd>
              </div>
            </dl>
            {r.evidence && (
              <p className="text-xs text-ink-muted italic" dir="auto">
                Evidence: {r.evidence}
              </p>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}
