"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Info, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { SetBreadcrumbs } from "@/components/shell/breadcrumbs";
import { StandardsArt } from "@/components/illustrations";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { KeyValueList } from "@/components/data/key-value-list";
import { useDeleteStandard, useStandard, useUpdateStandard } from "@/hooks/use-standards";
import { ApiClientError } from "@/lib/api-client";
import { formatDateTime } from "@/lib/format";
import { RulesEditor } from "./rules-editor";
import { StandardDocuments } from "./standard-documents";
import { StandardFormDialog } from "./standard-form-dialog";

export function StandardDetail({ standardId }: { standardId: string }) {
  const router = useRouter();
  const { data: s, isLoading, error } = useStandard(standardId);
  const update = useUpdateStandard(standardId);
  const remove = useDeleteStandard();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (isLoading) return <StandardDetailSkeleton />;
  if (error || !s) {
    const notFound = error instanceof ApiClientError && error.status === 404;
    return (
      <EmptyState
        size="lg"
        art={<StandardsArt />}
        title={notFound ? "Standard not found" : "Couldn't load this standard"}
        description={
          notFound ? "It may have been deleted." : "Check your connection and try again."
        }
        actions={
          <Button asChild variant="secondary">
            <Link href="/standards">
              <ArrowLeft /> Back to standards
            </Link>
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <SetBreadcrumbs crumbs={[{ label: "Standards", href: "/standards" }, { label: s.code }]} />
      <PageHeader
        eyebrow={
          <span className="flex items-center gap-2">
            <span className="font-mono tracking-normal normal-case">{s.code}</span>
            <span aria-hidden>·</span>
            <span>{s.category}</span>
          </span>
        }
        title={s.title}
        description={s.description || undefined}
        actions={
          <>
            <label className="flex h-9 items-center gap-2.5 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-ink-2 shadow-xs">
              {s.isActive ? "Active" : "Inactive"}
              <Switch
                checked={s.isActive}
                onCheckedChange={(v) =>
                  update.mutate(
                    { isActive: v },
                    {
                      onSuccess: () =>
                        toast.success(v ? "Standard activated." : "Standard deactivated."),
                    },
                  )
                }
                aria-label="Standard active"
              />
            </label>
            <Button variant="secondary" onClick={() => setEditOpen(true)}>
              <Pencil /> Edit
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="More actions">
                  <MoreHorizontal />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  variant="destructive"
                  onSelect={() => setDeleteOpen(true)}
                  className="gap-2.5"
                >
                  <Trash2 className="size-4" /> Delete standard
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </>
        }
      />

      {!s.isActive && (
        <div className="flex items-start gap-3 rounded-xl border border-partial/30 bg-partial-soft/50 px-4 py-3 text-[13px] text-ink-2">
          <Info className="mt-0.5 size-4 shrink-0 text-partial" aria-hidden />
          This standard is inactive: it won&apos;t be pre-selected for new projects. Projects can
          still apply it manually.
        </div>
      )}

      <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_380px] [&>*]:min-w-0">
        <RulesEditor standard={s} />
        <div className="flex flex-col gap-6">
          <StandardDocuments standard={s} />
          <section className="flex flex-col gap-3 rounded-xl border border-border bg-surface p-6 shadow-xs">
            <h2 className="font-heading text-base font-semibold tracking-tight text-ink">
              How it&apos;s used
            </h2>
            <p className="text-[13px] leading-relaxed text-ink-muted">
              When a project applies this standard, every rule above becomes part of the evaluation
              checklist. Each vendor is checked against it alongside the RFP, and the uploaded
              documents give the AI the full context.
            </p>
            <KeyValueList
              items={[
                { label: "Created", value: formatDateTime(s.createdAt) },
                { label: "Last updated", value: formatDateTime(s.updatedAt) },
                ...(s.isSample
                  ? [
                      {
                        label: "Source",
                        value: (
                          <Pill tone="info" size="sm">
                            Sample data
                          </Pill>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          </section>
        </div>
      </div>

      <StandardFormDialog open={editOpen} onOpenChange={setEditOpen} standard={s} />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Delete ${s.code}?`}
        description={
          <>
            This permanently deletes <strong>{s.title}</strong>, its {s.rules.length} rules and{" "}
            {s.documents.length} documents.
          </>
        }
        typeToConfirm={s.code}
        confirmLabel="Delete standard"
        onConfirm={async () => {
          await remove.mutateAsync(s.id);
          toast.success(`${s.code} deleted.`);
          router.push("/standards");
        }}
      />
    </div>
  );
}

export function StandardDetailSkeleton() {
  return (
    <div className="flex flex-col gap-8" aria-busy="true">
      <div className="flex flex-col gap-3">
        <Skeleton className="h-3.5 w-40" />
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/2" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <Skeleton className="h-96 rounded-xl" />
        <Skeleton className="h-72 rounded-xl" />
      </div>
    </div>
  );
}
