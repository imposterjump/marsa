"use client";

import { useState } from "react";
import Link from "next/link";
import { ClipboardCheck, FileStack, FolderOpen, Plus, Search, Sparkles } from "lucide-react";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { MaskedText } from "@/components/motion/masked-text";
import { Reveal } from "@/components/motion/reveal";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { StatTile } from "@/components/data/stat-tile";
import { ProjectsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useGreeting, useToday } from "@/hooks/use-client-store";
import { useSettings } from "@/hooks/use-settings";
import { firstName } from "@/lib/format";

type Filter = "all" | "draft" | "open" | "evaluating" | "evaluated";

export function ProjectsHome() {
  const { data: settings } = useSettings();
  const [filter, setFilter] = useState<Filter>("all");
  // Time-of-day text exists only in the browser (server snapshot is null → skeleton).
  const greet = useGreeting();
  const date = useToday();
  const now = greet && date ? { greet, date } : null;

  const name =
    settings?.customerName && settings.customerName !== "Guest"
      ? firstName(settings.customerName)
      : null;

  return (
    <div className="flex flex-col gap-10">
      {/* ── Hero (epic-design: depth layers + masked line reveal) ── */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-surface shadow-xs">
        <DepthBackdrop />
        <div className="relative flex flex-col gap-9 px-6 py-9 sm:px-10 sm:py-11">
          <div className="flex max-w-2xl flex-col gap-4">
            <div className="flex min-h-5 flex-wrap items-center gap-x-2 gap-y-1 text-xs font-medium text-ink-muted">
              {now ? (
                <>
                  <span className="whitespace-nowrap">{now.date}</span>
                  {settings?.organization && (
                    <>
                      <span
                        aria-hidden
                        className="hidden size-1 rounded-full bg-ink-faint sm:inline-block"
                      />
                      <span className="max-w-full basis-full truncate sm:basis-auto" dir="auto">
                        {settings.organization}
                      </span>
                    </>
                  )}
                </>
              ) : (
                <Skeleton className="h-3.5 w-48" />
              )}
            </div>
            {now && settings ? (
              <MaskedText
                key={`${now.greet}-${name}`}
                as="h1"
                text={name ? [`${now.greet},`, `${name}.`] : [`${now.greet}.`]}
                className="font-heading text-[40px] leading-[1.08] font-semibold tracking-[-0.025em] text-ink sm:text-display"
                lineClassName="[&]:text-balance"
              />
            ) : (
              <div className="flex flex-col gap-3 py-1">
                <Skeleton className="h-10 w-72" />
                <Skeleton className="h-10 w-48" />
              </div>
            )}
            <Reveal delay={0.25} immediate>
              <p className="max-w-xl text-base leading-relaxed text-pretty text-ink-2">
                Publish an RFP, collect vendor proposals, and let Marsa check every requirement:
                compliance, comparisons and risks, each with evidence you can open.
              </p>
            </Reveal>
            <Reveal delay={0.35} immediate className="flex flex-wrap items-center gap-3 pt-1">
              <ComingSoon phase={3}>
                <Button size="lg" disabled>
                  <Plus /> New project
                </Button>
              </ComingSoon>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/standards">
                  <ClipboardCheck /> Manage standards
                </Link>
              </Button>
            </Reveal>
          </div>

          <Stagger className="grid max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            <StaggerItem>
              <StatTile
                label="Active projects"
                value={0}
                icon={<FolderOpen />}
                hint="Draft, open or evaluating"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                label="Proposals received"
                value={0}
                icon={<FileStack />}
                hint="Across all projects"
              />
            </StaggerItem>
            <StaggerItem>
              <StatTile
                label="Evaluations completed"
                value={0}
                icon={<Sparkles />}
                hint="AI analysis runs"
              />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      {/* ── Projects list (cards arrive in P3.3) ── */}
      <section aria-labelledby="projects-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2
            id="projects-heading"
            className="font-heading text-xl font-semibold tracking-tight text-ink"
          >
            Your projects
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
              />
              <Input
                aria-label="Search projects"
                placeholder="Search by name or reference"
                className="ps-9 sm:w-64"
                disabled
              />
            </div>
            <SegmentedControl<Filter>
              aria-label="Filter projects by status"
              value={filter}
              onValueChange={setFilter}
              size="sm"
              options={[
                { value: "all", label: "All", count: 0 },
                { value: "draft", label: "Draft" },
                { value: "open", label: "Open" },
                { value: "evaluating", label: "Evaluating" },
                { value: "evaluated", label: "Evaluated" },
              ]}
            />
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
          <EmptyState
            size="lg"
            art={<ProjectsArt />}
            title="No projects yet"
            description={
              <>
                A project holds one tender: its RFP documents, the standards that apply, the
                vendors&apos; proposals and Marsa&apos;s evaluation. Project creation arrives in
                Phase 3, and sample data in Phase 4.
              </>
            }
            actions={
              <ComingSoon phase={3}>
                <Button disabled>
                  <Plus /> Create your first project
                </Button>
              </ComingSoon>
            }
          />
        </div>
      </section>
    </div>
  );
}

/** Wraps a disabled control with an explanatory tooltip (disabled buttons can't receive focus). */
function ComingSoon({ phase, children }: { phase: number; children: React.ReactNode }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          tabIndex={0}
          className="inline-flex rounded-lg focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
        >
          {children}
        </span>
      </TooltipTrigger>
      <TooltipContent>Available in Phase {phase}</TooltipContent>
    </Tooltip>
  );
}
