"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleAlert,
  CircleCheck,
  FileText,
  Megaphone,
  Pencil,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { DocumentRow } from "@/components/documents/document-row";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KeyValueList } from "@/components/data/key-value-list";
import {
  useCreateProject,
  useDeleteProject,
  useDeleteProjectDocument,
  useInvalidateProject,
  useProject,
  useSetProjectStandards,
  useUpdateProject,
  type ProjectInput,
} from "@/hooks/use-projects";
import { useSettings } from "@/hooks/use-settings";
import { ApiClientError } from "@/lib/api-client";
import type { DocumentDto, ProjectDetailDto } from "@/lib/api-types";
import { deadlineLabel, formatYmd } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";
import { uploadFile } from "@/lib/upload";
import {
  EMPTY_PROJECT,
  hasErrors,
  ProjectDetailsForm,
  validateProject,
  type ProjectErrors,
} from "./project-details-form";
import { StandardsPicker } from "./standards-picker";

const STEPS = [
  { n: 1, title: "Details", hint: "Name, category, deadline" },
  { n: 2, title: "RFP documents", hint: "What vendors must respond to" },
  { n: 3, title: "Standards", hint: "Rules every proposal must meet" },
  { n: 4, title: "Review & publish", hint: "Check and send to vendors" },
] as const;

/**
 * PRD FR-3 — create a project and its RFP. State lives in the URL (?id=&step=) so a refresh
 * resumes the draft. Steps fade in/out one at a time (user preference from Settings feedback).
 */
