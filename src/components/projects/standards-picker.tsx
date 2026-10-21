"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useStandards } from "@/hooks/use-standards";
import type { StandardSummaryDto } from "@/lib/api-types";
import { standardFitsProject, type ProjectCategory } from "@/lib/domain";

/**
 * Choose which standards apply to a project (PRD FR-3.3). Only standards that fit the project's
 * category are offered (its own category + General; a General project sees all). Active first.
 */
export function StandardsPicker({
  value,
  onChange,
  category,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
  category: ProjectCategory;
}) {
  const { data, isLoading } = useStandards();
  const [showInactive, setShowInactive] = useState(false);

  if (isLoading || !data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {[0, 1].map((i) => (
          <Skeleton key={i} className="h-24 rounded-xl" />
        ))}
      </div>
    );
  }
  if (data.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border-strong">
        <EmptyState
          art={<ShieldCheck className="size-10 text-brand" strokeWidth={1.5} />}
          title="No standards in your library"
          description="That's fine: Marsa will evaluate proposals against the RFP only. You can add standards later."
          actions={
            <Button asChild variant="secondary" size="sm">
              <Link href="/standards" target="_blank">
                Open the Standards library
              </Link>
            </Button>
          }
        />
      </div>
    );
  }

  const fitting = data.filter((s) => standardFitsProject(s.category, category));
  const hidden = data.length - fitting.length;
  const active = fitting.filter((s) => s.isActive);
  const inactive = fitting.filter((s) => !s.isActive);
  const toggle = (id: string) =>
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  const selectedInactive = inactive.filter((s) => value.includes(s.id)).length;

  const hiddenNote = hidden > 0 && (
    <p className="text-xs text-ink-muted">
      {hidden} standard{hidden === 1 ? " is" : "s are"} hidden because{" "}
      {hidden === 1 ? "it belongs" : "they belong"} to other categories. To use{" "}
      {hidden === 1 ? "it" : "them"}, set the project category to <strong>General</strong>.
    </p>
  );

  if (fitting.length === 0) {
    return (
      <div className="flex flex-col gap-3">
        <div className="rounded-xl border border-dashed border-border-strong">
          <EmptyState
            art={<ShieldCheck className="size-10 text-ink-faint" strokeWidth={1.5} />}
            title={`No “${category}” standards yet`}
            description="Proposals will be checked against the RFP only. Add standards in this category, or use the General category."
            actions={
              <Button asChild variant="secondary" size="sm">
                <Link href="/standards" target="_blank">
                  Open the Standards library
                </Link>
              </Button>
            }
          />
        </div>
        {hiddenNote}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3 text-[13px] text-ink-muted">
        <span>
          {value.length} of {fitting.length} selected
        </span>
        <span className="flex gap-1">
          <Button
            type="button"
            variant="ghost"
            size="xs"
            onClick={() => onChange(active.map((s) => s.id))}
          >
            Active only
          </Button>
          <Button type="button" variant="ghost" size="xs" onClick={() => onChange([])}>
            None
          </Button>
        </span>
      </div>
      <ul className="grid gap-3 sm:grid-cols-2" aria-label="Active standards">
        {active.map((s) => (
          <StandardOption
            key={s.id}
            s={s}
            checked={value.includes(s.id)}
            onToggle={() => toggle(s.id)}
          />
        ))}
      </ul>
      {inactive.length > 0 && (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={() => setShowInactive((v) => !v)}
            aria-expanded={showInactive}
            className="flex w-fit items-center gap-1.5 rounded-md text-[13px] font-medium text-ink-2 outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25"
          >
            <ChevronDown
              className={cn("size-4 transition-transform", showInactive && "rotate-180")}
              aria-hidden
            />
            Inactive standards ({inactive.length})
            {selectedInactive > 0 && (
              <span className="text-brand-ink">· {selectedInactive} selected</span>
            )}
          </button>
          {showInactive && (
            <ul className="grid gap-3 sm:grid-cols-2" aria-label="Inactive standards">
              {inactive.map((s) => (
                <StandardOption
                  key={s.id}
                  s={s}
                  checked={value.includes(s.id)}
                  onToggle={() => toggle(s.id)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
      {hiddenNote}
    </div>
  );
}

function StandardOption({
  s,
  checked,
  onToggle,
}: {
  s: StandardSummaryDto;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        role="checkbox"
        aria-checked={checked}
        onClick={onToggle}
        className={cn(
          "flex h-full w-full items-start gap-3 rounded-xl border p-4 text-start outline-none",
          "transition-[border-color,background-color,box-shadow] duration-150 focus-visible:ring-3 focus-visible:ring-ring/25",
          checked
            ? "border-brand bg-brand-soft/30 shadow-xs"
            : "border-border bg-surface hover:border-border-strong",
        )}
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
            checked ? "border-brand bg-brand text-on-brand" : "border-border-strong bg-surface",
          )}
        >
          {checked && <Check className="size-3.5" strokeWidth={3} />}
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 text-xs text-ink-muted">
            <span className="font-mono">{s.code}</span>
            <span aria-hidden>·</span>
            <span>{s.category}</span>
          </span>
          <span className="leading-snug font-medium text-ink">{s.title}</span>
          <span className="text-xs text-ink-muted">
            {s.rulesCount} rules · {s.mandatoryCount} mandatory · {s.documentsCount} doc
            {s.documentsCount === 1 ? "" : "s"}
          </span>
        </span>
      </button>
    </li>
  );
}
