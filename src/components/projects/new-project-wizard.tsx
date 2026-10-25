"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Rocket, SkipForward, Trash2 } from "lucide-react";
import { cn } from "cn";
import { DocumentRow } from "@/components/documents/document-row";
import { useT } from "@/components/i18n-provider";
import { VendorsEditor } from "@/components/proposals/vendors-editor";
import { NewStandardDialog } from "@/components/standards/new-standard-dialog";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { PageHeader } from "@/components/ui/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCreateProject,
  useDeleteProject,
  useDeleteProjectDocument,
  projectKey,
  projectsKey,
  useProject,
  useUpdateProject,
  type ProjectInput,
} from "@/hooks/use-projects";
import { proposalsKey, useProposals } from "@/hooks/use-proposals";
import { useSettings } from "@/hooks/use-settings";
import { useStandards } from "@/hooks/use-standards";
import { api } from "@/lib/api-client";
import type { DocumentDto, ProjectDetailDto } from "@/lib/api-types";
import { standardFitsProject, type ProjectCategory } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";
import { uploadFile } from "@/lib/upload";
import {
  CategoryChangeNote,
  EMPTY_PROJECT,
  hasErrors,
  ProjectDetailsForm,
  validateProject,
  type ProjectErrors,
} from "./project-details-form";
import { StandardsPicker } from "./standards-picker";

const STEPS = [
  { n: 1, title: msg("Project"), hint: msg("Title, category and the RFP"), optional: false },
  { n: 2, title: msg("Standards"), hint: msg("Rules every proposal must meet"), optional: true },
  { n: 3, title: msg("Vendors"), hint: msg("Proposals to evaluate"), optional: true },
] as const;

/** What step 1 must show and focus when Create finds something missing. */
type Missing = { field: "fields" | "rfp"; at: number };

const fromProject = (p: ProjectDetailDto): ProjectInput => ({
  name: p.name,
  description: p.description,
  category: p.category,
  deadline: p.deadline,
  notes: p.notes,
  estimateAmount: p.estimateAmount,
  estimateCurrency: p.estimateCurrency,
});
const trimmed = (v: ProjectInput) => ({
  ...v,
  name: v.name.trim(),
  description: v.description.trim(),
  notes: v.notes.trim(),
});

/**
 * P8 guided form (user request): Project (title, category, at least one RFP file) → Standards
 * (only those that fit the category; create one from a rules file on the spot; skippable) →
 * Vendors (one or more, each with its commercial and technical proposal; skippable, can be added
 * later) → Create, which publishes the project and opens it.
 *
 * Every step can be opened at any time, even before anything is filled in (user, 2026-10-23: to
 * show the steps without creating anything). The form keeps its values across steps; a draft is
 * saved only when something must be stored: the first RFP file, a vendor, or Create. Create checks
 * the required items and, if one is missing, goes back to step 1 and focuses exactly that field.
 * The URL (?id=&step=) resumes a saved draft after a refresh.
 */