export function NewProjectWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const draftId = params.get("id");
  const step = Math.min(4, Math.max(1, Number(params.get("step")) || 1)) as 1 | 2 | 3 | 4;
  const { data: project, isLoading } = useProject(draftId);

  const go = (s: number, id = draftId) =>
    router.replace(
      `/projects/new?${new URLSearchParams({ ...(id ? { id } : {}), step: String(s) })}`,
      { scroll: false },
    );

  const waitingForDraft = !!draftId && (isLoading || !project);
  const reachable = (n: number) =>
    n === 1 || (!!project && (n < 4 || project.rfpDocuments.length > 0));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={
          project ? (
            <span className="font-mono tracking-normal normal-case">
              {project.code} · Draft saved
            </span>
          ) : (
            "New tender"
          )
        }
        title="New project"
        description="Publish an RFP to vendors. Marsa will later check every proposal against it and the standards you select."
        actions={project && <DiscardDraft project={project} />}
      />
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Steps" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {STEPS.map((s) => {
              const current = s.n === step;
              const done = s.n < step || (s.n === 1 && !!project);
              const can = reachable(s.n) && !waitingForDraft;
              return (
                <li key={s.n} className="shrink-0">
                  <button
                    type="button"
                    disabled={!can}
                    onClick={() => go(s.n)}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors outline-none",
                      "focus-visible:ring-3 focus-visible:ring-ring/25 disabled:cursor-not-allowed",
                      current
                        ? "text-ink"
                        : can
                          ? "text-ink-2 hover:bg-surface-muted"
                          : "text-ink-faint",
                    )}
                  >
                    {current && (
                      <motion.span
                        layoutId="wizard-step"
                        className="absolute inset-0 rounded-lg border border-border bg-surface shadow-xs"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                        current
                          ? "border-brand bg-brand text-on-brand"
                          : done
                            ? "border-brand/40 bg-brand-soft text-brand-ink"
                            : "border-border-strong bg-surface text-ink-muted",
                      )}
                    >
                      {done && !current ? (
                        <Check className="size-3.5" strokeWidth={3} aria-hidden />
                      ) : (
                        s.n
                      )}
                    </span>
                    <span className="relative flex flex-col leading-tight">
                      <span className="text-sm font-medium">{s.title}</span>
                      <span className="hidden text-xs text-ink-muted lg:block">{s.hint}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="max-w-3xl min-w-0">
          {waitingForDraft ? (
            <Skeleton className="h-96 rounded-xl" />
          ) : (
            <AnimatePresence mode="wait" initial={false}>
              <motion.section
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                aria-labelledby="step-title"
                className="flex flex-col rounded-xl border border-border bg-surface shadow-xs"
              >
                <header className="flex flex-col gap-1 border-b border-border/70 px-6 py-5">
                  <span className="text-2xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
                    Step {step} of 4
                  </span>
                  <h2
                    id="step-title"
                    className="font-heading text-lg font-semibold tracking-tight text-ink"
                  >
                    {STEPS[step - 1].title}
                  </h2>
                </header>
                {step === 1 && (
                  <DetailsStep
                    key={project?.id ?? "new"}
                    project={project}
                    onSaved={(id) => go(2, id)}
                  />
                )}
                {step === 2 && project && (
                  <DocumentsStep project={project} onBack={() => go(1)} onNext={() => go(3)} />
                )}
                {step === 3 && project && (
                  <StandardsStep project={project} onBack={() => go(2)} onNext={() => go(4)} />
                )}
                {step === 4 && project && <ReviewStep project={project} onEdit={(n) => go(n)} />}
              </motion.section>
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

function StepFooter({ children }: { children: React.ReactNode }) {
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 rounded-b-xl border-t border-border/70 bg-surface-muted/40 px-6 py-4">
      {children}
    </footer>
  );
}

/* ───────────────────────── Step 1 · Details ───────────────────────── */
function DetailsStep({
  project,
  onSaved,
}: {
  project?: ProjectDetailDto;
  onSaved: (id: string) => void;
}) {
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? "");
  const [value, setValue] = useState<ProjectInput>(
    project
      ? {
          name: project.name,
          description: project.description,
          category: project.category,
          deadline: project.deadline,
          notes: project.notes,
        }
      : EMPTY_PROJECT,
  );
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProjectErrors>({});
  const local = validateProject(value, {
    allowPastDeadline: !!project?.deadline && value.deadline === project.deadline,
  });
  const errors: ProjectErrors = touched
    ? { ...local, ...Object.fromEntries(Object.entries(serverErrors).filter(([, v]) => v)) }
    : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerErrors({});
    if (hasErrors(local)) return;
    const payload = {
      ...value,
      name: value.name.trim(),
      description: value.description.trim(),
      notes: value.notes.trim(),
    };
    try {
      if (project) {
        await update.mutateAsync(payload);
        onSaved(project.id);
      } else {
        const created = await create.mutateAsync(payload);
        toast.success(`Draft ${created.code} created`, {
          description: "Now add the RFP documents.",
        });
        onSaved(created.id);
      }
    } catch (err) {
      if (err instanceof ApiClientError && Array.isArray(err.details)) {
        setServerErrors(
          Object.fromEntries(
            (err.details as { path: string; message: string }[]).map((d) => [d.path, d.message]),
          ),
        );
      } else {
        toast.error(err instanceof Error ? err.message : "Couldn't save the project.");
      }
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col">
      <div className="px-6 py-6">
        <ProjectDetailsForm
          value={value}
          onChange={setValue}
          errors={errors}
          autoFocus={!project}
        />
      </div>
      <StepFooter>
        <span className="text-xs text-ink-muted">
          {project
            ? "Changes are saved when you continue."
            : "Continuing creates a draft that only you can see."}
        </span>
        <Button type="submit" loading={create.isPending || update.isPending}>
          Continue <ArrowRight />
        </Button>
      </StepFooter>
    </form>
  );
}

