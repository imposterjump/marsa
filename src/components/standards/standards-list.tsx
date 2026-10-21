"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  FileText,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  SearchX,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { StandardsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { useDeleteStandard, useStandards, useUpdateStandard } from "@/hooks/use-standards";
import type { StandardSummaryDto } from "@/lib/api-types";
import { formatDate } from "@/lib/format";
import { StandardFormDialog } from "./standard-form-dialog";

type Filter = "all" | "active" | "inactive";

export function StandardsList() {
  const { data, isLoading, isError, refetch } = useStandards();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? []).filter(
      (s) =>
        (filter === "all" || (filter === "active") === s.isActive) &&
        (!q ||
          s.code.toLowerCase().includes(q) ||
          s.title.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q)),
    );
  }, [data, query, filter]);

  const activeCount = data?.filter((s) => s.isActive).length ?? 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Standards"
        description="Your organization's rules that every proposal must respect, such as IT security, safety and commercial terms. Marsa checks each vendor against the active standards of a project, alongside its RFP."
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus /> New standard
          </Button>
        }
      />

      {isLoading ? (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-56 rounded-xl" />
          ))}
        </div>
      ) : isError ? (
        <div className="rounded-xl border border-fail/30 bg-fail-soft/40 p-6 text-fail">
          Couldn&apos;t load standards.{" "}
          <button className="font-medium underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : data && data.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
          <EmptyState
            size="lg"
            art={<StandardsArt />}
            title="No standards yet"
            description="Create a standard for each rule set you apply to tenders (for example IT security, safety, commercial terms), then add its rules and upload the official document."
            actions={
              <Button onClick={() => setCreateOpen(true)}>
                <Plus /> Create your first standard
              </Button>
            }
          />
        </div>
      ) : (
        <section aria-label="Standards library" className="flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative sm:w-80">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
              />
              <Input
                aria-label="Search standards"
                placeholder="Search by code, title or category"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="ps-9"
              />
            </div>
            <SegmentedControl<Filter>
              aria-label="Filter standards"
              size="sm"
              value={filter}
              onValueChange={setFilter}
              options={[
                { value: "all", label: "All", count: data?.length ?? 0 },
                { value: "active", label: "Active", count: activeCount },
                { value: "inactive", label: "Inactive", count: (data?.length ?? 0) - activeCount },
              ]}
            />
          </div>

          {list.length === 0 ? (
            <EmptyState
              art={<SearchX className="size-10 text-ink-faint" strokeWidth={1.5} />}
              title="No standards match"
              description={query ? `Nothing matches "${query}".` : "No standards in this filter."}
              actions={
                <Button
                  variant="secondary"
                  onClick={() => {
                    setQuery("");
                    setFilter("all");
                  }}
                >
                  Clear filters
                </Button>
              }
            />
          ) : (
            <Stagger
              key={`${filter}-${data?.length}`}
              className="grid gap-5 md:grid-cols-2 xl:grid-cols-3"
            >
              {list.map((s) => (
                <StaggerItem key={s.id}>
                  <StandardCard standard={s} />
                </StaggerItem>
              ))}
            </Stagger>
          )}
        </section>
      )}

      <StandardFormDialog open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}

function StandardCard({ standard: s }: { standard: StandardSummaryDto }) {
  const update = useUpdateStandard(s.id);
  const remove = useDeleteStandard();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  return (
    <article
      className={cn(
        "group/card relative flex h-full flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xs",
        "transition-[transform,box-shadow,border-color] duration-150 ease-out-quint hover:-translate-y-0.5 hover:border-border-strong hover:shadow-md",
        !s.isActive && "bg-surface/70",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <span className="font-mono text-xs font-medium text-ink-muted">{s.code}</span>
          <h2 className="font-heading text-base leading-snug font-semibold tracking-tight text-ink">
            {/* Stretched link: the whole card opens the standard, other controls sit above it. */}
            <Link
              href={`/standards/${s.id}`}
              className="outline-none after:absolute after:inset-0 after:rounded-xl after:content-[''] focus-visible:after:ring-3 focus-visible:after:ring-ring/30"
            >
              {s.title}
            </Link>
          </h2>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              className="relative z-10 -me-2 -mt-1 text-ink-muted"
              aria-label={`Actions for ${s.code}`}
            >
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onSelect={() => setEditOpen(true)} className="gap-2.5">
              <Pencil className="size-4 text-ink-muted" /> Edit details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              variant="destructive"
              onSelect={() => setDeleteOpen(true)}
              className="gap-2.5"
            >
              <Trash2 className="size-4" /> Delete standard
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex flex-wrap gap-2">
        <Pill tone="neutral" size="sm">
          {s.category}
        </Pill>
        {s.isSample && (
          <Pill tone="info" size="sm">
            Sample
          </Pill>
        )}
      </div>

      {s.description ? (
        <p className="line-clamp-2 text-[13px] leading-relaxed text-ink-muted">{s.description}</p>
      ) : (
        <p className="text-[13px] text-ink-faint italic">No description</p>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-border/70 pt-4">
        <div className="flex items-center gap-4 text-xs text-ink-2">
          <span
            className="inline-flex items-center gap-1.5"
            title={`${s.mandatoryCount} mandatory`}
          >
            <ListChecks className="size-3.5 text-ink-faint" aria-hidden />
            <span className="font-medium tabular-nums">{s.rulesCount}</span> rules
            {s.mandatoryCount > 0 && <span className="text-ink-muted">· {s.mandatoryCount} M</span>}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <FileText className="size-3.5 text-ink-faint" aria-hidden />
            <span className="font-medium tabular-nums">{s.documentsCount}</span> docs
          </span>
        </div>
        <label className="relative z-10 flex items-center gap-2 text-xs font-medium text-ink-2">
          {s.isActive ? "Active" : "Inactive"}
          <Switch
            checked={s.isActive}
            onCheckedChange={(v) =>
              update.mutate(
                { isActive: v },
                { onSuccess: () => toast.success(`${s.code} ${v ? "activated" : "deactivated"}.`) },
              )
            }
            aria-label={`${s.code} active`}
          />
        </label>
      </div>
      <p className="text-2xs text-ink-faint">Updated {formatDate(s.updatedAt)}</p>

      <StandardFormDialog open={editOpen} onOpenChange={setEditOpen} standard={s} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${s.code}?`}
        description={
          <>
            This permanently deletes <strong>{s.title}</strong>, its {s.rulesCount} rules and{" "}
            {s.documentsCount} uploaded documents. Projects that used it keep their past evaluation
            results.
          </>
        }
        typeToConfirm={s.code}
        confirmLabel="Delete standard"
        onConfirm={() => remove.mutateAsync(s.id).then(() => toast.success(`${s.code} deleted.`))}
      />
    </article>
  );
}
