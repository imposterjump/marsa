import Link from "next/link";
import { CalendarClock, FileStack, FileText, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { ProjectStatusPill } from "@/components/ui/status-pill";
import type { ProjectSummaryDto } from "@/lib/api-types";
import { daysUntil, deadlineLabel, formatDate } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** Deadline text toned by urgency; closed tenders read as neutral history, not alarm. */
function Deadline({ project: p, className }: { project: ProjectSummaryDto; className?: string }) {
  if (!p.deadline) return <span className={cn("text-ink-faint", className)}>No deadline</span>;
  const days = daysUntil(p.deadline);
  const live = p.status === "draft" || p.status === "open";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        live && days >= 0 && days <= 7 ? "text-partial" : "text-ink-2",
        className,
      )}
    >
      <CalendarClock className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
      {deadlineLabel(p.deadline)}
    </span>
  );
}

function Counts({ project: p }: { project: ProjectSummaryDto }) {
  return (
    <>
      <span className="inline-flex items-center gap-1.5" title={plural(p.rfpCount, "RFP document")}>
        <FileText className="size-3.5 text-ink-faint" aria-hidden />
        <span className="font-medium tabular-nums">{p.rfpCount}</span> RFP
      </span>
      <span
        className="inline-flex items-center gap-1.5"
        title={plural(p.standardCount, "standard")}
      >
        <ShieldCheck className="size-3.5 text-ink-faint" aria-hidden />
        <span className="font-medium tabular-nums">{p.standardCount}</span> std
      </span>
      <span
        className="inline-flex items-center gap-1.5"
        title={plural(p.proposalCount, "proposal")}
      >
        <FileStack className="size-3.5 text-ink-faint" aria-hidden />
        <span className="font-medium tabular-nums">{p.proposalCount}</span> proposals
      </span>
    </>
  );
}

const stretched =
  "outline-none after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/30";

export function ProjectCard({ project: p }: { project: ProjectSummaryDto }) {
  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xs",
        "transition-[transform,box-shadow,border-color] duration-150 ease-out-quint hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        p.status === "archived" && "bg-surface/70",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="truncate font-mono text-xs font-medium text-ink-muted">{p.code}</span>
        <ProjectStatusPill status={p.status} size="sm" />
      </div>
      <h3 className="font-heading text-base leading-snug font-semibold tracking-tight text-balance text-ink">
        <Link href={`/projects/${p.id}`} className={stretched} dir="auto">
          {p.name}
        </Link>
      </h3>
      {p.description ? (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-muted" dir="auto">
          {p.description}
        </p>
      ) : (
        <p className="text-[13px] text-ink-faint italic">No description</p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]">
        <span className="text-ink-muted">{PROJECT_CATEGORY_LABEL[p.category]}</span>
        <span aria-hidden className="size-1 rounded-full bg-ink-faint" />
        <Deadline project={p} />
      </div>
      <div className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border/70 pt-4 text-xs text-ink-2">
        <Counts project={p} />
      </div>
      <p className="-mt-1 text-2xs text-ink-faint">Updated {formatDate(p.updatedAt)}</p>
    </article>
  );
}

/** Dense one-line variant for the list view. */
export function ProjectRow({ project: p }: { project: ProjectSummaryDto }) {
  return (
    <div className="relative grid grid-cols-1 gap-x-6 gap-y-2 rounded-xl border border-border bg-surface px-5 py-4 shadow-xs transition-[border-color,box-shadow] duration-150 hover:border-border-strong hover:shadow-sm md:grid-cols-[minmax(0,1fr)_auto_auto] md:items-center">
      <div className="flex min-w-0 flex-col gap-1">
        <span className="font-mono text-xs text-ink-muted">
          {p.code} · <span className="font-sans">{PROJECT_CATEGORY_LABEL[p.category]}</span>
        </span>
        <Link
          href={`/projects/${p.id}`}
          className={cn("truncate font-medium text-ink", stretched)}
          dir="auto"
        >
          {p.name}
        </Link>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-2">
        <Deadline project={p} />
        <Counts project={p} />
      </div>
      <ProjectStatusPill status={p.status} size="sm" />
    </div>
  );
}
