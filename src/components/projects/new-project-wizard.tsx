"use client";

import { useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, Plus, Rocket, SkipForward, Trash2 } from "lucide-react";
import { cn } from "cn";
import { DocumentRow } from "@/components/documents/document-row";
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
  useSetProjectStandards,
  useUpdateProject,
  type ProjectInput,
} from "@/hooks/use-projects";
import { useProposals } from "@/hooks/use-proposals";
import { useSettings } from "@/hooks/use-settings";
import { ApiClientError } from "@/lib/api-client";
import type { DocumentDto, ProjectDetailDto } from "@/lib/api-types";
import { standardFitsProject } from "@/lib/domain";
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
  { n: 1, title: "Project", hint: "Title, category and the RFP", optional: false },
  { n: 2, title: "Standards", hint: "Rules every proposal must meet", optional: true },
  { n: 3, title: "Vendors", hint: "Proposals to evaluate", optional: true },
] as const;

/**
 * P8 guided form (user request): Project (title, category, at least one RFP file) → Standards
 * (only those that fit the category; create one from a rules file on the spot; skippable) →
 * Vendors (one or more, each with its commercial and technical proposal; skippable, can be added
 * later) → Create, which publishes the project and opens it. A draft is saved as soon as the
 * first RFP file is dropped; the URL (?id=&step=) resumes it after a refresh.
 */
