"use client";

import { createContext, useContext, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { toast } from "sonner";
import {
  Archive,
  ArchiveRestore,
  ArrowLeft,
  CalendarClock,
  ClipboardCheck,
  Info,
  LayoutDashboard,
  Lock,
  Megaphone,
  MoreHorizontal,
  Pencil,
  PencilLine,
  Sparkles,
  Trash2,
  Users,
} from "lucide-react";
import { cn } from "cn";
import { SetBreadcrumbs } from "@/components/shell/breadcrumbs";
import { ProjectsArt } from "@/components/illustrations";
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
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill, ProjectStatusPill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useDeleteProject, useProject, useUpdateProject } from "@/hooks/use-projects";
import { ApiClientError } from "@/lib/api-client";
import type { ProjectDetailDto } from "@/lib/api-types";
import { deadlineLabel } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";
import { ProjectEditDialog } from "./project-edit-dialog";

const ProjectContext = createContext<ProjectDetailDto | null>(null);

/** The loaded project for the tab pages under /projects/[projectId]. */
export function useProjectContext(): ProjectDetailDto {
  const p = useContext(ProjectContext);
  if (!p) throw new Error("useProjectContext must be used inside <ProjectGate>");
  return p;
}

/**
 * Loads the project for a tab page and provides it through context. The query is shared with
 * <ProjectHeader> (same key), so it is fetched once. Errors render nothing: the header shows them.
 */
export function ProjectGate({
  projectId,
  fallback,
  children,
}: {
  projectId: string;
  fallback: React.ReactNode;
  children: React.ReactNode;
}) {
  const { data: p, isLoading } = useProject(projectId);
  if (isLoading) return fallback;
  if (!p) return null;
  return <ProjectContext.Provider value={p}>{children}</ProjectContext.Provider>;
}

/**
 * Breadcrumbs, header, status banner and section tabs of a project. Rendered by the layout
 * beside (not around) the tab pages, so each page segment stays in the static shell (G-50).
 */