/* ───────────────────────── Step 2 · Documents ───────────────────────── */
function DocumentsStep({
  project,
  onBack,
  onNext,
}: {
  project: ProjectDetailDto;
  onBack: () => void;
  onNext: () => void;
}) {
  const { data: settings } = useSettings();
  const invalidate = useInvalidateProject(project.id);
  const remove = useDeleteProjectDocument(project.id);
  const maxMb = settings?.runtime.maxUploadMb ?? 50;

  const upload: UploadFn = async (file, onProgress) => {
    await uploadFile<DocumentDto>(`/api/projects/${project.id}/documents`, file, onProgress);
    await invalidate(); // the new row in the list is the confirmation (toasts would cover Continue)
  };
  const docs = project.rfpDocuments;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <p className="leading-relaxed text-ink-2">
          Upload the RFP: the main document and any annexes, specifications or addenda. Vendors
          respond to these files, and the AI reads them to build the evaluation checklist. Any
          format is accepted; PDF is preferred.
        </p>
        {docs.length > 0 && (
          <ul className="flex flex-col gap-2" aria-label="Uploaded RFP documents">
            {docs.map((d) => (
              <DocumentRow
                key={d.id}
                doc={d}
                nameMax={56}
                onDelete={() =>
                  remove.mutateAsync(d.id).then(() => toast.success("Document removed."))
                }
                deleteDescription={`“${d.originalName}” will be removed from this project.`}
              />
            ))}
          </ul>
        )}
        <Dropzone
          label={docs.length ? "Add more documents" : "RFP documents"}
          maxSizeMb={maxMb}
          upload={upload}
          removeOnDone
        />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <span className="flex items-center gap-3">
          <span className="text-xs text-ink-muted tabular-nums">
            {docs.length} document{docs.length === 1 ? "" : "s"}
          </span>
          {docs.length === 0 ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0}>
                  <Button disabled>
                    Continue <ArrowRight />
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>Upload at least one RFP document</TooltipContent>
            </Tooltip>
          ) : (
            <Button onClick={onNext}>
              Continue <ArrowRight />
            </Button>
          )}
        </span>
      </StepFooter>
    </div>
  );
}

/* ───────────────────────── Step 3 · Standards ───────────────────────── */
function StandardsStep({
  project,
  onBack,
  onNext,
}: {
  project: ProjectDetailDto;
  onBack: () => void;
  onNext: () => void;
}) {
  const save = useSetProjectStandards(project.id);
  const [selected, setSelected] = useState<string[]>(project.standards.map((s) => s.id));

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <p className="leading-relaxed text-ink-2">
          Choose the standards this tender must comply with. Active standards are pre-selected.
          Their rules join the RFP requirements in the evaluation checklist.
        </p>
        <StandardsPicker value={selected} onChange={setSelected} />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <Button
          loading={save.isPending}
          onClick={async () => {
            await save.mutateAsync(selected);
            onNext();
          }}
        >
          Continue <ArrowRight />
        </Button>
      </StepFooter>
    </div>
  );
}

