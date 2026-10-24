"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { LayoutGrid, List, Plus, Search, SearchX } from "lucide-react";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { ProjectsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import type { ProjectStatus } from "@/lib/domain";
import { PROJECT_STATUS_LABEL } from "@/lib/labels";
import { ProjectCard, ProjectRow } from "./project-card";
import { ProjectsWelcome } from "./projects-welcome";
import { APP_NAME } from "@/lib/brand";

type Filter = "all" | ProjectStatus;
type View = "grid" | "list";
const FILTERS: Filter[] = ["all", "draft", "open", "evaluating", "evaluated", "archived"];

export function ProjectsHome() {
  const { data: projects, isLoading, isError, refetch } = useProjects();
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("grid");

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (projects ?? []).filter(
      (p) =>
        (filter === "all" || p.status === filter) &&
        (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q)),
    );
  }, [projects, filter, query]);
  const all = projects ?? [];
  const counts = Object.fromEntries(
    FILTERS.map((f) => [f, f === "all" ? all.length : all.filter((p) => p.status === f).length]),
  ) as Record<Filter, number>;

  return (
    <div className="flex flex-col gap-10">
      <ProjectsWelcome projects={projects} />

      {/* ── Projects list ── */}
      <section aria-labelledby="projects-heading" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <h2
            id="projects-heading"
            className="font-heading text-xl font-semibold tracking-tight text-ink"
          >
            Your projects
          </h2>
          {all.length > 0 && (
            <div className="flex min-w-0 flex-col gap-3 md:flex-row md:items-center">
              <div className="relative">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint"
                />
                <Input
                  aria-label="Search projects"
                  placeholder="Search by name or reference"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="ps-9 md:w-64"
                />
              </div>
              <div className="flex min-w-0 items-center gap-3">
                <SegmentedControl<Filter>
                  aria-label="Filter projects by status"
                  value={filter}
                  onValueChange={setFilter}
                  size="sm"
                  className="min-w-0"
                  options={FILTERS.filter((f) => f === "all" || f === filter || counts[f] > 0).map(
                    (f) => ({
                      value: f,
                      label: f === "all" ? "All" : PROJECT_STATUS_LABEL[f],
                      count: counts[f],
                    }),
                  )}
                />
                <SegmentedControl<View>
                  aria-label="Layout"
                  value={view}
                  onValueChange={setView}
                  size="sm"
                  className="shrink-0"
                  options={[
                    {
                      value: "grid",
                      label: <span className="sr-only">Grid view</span>,
                      icon: <LayoutGrid />,
                    },
                    {
                      value: "list",
                      label: <span className="sr-only">List view</span>,
                      icon: <List />,
                    },
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-60 rounded-xl" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-fail/30 bg-fail-soft/40 p-6 text-fail">
            Couldn&apos;t load projects.{" "}
            <button className="font-medium underline" onClick={() => refetch()}>
              Try again
            </button>
          </div>
        ) : all.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border-strong bg-surface/60">
            <EmptyState
              size="lg"
              art={<ProjectsArt />}
              title="No projects yet"
              description={
                <>
                  A project holds one tender: its RFP documents, the standards that apply, the
                  vendors&apos; proposals and {APP_NAME}&apos;s evaluation. Start by publishing your
                  first RFP.
                </>
              }
              actions={
                <Button asChild>
                  <Link href="/projects/new">
                    <Plus /> Create your first project
                  </Link>
                </Button>
              }
            />
          </div>
        ) : list.length === 0 ? (
          <EmptyState
            art={<SearchX className="size-10 text-ink-faint" strokeWidth={1.5} />}
            title="No projects match"
            description={query ? `Nothing matches "${query}".` : "No projects with this status."}
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
        ) : view === "grid" ? (
          <Stagger key={`grid-${filter}`} className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {list.map((p) => (
              <StaggerItem key={p.id}>
                <ProjectCard project={p} />
              </StaggerItem>
            ))}
          </Stagger>
        ) : (
          <Stagger key={`list-${filter}`} role="list" className="flex flex-col gap-3">
            {list.map((p) => (
              <StaggerItem key={p.id} role="listitem">
                <ProjectRow project={p} />
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </section>
    </div>
  );
}
