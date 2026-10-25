"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Pencil, ShieldCheck } from "lucide-react";
import { cn } from "cn";
import { DocumentRow } from "@/components/documents/document-row";
import { KeyValueList } from "@/components/data/key-value-list";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { Pill } from "@/components/ui/status-pill";
import { useDeleteProjectDocument, useInvalidateProject } from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import type { DocumentDto, ProjectDetailDto } from "@/lib/api-types";
import { middleTruncate } from "@/lib/files";
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
  const t = useT();
  const p = useProjectContext();
  return (
    <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px] [&>*]:min-w-0">
      <div className="flex flex-col gap-6">
        <RfpDocuments project={p} />
        {p.notes && (
          <section aria-labelledby="notes-title" className={card}>
            <CardHeader id="notes-title" title={t("Key requirements / notes")} />
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
  const t = useT();
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
    toast.success(t("{name} uploaded", { name: middleTruncate(doc.originalName, 40) }), {
      description: doc.pageCount ? t.plural(doc.pageCount, "{n} page", "{n} pages") : undefined,
    });
  };

  return (
    <section aria-labelledby="rfp-title" className={card}>
      <CardHeader
        id="rfp-title"
        title={t("RFP documents ({n})", { n: docs.length })}
        description={t(
          "What vendors respond to. The AI reads every file to build the requirement checklist.",
        )}
      />
      {docs.length > 0 ? (
        <ul className="flex flex-col gap-2" aria-label={t("RFP documents")}>
          {docs.map((d) => (
            <DocumentRow
              key={d.id}
              doc={d}
              nameMax={52}
              onDelete={
                canDelete
                  ? () => remove.mutateAsync(d.id).then(() => toast.success(t("Document removed.")))
                  : undefined
              }
              deleteDescription={
                p.status === "open"
                  ? t(
                      "Vendors can already see “{name}”. Removing it changes the tender for everyone.",
                      { name: d.originalName },
                    )
                  : t("“{name}” will be removed from this project.", { name: d.originalName })
              }
            />
          ))}
        </ul>
      ) : (
        // While uploads are allowed the dropzone below is the empty state.
        !canUpload && <p className="text-[13px] text-ink-muted">{t("No RFP documents.")}</p>
      )}
      {canUpload && (
        <Dropzone
          label={docs.length ? t("Add an addendum or annex") : t("Upload the RFP")}
          maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
          upload={upload}
          removeOnDone
        />
      )}
    </section>
  );
}

function Details({ project: p }: { project: ProjectDetailDto }) {
  const t = useT();
  return (
    <section aria-labelledby="details-title" className={card}>
      <CardHeader id="details-title" title={t("Details")} />
      <KeyValueList
        className="-my-3"
        items={[
          { label: t("Reference"), value: <span className="font-mono">{p.code}</span> },
          { label: t("Category"), value: t(PROJECT_CATEGORY_LABEL[p.category]) },
          {
            label: t("Submission deadline"),
            value: p.deadline ? (
              <span className="flex flex-col items-end">
                {t.ymd(p.deadline)}
                <span className="text-xs text-ink-muted">{t.deadline(p.deadline)}</span>
              </span>
            ) : (
              "—"
            ),
          },
          // "Create project" publishes; the draft before it is not the project's creation.
          p.publishedAt
            ? { label: t("Created"), value: t.dateTime(p.publishedAt) }
            : { label: t("Draft started"), value: t.dateTime(p.createdAt) },
          { label: t("Last activity"), value: t.dateTime(p.updatedAt) },
        ]}
      />
    </section>
  );
}

function Standards({ project: p }: { project: ProjectDetailDto }) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const editable = p.status === "draft" || p.status === "open";
  return (
    <section aria-labelledby="standards-title" className={card}>
      <CardHeader
        id="standards-title"
        title={t("Standards ({n})", { n: p.standards.length })}
        description={
          p.category === "General"
            ? t("Rules checked alongside the RFP. Any standard can apply.")
            : t(
                "Rules checked alongside the RFP. Only “{category}” and “General” standards can apply.",
                { category: t(PROJECT_CATEGORY_LABEL[p.category]) },
              )
        }
        action={
          editable && (
            <Button
              variant="ghost"
              size="xs"
              onClick={() => setOpen(true)}
              aria-label={t("Edit standards")}
            >
              <Pencil /> {t("Edit")}
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
                    {t("Inactive")}
                  </Pill>
                )}
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-[13px] text-ink-muted">
          {t("None. Proposals will be checked against the RFP only.")}
        </p>
      )}
      <ProjectStandardsDialog open={open} onOpenChange={setOpen} project={p} />
    </section>
  );
}

function Timeline({ project: p }: { project: ProjectDetailDto }) {
  const t = useT();
  const steps = [
    {
      label: t("Project created"),
      done: !!p.publishedAt,
      detail: p.publishedAt ? t.dateTime(p.publishedAt) : t("Setup not finished"),
    },
    {
      label: t("Vendors added"),
      done: p.proposalCount > 0,
      detail: p.proposalCount
        ? t.plural(p.proposalCount, "{n} vendor", "{n} vendors")
        : p.deadline
          ? t("Submission deadline {date}", { date: t.ymd(p.deadline) })
          : t("Add them in the Proposals tab"),
    },
    {
      label: t("AI analysis done"),
      done: p.status === "evaluated",
      detail: p.status === "evaluated" ? t("Results ready") : t("Run it once vendors are added"),
    },
  ];
  const current = steps.findIndex((s) => !s.done);

  return (
    <section aria-labelledby="timeline-title" className={card}>
      <CardHeader id="timeline-title" title={t("Progress")} />
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
                  {s.done ? ` ${t("(done)")}` : i === current ? ` ${t("(current)")}` : ""}
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