/* ───────────────────────── Step 4 · Review ───────────────────────── */
function ReviewStep({
  project,
  onEdit,
}: {
  project: ProjectDetailDto;
  onEdit: (step: number) => void;
}) {
  const router = useRouter();
  const publish = useUpdateProject(project.id);
  const docs = project.rfpDocuments;
  const unreadable = docs.filter((d) => !d.aiReadable).length;
  const checks = [
    { ok: project.name.trim().length >= 3, label: "Project name" },
    {
      ok: docs.length > 0,
      label: `${docs.length} RFP document${docs.length === 1 ? "" : "s"} uploaded`,
    },
    {
      ok: unreadable === 0,
      warn: true,
      label: unreadable
        ? `${unreadable} document${unreadable === 1 ? "" : "s"} the AI can't read (legacy format)`
        : "All documents readable by the AI",
    },
    {
      ok: project.standards.length > 0,
      warn: true,
      label: project.standards.length
        ? `${project.standards.length} standard${project.standards.length === 1 ? "" : "s"} applied`
        : "No standards: proposals are checked against the RFP only",
    },
    {
      ok: !!project.deadline,
      warn: true,
      label: project.deadline ? deadlineLabel(project.deadline) : "No submission deadline set",
    },
  ];

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <ReviewBlock title="Details" icon={<Pencil />} onEdit={() => onEdit(1)}>
          <KeyValueList
            items={[
              { label: "Name", value: <span dir="auto">{project.name}</span> },
              { label: "Reference", value: <span className="font-mono">{project.code}</span> },
              { label: "Category", value: PROJECT_CATEGORY_LABEL[project.category] },
              {
                label: "Submission deadline",
                value: project.deadline ? formatYmd(project.deadline) : "—",
              },
            ]}
          />
          {project.description && (
            <p className="mt-3 text-[13px] leading-relaxed text-ink-muted">{project.description}</p>
          )}
        </ReviewBlock>
        <ReviewBlock
          title={`RFP documents (${docs.length})`}
          icon={<FileText />}
          onEdit={() => onEdit(2)}
        >
          <ul className="flex flex-col gap-1.5 text-[13px] text-ink-2">
            {docs.map((d) => (
              <li key={d.id} className="flex items-center gap-2" dir="auto">
                <FileText className="size-3.5 shrink-0 text-ink-faint" aria-hidden />
                <span className="truncate">{d.originalName}</span>
                {d.pageCount != null && (
                  <span className="shrink-0 text-ink-muted">· {d.pageCount} p.</span>
                )}
              </li>
            ))}
          </ul>
        </ReviewBlock>
        <ReviewBlock
          title={`Standards (${project.standards.length})`}
          icon={<ShieldCheck />}
          onEdit={() => onEdit(3)}
        >
          {project.standards.length ? (
            <div className="flex flex-wrap gap-2">
              {project.standards.map((s) => (
                <Pill key={s.id} tone="neutral">
                  <span className="font-mono">{s.code}</span> · {s.title}
                </Pill>
              ))}
            </div>
          ) : (
            <p className="text-[13px] text-ink-muted">None selected.</p>
          )}
        </ReviewBlock>
        <div
          className="flex flex-col gap-2 rounded-xl border border-border bg-surface-muted/40 p-4"
          aria-label="Readiness"
        >
          {checks.map((c) => (
            <p
              key={c.label}
              className={cn(
                "flex items-center gap-2 text-[13px]",
                c.ok ? "text-ink-2" : c.warn ? "text-partial" : "text-fail",
              )}
            >
              {c.ok ? (
                <CircleCheck className="size-4 text-ok" aria-hidden />
              ) : (
                <CircleAlert className="size-4" aria-hidden />
              )}
              {c.label}
            </p>
          ))}
        </div>
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={() => onEdit(3)}>
          <ArrowLeft /> Back
        </Button>
        <span className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              toast.success(`${project.code} saved as draft.`);
              router.push(`/projects/${project.id}`);
            }}
          >
            Save as draft
          </Button>
          <Button
            loading={publish.isPending}
            disabled={docs.length === 0}
            onClick={async () => {
              try {
                await publish.mutateAsync({ status: "open" });
                toast.success("Published to vendors", {
                  description: `${project.code} is now open for proposals.`,
                });
                router.push(`/projects/${project.id}`);
              } catch (err) {
                toast.error(err instanceof Error ? err.message : "Couldn't publish.");
              }
            }}
          >
            <Megaphone /> Publish to vendors
          </Button>
        </span>
      </StepFooter>
    </div>
  );
}

function ReviewBlock({
  title,
  icon,
  onEdit,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  onEdit: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-3 border-b border-border/70 pb-6 last-of-type:border-b-0 last-of-type:pb-0">
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-semibold text-ink [&_svg]:size-4 [&_svg]:text-ink-faint">
          {icon}
          {title}
        </h3>
        <Button variant="ghost" size="xs" onClick={onEdit} aria-label={`Edit ${title}`}>
          Edit
        </Button>
      </div>
      {children}
    </section>
  );
}

function DiscardDraft({ project }: { project: ProjectDetailDto }) {
  const router = useRouter();
  const remove = useDeleteProject();
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Trash2 /> Discard draft
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard this draft?"
        description={`${project.code} and its ${project.rfpDocuments.length} uploaded document(s) will be deleted.`}
        confirmLabel="Discard draft"
        onConfirm={async () => {
          await remove.mutateAsync(project.id);
          toast.success("Draft discarded.");
          router.push("/projects");
        }}
      />
    </>
  );
}