export function NewProjectWizard() {
  const params = useSearchParams();
  const router = useRouter();
  const draftId = params.get("id");
  const step = Math.min(3, Math.max(1, Number(params.get("step")) || 1)) as 1 | 2 | 3;
  const { data: project, isLoading } = useProject(draftId);

  const go = (s: number, id = draftId) =>
    router.replace(
      `/projects/new?${new URLSearchParams({ ...(id ? { id } : {}), step: String(s) })}`,
      { scroll: false },
    );

  const waitingForDraft = !!draftId && (isLoading || !project);
  const ready = !!project && project.rfpDocuments.length > 0;
  const reachable = (n: number) => n === 1 || ready;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        eyebrow={
          project ? (
            <span className="font-mono tracking-normal normal-case">
              {project.code} · Draft saved
            </span>
          ) : (
            "New project"
          )
        }
        title="New project"
        description="Three short steps: the project and its RFP, the standards it must meet, and the vendors' proposals. Then run the AI analysis."
        actions={project && <DiscardDraft project={project} />}
      />
      <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <nav aria-label="Steps" className="lg:sticky lg:top-24 lg:self-start">
          <ol className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0">
            {STEPS.map((s) => {
              const current = s.n === step;
              const done = s.n < step || (s.n === 1 && ready);
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
                      "focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed",
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
                        {s.title}
                        {s.optional && (
                          <span className="ms-1.5 text-2xs font-normal text-ink-muted">
                            optional
                          </span>
                        )}
                      </span>
                      <span className="hidden text-xs text-ink-muted lg:block">{s.hint}</span>
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
                  <span className="caption-caps text-ink-muted">Step {step} of 3</span>
                  <h2
                    id="step-title"
                    className="font-heading text-lg font-semibold tracking-tight text-ink"
                  >
                    {STEPS[step - 1].title}
                  </h2>
                </header>
                {step === 1 && (
                  <ProjectStep project={project} onDraft={(id) => go(1, id)} onNext={(id) => go(2, id)} />
                )}
                {step === 2 && project && (
                  <StandardsStep project={project} onBack={() => go(1)} onNext={() => go(3)} />
                )}
                {step === 3 && project && <VendorsStep project={project} onBack={() => go(2)} />}
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
  onDraft,
  onNext,
}: {
  project?: ProjectDetailDto;
  /** The draft was created (first RFP file): keep its id in the URL. */
  onDraft: (id: string) => void;
  onNext: (id: string) => void;
}) {
  const { data: settings } = useSettings();
  const create = useCreateProject();
  const update = useUpdateProject(project?.id ?? "");
  const qc = useQueryClient();
  const remove = useDeleteProjectDocument(project?.id ?? "");
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
  const [uploadedHere, setUploadedHere] = useState(0);
  const draft = useRef<Promise<string> | null>(project ? Promise.resolve(project.id) : null);
  // Uploads read the latest fields (a drop can start before the next render).
  const valueRef = useRef(value);
  const change = (v: ProjectInput) => {
    valueRef.current = v;
    setValue(v);
  };

  const local = validateProject(value, {
    allowPastDeadline: !!project?.deadline && value.deadline === project.deadline,
  });
  const errors: ProjectErrors = touched
    ? { ...local, ...Object.fromEntries(Object.entries(serverErrors).filter(([, v]) => v)) }
    : {};
  const docs = project?.rfpDocuments ?? [];
  const docCount = Math.max(docs.length, uploadedHere);

  const payload = () => {
    const v = valueRef.current;
    return { ...v, name: v.name.trim(), description: v.description.trim(), notes: v.notes.trim() };
  };

  /** The draft exists once (several files dropped together share one creation). */
  const ensureDraft = () => {
    if (!draft.current) {
      setTouched(true);
      const check = validateProject(valueRef.current, { allowPastDeadline: false });
      if (hasErrors(check)) {
        return Promise.reject(new Error("Fill in the title and category first."));
      }
      draft.current = create.mutateAsync(payload()).then((created) => {
        toast.success(`Draft ${created.code} saved`);
        onDraft(created.id);
        return created.id;
      });
      draft.current.catch(() => (draft.current = null));
    }
    return draft.current;
  };

  const upload: UploadFn = async (file, onProgress) => {
    const id = await ensureDraft();
    await uploadFile<DocumentDto>(`/api/projects/${id}/documents`, file, onProgress);
    setUploadedHere((n) => n + 1);
    // By the id, not `project`: the first drop starts before the draft exists.
    await Promise.all([
      qc.invalidateQueries({ queryKey: projectsKey, exact: true }),
      qc.invalidateQueries({ queryKey: projectKey(id) }),
    ]);
  };

  const next = async () => {
    setTouched(true);
    setServerErrors({});
    if (hasErrors(local) || !project || docs.length === 0) return;
    try {
      await update.mutateAsync(payload());
      onNext(project.id);
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
    <div className="flex flex-col">
      <div className="flex flex-col gap-8 px-6 py-6">
        <ProjectDetailsForm
          value={value}
          onChange={change}
          errors={errors}
          autoFocus={!project}
          categoryNote={
            project && <CategoryChangeNote applied={project.standards} category={value.category} />
          }
        />
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-semibold text-ink">RFP documents</h3>
            <p className="text-[13px] text-ink-muted">
              The main RFP and any annexes or addenda, at least one file. The AI builds the
              evaluation checklist from them.
            </p>
          </div>
          {docs.length > 0 && (
            <ul className="flex flex-col gap-2" aria-label="Uploaded RFP documents">
              {docs.map((d) => (
                <DocumentRow
                  key={d.id}
                  doc={d}
                  nameMax={56}
                  onDelete={() =>
                    remove.mutateAsync(d.id).then(() => {
                      setUploadedHere((n) => Math.max(0, n - 1));
                      toast.success("Document removed.");
                    })
                  }
                  deleteDescription={`“${d.originalName}” will be removed from this project.`}
                />
              ))}
            </ul>
          )}
          <Dropzone
            label={docs.length ? "Add more RFP documents" : "RFP documents"}
            description="Drag and drop, or browse · PDF preferred"
            maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
            upload={upload}
            removeOnDone
          />
          {touched && docCount === 0 && (
            <p className="text-xs text-fail">Add at least one RFP document.</p>
          )}
        </div>
      </div>
      <StepFooter>
        <span className="text-xs text-ink-muted">
          {project ? "Saved as a draft until you create the project." : "Only you can see the draft."}
        </span>
        <Button
          onClick={() => void next()}
          loading={update.isPending}
          disabled={!project || docs.length === 0}
        >
          Continue <ArrowRight />
        </Button>
      </StepFooter>
    </div>
  );
}

/* ───────────────────────── Step 2 · Standards ───────────────────────── */
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
  const [creating, setCreating] = useState(false);

  const persist = async (ids: string[]) => {
    try {
      await save.mutateAsync(ids);
      onNext();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the standards.");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <p className="max-w-2xl leading-relaxed text-ink-2">
            Pick the standards this project must comply with. Marsa checks every proposal against
            each of their rules, separately from the RFP.{" "}
            {project.category === "General"
              ? "This is a General project, so every standard can apply."
              : `Only “${project.category}” and “General” standards are shown.`}
          </p>
          <Button variant="brand" onClick={() => setCreating(true)} className="shrink-0">
            <Plus /> New standard
          </Button>
        </div>
        <StandardsPicker value={selected} onChange={setSelected} category={project.category} />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-muted tabular-nums">{selected.length} selected</span>
          <Button variant="secondary" onClick={() => void persist([])} disabled={save.isPending}>
            <SkipForward /> Skip
          </Button>
          <Button loading={save.isPending} onClick={() => void persist(selected)}>
            Continue <ArrowRight />
          </Button>
        </span>
      </StepFooter>
      <NewStandardDialog
        open={creating}
        onOpenChange={setCreating}
        defaultCategory={project.category}
        onCreated={(std) => {
          if (standardFitsProject(std.category, project.category))
            setSelected((s) => [...s, std.id]);
          else toast.info(`${std.code} is a “${std.category}” standard: it doesn't fit this project.`);
        }}
      />
    </div>
  );
}

/* ───────────────────────── Step 3 · Vendors ───────────────────────── */
function VendorsStep({ project, onBack }: { project: ProjectDetailDto; onBack: () => void }) {
  const router = useRouter();
  const publish = useUpdateProject(project.id);
  const { data: proposals } = useProposals(project.id);
  const n = proposals?.length ?? 0;

  const createProject = async () => {
    try {
      if (project.status === "draft") await publish.mutateAsync({ status: "open" });
      toast.success(`${project.code} created`, {
        description: n
          ? `${n} vendor${n === 1 ? "" : "s"} ready for the AI analysis.`
          : "Add vendors from the project's Proposals tab when you have them.",
      });
      router.push(`/projects/${project.id}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't create the project.");
    }
  };

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-6 px-6 py-6">
        <p className="max-w-2xl leading-relaxed text-ink-2">
          Add each vendor with its two proposals: the commercial (financial) one and the technical
          one. You can skip this and add vendors later, even after an analysis, then run it again.
        </p>
        <VendorsEditor projectId={project.id} />
      </div>
      <StepFooter>
        <Button variant="ghost" onClick={onBack}>
          <ArrowLeft /> Back
        </Button>
        <span className="flex flex-wrap items-center gap-3">
          <span className="text-xs text-ink-muted tabular-nums">
            {n} vendor{n === 1 ? "" : "s"}
          </span>
          <Button size="lg" loading={publish.isPending} onClick={() => void createProject()}>
            <Rocket /> {n ? "Create project" : "Skip and create project"}
          </Button>
        </span>
      </StepFooter>
    </div>
  );
}

function DiscardDraft({ project }: { project: ProjectDetailDto }) {
  const router = useRouter();
  const remove = useDeleteProject();
  const [open, setOpen] = useState(false);
  if (project.status !== "draft") return null;
  return (
    <>
      <Button variant="ghost" onClick={() => setOpen(true)}>
        <Trash2 /> Discard draft
      </Button>
      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="Discard this draft?"
        description={`${project.code}, its RFP documents and any vendors added will be deleted.`}
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