export function NewProjectWizard() {
  const t = useT();
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const draftId = params.get("id");
  const step = Math.min(3, Math.max(1, Number(params.get("step")) || 1)) as 1 | 2 | 3;
  const { data: project, isLoading } = useProject(draftId);
  const create = useCreateProject();

  // The step-1 fields live here so they survive moving between steps with no draft yet.
  const [edited, setEdited] = useState<ProjectInput | null>(null);
  const fields = edited ?? (project ? fromProject(project) : EMPTY_PROJECT);
  const fieldsRef = useRef<ProjectInput>(EMPTY_PROJECT);
  const setFields = (v: ProjectInput) => {
    fieldsRef.current = v;
    setEdited(v);
  };
  // Standards picked before a draft exists: applied when the draft is created.
  const [pendingStandards, setPendingStandards] = useState<string[] | null>(null);
  const [missing, setMissing] = useState<Missing | null>(null);
  const [creating, setCreating] = useState(false);

  const go = (s: number, id = draftId) =>
    router.replace(
      `/projects/new?${new URLSearchParams({ ...(id ? { id } : {}), step: String(s) })}`,
      { scroll: false },
    );

  /** The draft, created once (several files dropped together share one creation). */
  const draft = useRef<Promise<string> | null>(null);
  const ensureDraft = (stayOn: number): Promise<string> => {
    if (draftId) return Promise.resolve(draftId);
    if (!draft.current) {
      const v = edited ?? fieldsRef.current;
      if (hasErrors(validateProject(v, t))) {
        return Promise.reject(
          new Error(t("Add the project name in step 1 first (at least 3 characters).")),
        );
      }
      draft.current = create.mutateAsync(trimmed(v)).then(async (created) => {
        if (pendingStandards !== null) await putStandards(created.id, pendingStandards);
        toast.success(t("Draft {code} saved", { code: created.code }));
        go(stayOn, created.id);
        return created.id;
      });
      draft.current.catch(() => (draft.current = null));
    }
    return draft.current;
  };

  const putStandards = async (id: string, ids: string[]) => {
    await api(`/api/projects/${id}/standards`, {
      method: "PUT",
      body: JSON.stringify({ standardIds: ids }),
    });
    await qc.invalidateQueries({ queryKey: projectKey(id) });
  };

  /** Back to step 1, with its errors shown and the missing item focused. */
  const requireStep1 = (field: Missing["field"], message: string) => {
    setMissing({ field, at: Date.now() });
    toast.error(message);
    go(1);
  };

  const createProject = async () => {
    const check = validateProject(fields, t, {
      allowPastDeadline: !!project?.deadline && fields.deadline === project.deadline,
    });
    if (hasErrors(check)) {
      return requireStep1(
        "fields",
        Object.values(check).find(Boolean) ?? t("Fill in the project details."),
      );
    }
    if (!project || project.rfpDocuments.length === 0) {
      return requireStep1("rfp", t("Add at least one RFP document."));
    }
    setCreating(true);
    try {
      await api(`/api/projects/${project.id}`, {
        method: "PATCH",
        body: JSON.stringify(trimmed(fields)),
      });
      if (pendingStandards !== null) await putStandards(project.id, pendingStandards);
      if (project.status === "draft") {
        await api(`/api/projects/${project.id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: "open" }),
        });
      }
      await qc.invalidateQueries({ queryKey: projectsKey });
      const n = qc.getQueryData<unknown[]>(proposalsKey(project.id))?.length ?? 0;
      toast.success(t("{code} created", { code: project.code }), {
        description: n
          ? t.plural(
              n,
              "{n} vendor ready for the AI analysis.",
              "{n} vendors ready for the AI analysis.",
            )
          : t("Add vendors from the project's Proposals tab when you have them."),
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Couldn't create the project."));
    } finally {
      setCreating(false);
    }
  };

  const waitingForDraft = !!draftId && (isLoading || !project);
  const ready =
    !!project && project.rfpDocuments.length > 0 && !hasErrors(validateProject(fields, t));

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={
          project ? (
            <span className="font-mono tracking-normal normal-case">
              {project.code} · {t("Draft saved")}
            </span>
          ) : (
            t("New project")
          )
        }
        title={t("New project")}
        description={t(
          "Three short steps: the project and its RFP, the standards it must meet, and the vendors' proposals. Then run the AI analysis.",
        )}
        actions={project && <DiscardDraft project={project} />}
      />
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label={t("Steps")} className="lg:sticky lg:top-24 lg:self-start">
          <ol className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {STEPS.map((s) => {
              const current = s.n === step;
              const done = s.n < step || (s.n === 1 && ready);
              return (
                <li key={s.n} className="shrink-0">
                  <button
                    type="button"
                    disabled={waitingForDraft}
                    onClick={() => go(s.n)}
                    aria-current={current ? "step" : undefined}
                    className={cn(
                      "relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start transition-colors outline-none",
                      "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
                      current ? "text-ink" : "text-ink-2 hover:bg-surface-muted",
                    )}
                  >
                    {current && (
                      <motion.span
                        layoutId="wizard-step"
                        className="absolute inset-0 rounded-lg border border-border bg-surface shadow-sm"
                        transition={{ type: "spring", stiffness: 420, damping: 36 }}
                      />
                    )}
                    <span
                      className={cn(
                        "relative flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold tabular-nums transition-colors",
                        current
                          ? "border-transparent bg-rta text-white"
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
                      <span className="text-sm font-medium">
                        {t(s.title)}
                        {s.optional && (
                          <span className="ms-1.5 text-2xs font-normal text-ink-muted">
                            {t("optional")}
                          </span>
                        )}
                      </span>
                      <span className="hidden text-xs text-ink-muted lg:block">{t(s.hint)}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </nav>

        <div className="max-w-4xl min-w-0">
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
                className="flex flex-col rounded-xl border border-border bg-surface shadow-sm"
              >
                <header className="flex flex-col gap-1 border-b border-border/70 px-6 py-5">
                  <span className="caption-caps text-ink-muted">
                    {t("Step {step} of {total}", { step, total: STEPS.length })}
                  </span>
                  <h2
                    id="step-title"
                    className="font-heading text-lg font-semibold tracking-tight text-ink"
                  >
                    {t(STEPS[step - 1].title)}
                  </h2>
                </header>
                {step === 1 && (
                  <ProjectStep
                    key={missing?.at ?? 0}
                    project={project}
                    fields={fields}
                    onFields={setFields}
                    ensureDraft={() => ensureDraft(1)}
                    missing={missing}
                    onNext={() => go(2)}
                  />
                )}
                {step === 2 && (
                  <StandardsStep
                    project={project}
                    category={fields.category}
                    pending={pendingStandards}
                    onPending={setPendingStandards}
                    onBack={() => go(1)}
                    onNext={() => go(3)}
                  />
                )}
                {step === 3 && (
                  <VendorsStep
                    project={project}
                    ensureDraft={() => ensureDraft(3)}
                    creating={creating}
                    onCreate={() => void createProject()}
                    onBack={() => go(2)}
                  />
                )}
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

/* ───────────────────────── Step 1 · Project ───────────────────────── */
function ProjectStep({
  project,
  fields,
  onFields,
  ensureDraft,
  missing,
  onNext,
}: {
  project?: ProjectDetailDto;
  fields: ProjectInput;
  onFields: (v: ProjectInput) => void;
  /** Creates the draft (first RFP file) and keeps its id in the URL. */
  ensureDraft: () => Promise<string>;
  /** Set when Create found something missing: show the errors and focus that item. */
  missing: Missing | null;
  onNext: () => void;
}) {
  const t = useT();
  const { data: settings } = useSettings();
  const update = useUpdateProject(project?.id ?? "");
  const qc = useQueryClient();
  const remove = useDeleteProjectDocument(project?.id ?? "");
  const [touched, setTouched] = useState(!!missing);
  const [uploadedHere, setUploadedHere] = useState(0);
  const formRef = useRef<HTMLDivElement>(null);
  const rfpRef = useRef<HTMLDivElement>(null);

  const local = validateProject(fields, t, {
    allowPastDeadline: !!project?.deadline && fields.deadline === project.deadline,
  });
  const errors: ProjectErrors = touched ? local : {};
  const docs = project?.rfpDocuments ?? [];
  const docCount = Math.max(docs.length, uploadedHere);

  // Create sent us back here: focus the first invalid field, or bring the RFP drop zone into view.
  useEffect(() => {
    if (!missing) return;
    const raf = requestAnimationFrame(() => {
      if (missing.field === "rfp") {
        rfpRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
        rfpRef.current?.querySelector<HTMLElement>("button, input")?.focus({ preventScroll: true });
      } else {
        formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [missing]);

  const upload: UploadFn = async (file, onProgress) => {
    let id: string;
    try {
      id = await ensureDraft();
    } catch (err) {
      setTouched(true);
      throw err;
    }
    await uploadFile<DocumentDto>(`/api/projects/${id}/documents`, file, onProgress);
    setUploadedHere((n) => n + 1);
    // By the id, not `project`: the first drop starts before the draft exists.
    await Promise.all([
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
      qc.invalidateQueries({ queryKey: projectKey(id) }),
    ]);
  };

  // Continue always moves on (nothing is required to look at the next steps); a saved draft gets
  // the edited fields when they are valid. Create checks everything at the end.
  const next = async () => {
    if (project && !hasErrors(local)) {
      try {
        await update.mutateAsync(trimmed(fields));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : t("Couldn't save the project."));
        return;
      }
    }
    onNext();
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-8 px-6 py-6">
        <div ref={formRef}>
          <ProjectDetailsForm
            value={fields}
            onChange={onFields}
            errors={errors}
            autoFocus={!project && !missing}
            categoryNote={
              project && (
                <CategoryChangeNote applied={project.standards} category={fields.category} />
              )
            }
          />
        </div>
        <div
          ref={rfpRef}
          className={cn(
            "flex scroll-mt-24 flex-col gap-3 rounded-xl",
            missing?.field === "rfp" && docCount === 0 && "marsa-pulse",
          )}
        >
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-ink">{t("RFP documents")}</h3>
            <p className="text-[13px] text-ink-muted">
              {t(
                "The main RFP and any annexes or addenda, at least one file. The AI builds the evaluation checklist from them.",
              )}
            </p>
          </div>
          {docs.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label={t("Uploaded RFP documents")}>
              {docs.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  nameMax={56}
                  onDelete={() =>
                    remove.mutateAsync(d.id).then(() => {
                      setUploadedHere((n) => Math.max(0, n - 1));
                      toast.success(t("Document removed."));
                    })
                  }
                  deleteDescription={t("“{name}” will be removed from this project.", {
                    name: d.originalName,
                  })}
                />
              ))}
            </ul>
          )}
          <Dropzone
            label={docs.length ? t("Add more RFP documents") : t("RFP documents")}
            description={t("Drag and drop, or browse · PDF preferred")}
            maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
            upload={upload}
            removeOnDone
          />
          {touched && docCount === 0 && (
            <p className="text-xs text-fail">{t("Add at least one RFP document.")}</p>
          )}
        </div>
      </div>
      <StepFooter>
        <span className="text-xs text-ink-muted">
          {project
            ? t("Saved as a draft until you create the project.")
            : t("Nothing is saved until you drop the RFP or create the project.")}
        </span>
        <Button onClick={() => void next()} loading={update.isPending}>
          {t("Continue")} <ArrowRight className="rtl:rotate-180" />
        </Button>
      </StepFooter>
    </div>
  );
}

/* ───────────────────────── Step 2 · Standards ───────────────────────── */
function StandardsStep({
  project,
  category,
  pending,
  onPending,
  onBack,
  onNext,
}: {
  project?: ProjectDetailDto;
  category: ProjectCategory;
  /** The choice made before a draft exists (null: none made yet). */
  pending: string[] | null;
  onPending: (ids: string[]) => void;
  onBack: () => void;
  onNext: () => void;
}) {
  const t = useT();
  const qc = useQueryClient();
  const { data: standards } = useStandards();
  const [picked, setPicked] = useState<string[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [saving, setSaving] = useState(false);
  // Like a new project on the server: the active standards that fit the category come ticked.
  const defaults = (standards ?? [])
    .filter((s) => s.isActive && standardFitsProject(s.category, category))
    .map((s) => s.id);
  const selected = picked ?? pending ?? (project ? project.standards.map((s) => s.id) : defaults);

  const done = async (ids: string[], skip = false) => {
    // No draft yet, or the category was changed and not saved yet: keep the choice, it is applied
    // when the draft is created or at Create (after the category). Left untouched, nothing is
    // recorded and the project keeps the standard default (active standards of its category).
    if (!project || project.category !== category) {
      if (skip || picked !== null) onPending(ids);
      onNext();
      return;
    }
    setSaving(true);
    try {
      await api(`/api/projects/${project.id}/standards`, {
        method: "PUT",
        body: JSON.stringify({ standardIds: ids }),
      });
      await qc.invalidateQueries({ queryKey: projectKey(project.id) });
      onPending(ids);
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("Couldn't save the standards."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl leading-relaxed text-ink-2">
            {t(
              "Pick the standards this project must comply with. {app} checks every proposal against each of their rules, separately from the RFP.",
              { app: t.appName },
            )}{" "}
            {category === "General"
              ? t("This is a General project, so every standard can apply.")
              : t("Only “{category}” and “General” standards are shown.", {
                  category: t(PROJECT_CATEGORY_LABEL[category]),
                })}
          </p>
          <Button variant="brand" onClick={() => setCreating(true)} className="shrink-0">
            <Plus /> {t("New standard")}
          </Button>
        </div>
        <StandardsPicker value={selected} onChange={setPicked} category={category} />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="rtl:rotate-180" /> {t("Back")}
        </Button>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-muted tabular-nums">
            {t("{n} selected", { n: selected.length })}
          </span>
          <Button variant="secondary" onClick={() => void done([], true)} disabled={saving}>
            <SkipForward className="rtl:rotate-180" /> {t("Skip")}
          </Button>
          <Button loading={saving} onClick={() => void done(selected)}>
            {t("Continue")} <ArrowRight className="rtl:rotate-180" />
          </Button>
        </span>
      </StepFooter>
      <NewStandardDialog
        open={creating}
        onOpenChange={setCreating}
        defaultCategory={category}
        onCreated={(std) => {
          if (standardFitsProject(std.category, category)) setPicked([...selected, std.id]);
          else
            toast.info(
              t("{code} is a “{category}” standard: it doesn't fit this project.", {
                code: std.code,
                category: t(PROJECT_CATEGORY_LABEL[std.category]),
              }),
            );
        }}
      />
    </div>
  );
}

/* ───────────────────────── Step 3 · Vendors ───────────────────────── */
function VendorsStep({
  project,
  ensureDraft,
  creating,
  onCreate,
  onBack,
}: {
  project?: ProjectDetailDto;
  ensureDraft: () => Promise<string>;
  creating: boolean;
  onCreate: () => void;
  onBack: () => void;
}) {
  const t = useT();
  const { data: proposals } = useProposals(project?.id ?? null);
  const n = proposals?.length ?? 0;

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <p className="max-w-2xl leading-relaxed text-ink-2">
          {t(
            "Add each vendor with its two proposals: the commercial (financial) one and the technical one. You can skip this and add vendors later, even after an analysis, then run it again.",
          )}
        </p>
        <VendorsEditor
          projectId={project?.id ?? null}
          category={project?.category}
          ensureProject={ensureDraft}
        />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft className="rtl:rotate-180" /> {t("Back")}
        </Button>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-muted tabular-nums">
            {t.plural(n, "{n} vendor", "{n} vendors")}
          </span>
          <Button size="lg" loading={creating} onClick={onCreate}>
            <Rocket /> {n ? t("Create project") : t("Skip and create project")}
          </Button>
        </span>
      </StepFooter>
    </div>
  );
}

function DiscardDraft({ project }: { project: ProjectDetailDto }) {
  const t = useT();
  const router = useRouter();
  const remove = useDeleteProject();
  const [open, setOpen] = useState(false);
  if (project.status !== "draft") return null;
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Trash2 /> {t("Discard draft")}
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title={t("Discard this draft?")}
        description={t("{code}, its RFP documents and any vendors added will be deleted.", {
          code: project.code,
        })}
        confirmLabel={t("Discard draft")}
        onConfirm={async () => {
          await remove.mutateAsync(project.id);
          toast.success(t("Draft discarded."));
          router.push("/projects");
        }}
      />
    </>
  );
}
