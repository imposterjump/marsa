"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Pencil, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { DocumentRow } from "@/components/documents/document-row";
import { KeyValueList } from "@/components/data/key-value-list";
import { Button } from "@/components/ui/button";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { Pill } from "@/components/ui/status-pill";
import { useDeleteProjectDocument, useInvalidateProject } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import type { DocumentDto, ProjectDetailDto } from "@/lib/api-types";
import { middleTruncate } from "@/lib/files";
import { deadlineLabel, formatDateTime, formatYmd } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";
import { uploadFile } from "@/lib/upload";
import { ProjectStandardsDialog } from "./project-edit-dialog";
import { useProjectContext } from "./project-shell";

const card = "flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs";

function CardHeader({
  id,
  title,
  description,
  action,
}: {
  id: string;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h2 id={id} className="font-heading text-base font-semibold tracking-tight text-ink">
          {title}
        </h2>
        {description && <p className="text-[13px] text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function ProjectOverview() {
  const p = useProjectContext();
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
      <div className="flex flex-col gap-6">
        <RfpDocuments project={p} />
        {p.notes && (
          <section aria-labelledby="notes-title" className={card}>
            <CardHeader id="notes-title" title="Key requirements / notes" />
            <p className="text-[13px] leading-relaxed whitespace-pre-line text-ink-2" dir="auto">
              {p.notes}
            </p>
          </section>
        )}
      </div>
      <div className="flex flex-col gap-6">
        <Details project={p} />
        <Standards project={p} />
        <Timeline project={p} />
      </div>
    </div>
  );
}

function RfpDocuments({ project: p }: { project: ProjectDetailDto }) {
  const { data: settings } = useSettings();
  const invalidate = useInvalidateProject(p.id);
  const remove = useDeleteProjectDocument(p.id);
  const docs = p.rfpDocuments;
  const canUpload = p.status !== "archived" && p.status !== "evaluating";
  const canDelete =
    (p.status === "draft" || p.status === "open") && !(p.status === "open" && docs.length <= 1);

  const upload: UploadFn = async (file, onProgress) => {
    const doc = await uploadFile<DocumentDto>(`/api/projects/${p.id}/documents`, file, onProgress);
    await invalidate();
    toast.success(`${middleTruncate(doc.originalName, 40)} uploaded`, {
      description: doc.pageCount
        ? `${doc.pageCount} page${doc.pageCount === 1 ? "" : "s"}`
        : undefined,
    });
  };

  return (
    <section aria-labelledby="rfp-title" className={card}>
      <CardHeader
        id="rfp-title"
        title={`RFP documents (${docs.length})`}
        description="What vendors respond to. The AI reads every file to build the requirement checklist."
      />
      {docs.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label="RFP documents">
          {docs.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              nameMax={52}
              onDelete={
                canDelete
                  ? () => remove.mutateAsync(d.id).then(() => toast.success("Document removed."))
                  : undefined
              }
              deleteDescription={
                p.status === "open"
                  ? `Vendors can already see “${d.originalName}”. Removing it changes the tender for everyone.`
                  : `“${d.originalName}” will be removed from this project.`
              }
            />
          ))}
        </ul>
      ) : (
        // While uploads are allowed the dropzone below is the empty state.
        !canUpload && <p className="text-[13px] text-ink-muted">No RFP documents.</p>
      )}
      {canUpload && (
        <Dropzone
          label={docs.length ? "Add an addendum or annex" : "Upload the RFP"}
          maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
          upload={upload}
          removeOnDone
        />
      )}
    </section>
  );
}

function Details({ project: p }: { project: ProjectDetailDto }) {
  return (
    <section aria-labelledby="details-title" className={card}>
      <CardHeader id="details-title" title="Details" />
      <KeyValueList
        className="-my-3"
        items={[
          { label: "Reference", value: <span className="font-mono">{p.code}</span> },
          { label: "Category", value: PROJECT_CATEGORY_LABEL[p.category] },
          {
            label: "Submission deadline",
            value: p.deadline ? (
              <span className="flex flex-col items-end">
                {formatYmd(p.deadline)}
                <span className="text-xs text-ink-muted">{deadlineLabel(p.deadline)}</span>
              </span>
            ) : (
              "—"
            ),
          },
          { label: "Created", value: formatDateTime(p.createdAt) },
          { label: "Published", value: p.publishedAt ? formatDateTime(p.publishedAt) : "Not yet" },
          { label: "Last activity", value: formatDateTime(p.updatedAt) },
        ]}
      />
    </section>
  );
}