export function ProjectHeader({ projectId }: { projectId: string }) {
  const { data: p, isLoading, error } = useProject(projectId);
  const pathname = usePathname();

  if (isLoading) return <ProjectHeaderSkeleton />;
  if (error || !p) {
    const notFound = error instanceof ApiClientError && error.status === 404;
    return (
      <EmptyState
        size="lg"
        art={<ProjectsArt />}
        title={notFound ? "Project not found" : "Couldn't load this project"}
        description={
          notFound ? "It may have been deleted." : "Check your connection and try again."
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/projects">
              <ArrowLeft /> Back to projects
            </Link>
          </Button>
        }
      />
    );
  }

  const base = `/projects/${p.id}`;
  const tabs = [
    { href: base, label: "Overview", icon: LayoutDashboard },
    { href: `${base}/proposals`, label: "Proposals", icon: Users, count: p.proposalCount },
    { href: `${base}/evaluation`, label: "Evaluation", icon: p.proposalCount ? Sparkles : Lock },
    { href: `${base}/ai-review`, label: "AI review", icon: ClipboardCheck },
  ];

  // On a single proposal (/proposals/[id]) the header shrinks to one line (P5.3): the vendor's
  // documents matter there, and that page sets its own breadcrumbs.
  const compact = /\/proposals\/[^/]+/.test(pathname);

  return (
    <div className={cn("flex flex-col", compact ? "gap-5" : "gap-8")}>
      {compact ? (
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-2 text-[13px]">
          <span className="font-mono text-xs text-ink-muted">{p.code}</span>
          <Link
            href={base}
            className="min-w-0 truncate font-heading text-base font-semibold tracking-tight text-ink underline-offset-4 outline-none hover:underline focus-visible:ring-3 focus-visible:ring-ring/25"
            dir="auto"
            title={p.name}
          >
            {p.name}
          </Link>
          <ProjectStatusPill status={p.status} size="sm" />
          {p.deadline && (
            <span className="inline-flex items-center gap-1.5 text-ink-muted">
              <CalendarClock className="size-3.5 text-ink-faint" aria-hidden />
              {deadlineLabel(p.deadline)}
            </span>
          )}
        </div>
      ) : (
        <>
          <SetBreadcrumbs crumbs={[{ label: "Projects", href: "/projects" }, { label: p.code }]} />
          <PageHeader
            eyebrow={
              <span className="flex items-center gap-2">
                <span className="font-mono tracking-normal normal-case">{p.code}</span>
                <span aria-hidden>·</span>
                <span>{PROJECT_CATEGORY_LABEL[p.category]}</span>
              </span>
            }
            title={<span dir="auto">{p.name}</span>}
            description={
              <>
                {p.description && (
                  <span className="mt-1 line-clamp-3 block" dir="auto" title={p.description}>
                    {p.description}
                  </span>
                )}
                <span className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px]">
                  <ProjectStatusPill status={p.status} />
                  {p.isSample && (
                    <Pill tone="info" size="md">
                      Sample data
                    </Pill>
                  )}
                  <span className="inline-flex items-center gap-1.5 text-ink-2">
                    <CalendarClock className="size-4 text-ink-faint" aria-hidden />
                    {p.deadline ? deadlineLabel(p.deadline) : "No submission deadline"}
                  </span>
                </span>
              </>
            }
            actions={<HeaderActions project={p} />}
          />

          <StatusBanner project={p} />
        </>
      )}

      <nav aria-label="Project sections" className="-mt-2 border-b border-border">
        <ul className="-mb-px flex [scrollbar-width:none] gap-6 overflow-x-auto">
          {tabs.map((t) => {
            const active = t.href === base ? pathname === base : pathname.startsWith(t.href);
            return (
              <li key={t.href} className="shrink-0">
                <Link
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "relative flex h-11 items-center gap-2 rounded-t-md px-0.5 text-sm font-medium transition-colors outline-none",
                    "focus-visible:ring-3 focus-visible:ring-ring/25",
                    active ? "text-ink" : "text-ink-muted hover:text-ink",
                  )}
                >
                  <t.icon className="size-4" aria-hidden />
                  {t.label}
                  {t.count != null && t.count > 0 && (
                    <span className="rounded-full bg-surface-muted px-1.5 text-2xs leading-5 font-semibold text-ink-2 tabular-nums">
                      {t.count}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="project-tab"
                      className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-brand"
                      transition={{ type: "spring", stiffness: 480, damping: 38 }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}

function StatusBanner({ project: p }: { project: ProjectDetailDto }) {
  if (p.status !== "draft" && p.status !== "archived") return null;
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/60 px-4 py-3 text-[13px] text-ink-2">
      <Info className="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden />
      {p.status === "draft" ? (
        <span>
          This tender is a <strong className="font-semibold text-ink">draft</strong>. Vendors
          can&apos;t see it until you publish it.
          {p.rfpDocuments.length === 0 && " Upload at least one RFP document first."}
        </span>
      ) : (
        <span>
          This project is <strong className="font-semibold text-ink">archived</strong> and
          read-only. Restore it to make changes.
        </span>
      )}
    </div>
  );
}

function HeaderActions({ project: p }: { project: ProjectDetailDto }) {
  const router = useRouter();
  const update = useUpdateProject(p.id);
  const remove = useDeleteProject();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [archiveOpen, setArchiveOpen] = useState(false);

  const transition = async (status: "draft" | "open" | "archived", message: string) => {
    try {
      await update.mutateAsync({ status });
      toast.success(message);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't change the status.");
    }
  };
  const restoreTo = p.publishedAt ? "open" : "draft";
  const canEdit = p.status !== "archived" && p.status !== "evaluating";

  return (
    <>
      {p.status === "draft" &&
        (p.rfpDocuments.length === 0 ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <span tabIndex={0} className="inline-flex rounded-lg">
                <Button disabled>
                  <Megaphone /> Publish to vendors
                </Button>
              </span>
            </TooltipTrigger>
            <TooltipContent>Upload at least one RFP document first</TooltipContent>
          </Tooltip>
        ) : (
          <Button
            loading={update.isPending}
            onClick={() => transition("open", `${p.code} is now open for proposals.`)}
          >
            <Megaphone /> Publish to vendors
          </Button>
        ))}
      {p.status === "archived" && (
        <Button
          loading={update.isPending}
          onClick={() =>
            transition(
              restoreTo,
              `${p.code} restored as ${restoreTo === "open" ? "open" : "a draft"}.`,
            )
          }
        >
          <ArchiveRestore /> Restore
        </Button>
      )}
      {canEdit && (
        <Button variant="secondary" onClick={() => setEditOpen(true)}>
          <Pencil /> Edit
        </Button>
      )}
      {p.status !== "evaluating" && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" aria-label="More actions">
              <MoreHorizontal />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-52">
            {p.status === "open" && p.proposalCount === 0 && (
              <DropdownMenuItem
                className="gap-2.5"
                onSelect={() => transition("draft", `${p.code} moved back to draft.`)}
              >
                <PencilLine className="size-4 text-ink-muted" /> Move back to draft
              </DropdownMenuItem>
            )}
            {p.status !== "archived" && (
              <>
                <DropdownMenuItem className="gap-2.5" onSelect={() => setArchiveOpen(true)}>
                  <Archive className="size-4 text-ink-muted" /> Archive project
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem
              variant="destructive"
              className="gap-2.5"
              onSelect={() => setDeleteOpen(true)}
            >
              <Trash2 className="size-4" /> Delete project
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      <ProjectEditDialog open={editOpen} onOpenChange={setEditOpen} project={p} />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={`Archive ${p.code}?`}
        description="The project becomes read-only and leaves the active list. Its documents, proposals and results are kept, and you can restore it at any time."
        confirmLabel="Archive project"
        destructive={false}
        onConfirm={() => transition("archived", `${p.code} archived.`)}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${p.code}?`}
        description={
          <>
            This permanently deletes <strong dir="auto">{p.name}</strong>, its{" "}
            {p.rfpDocuments.length} RFP document(s), {p.proposalCount} proposal(s) and any
            evaluation results. This can&apos;t be undone.
          </>
        }
        typeToConfirm={p.code}
        confirmLabel="Delete project"
        onConfirm={async () => {
          await remove.mutateAsync(p.id);
          toast.success(`${p.code} deleted.`);
          router.push("/projects");
        }}
      />
    </>
  );
}

export function ProjectHeaderSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy>
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-8 w-[min(560px,90%)]" />
        <Skeleton className="h-6 w-64" />
      </div>
      <Skeleton className="h-11 w-80" />
    </div>
  );
}

export function ProjectPageSkeleton() {
  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]" aria-busy>
      <Skeleton className="h-96 rounded-xl" />
      <Skeleton className="h-96 rounded-xl" />
    </div>
  );
}