function Standards({ project: p }: { project: ProjectDetailDto }) {
  const [open, setOpen] = useState(false);
  const editable = p.status === "draft" || p.status === "open";
  return (
    <section aria-labelledby="standards-title" className={card}>
      <CardHeader
        id="standards-title"
        title={`Standards (${p.standards.length})`}
        description={
          p.category === "General"
            ? "Rules checked alongside the RFP. Any standard can apply."
            : `Rules checked alongside the RFP. Only “${p.category}” and “General” standards can apply.`
        }
        action={
          editable && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setOpen(true)}
              aria-label="Edit standards"
            >
              <Pencil /> Edit
            </Button>
          )
        }
      />
      {p.standards.length ? (
        <ul className="flex flex-col gap-2">
          {p.standards.map((s) => (
            <li key={s.id}>
              <Link
                href={`/standards/${s.id}`}
                className="flex items-start gap-3 rounded-lg border border-border p-3 transition-colors outline-none hover:border-border-strong hover:bg-surface-muted/50 focus-visible:ring-3 focus-visible:ring-ring/25"
              >
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-brand" aria-hidden />
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-mono text-xs text-ink-muted">{s.code}</span>
                  <span className="text-[13px] leading-snug font-medium text-ink">{s.title}</span>
                </span>
                {!s.isActive && (
                  <Pill tone="partial" size="sm" className="ms-auto">
                    Inactive
                  </Pill>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-muted">
          None. Proposals will be checked against the RFP only.
        </p>
      )}
      <ProjectStandardsDialog open={open} onOpenChange={setOpen} project={p} />
    </section>
  );
}

function Timeline({ project: p }: { project: ProjectDetailDto }) {
  const steps = [
    { label: "Draft created", done: true, detail: formatDateTime(p.createdAt) },
    {
      label: "Published to vendors",
      done: !!p.publishedAt,
      detail: p.publishedAt ? formatDateTime(p.publishedAt) : "Waiting for you to publish",
    },
    {
      label: "Proposals received",
      done: p.proposalCount > 0,
      detail: p.proposalCount
        ? `${p.proposalCount} proposal${p.proposalCount === 1 ? "" : "s"}`
        : p.deadline
          ? `Vendors respond until ${formatYmd(p.deadline)}`
          : "No proposals yet",
    },
    {
      label: "Evaluation completed",
      done: p.status === "evaluated",
      detail: p.status === "evaluated" ? "Results ready" : "Runs once proposals are in",
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <section aria-labelledby="timeline-title" className={card}>
      <CardHeader id="timeline-title" title="Progress" />
      <ol className="flex flex-col">
        {steps.map((s, i) => (
          <li key={s.label} className="relative flex gap-3 pb-5 last:pb-0">
            {i < steps.length - 1 && (
              <span
                aria-hidden
                className={cn(
                  "absolute start-[11px] top-6 bottom-0 w-px",
                  s.done && steps[i + 1].done ? "bg-brand/50" : "bg-border",
                )}
              />
            )}
            <span
              aria-hidden
              className={cn(
                "relative flex size-6 shrink-0 items-center justify-center rounded-full border",
                s.done
                  ? "border-brand bg-brand text-on-brand"
                  : i === current
                    ? "border-brand bg-surface"
                    : "border-border-strong bg-surface",
              )}
            >
              {s.done ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                i === current && <span className="size-2 rounded-full bg-brand" />
              )}
            </span>
            <span className="flex flex-col gap-0.5 pt-0.5">
              <span
                className={cn(
                  "text-[13px] font-medium",
                  s.done || i === current ? "text-ink" : "text-ink-muted",
                )}
              >
                {s.label}
                <span className="sr-only">
                  {s.done ? " (done)" : i === current ? " (current)" : ""}
                </span>
              </span>
              <span className="text-xs text-ink-muted">{s.detail}</span>
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
