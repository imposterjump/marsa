"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import {
  ArrowRight,
  CircleAlert,
  CircleCheck,
  FlaskConical,
  Loader2,
  RotateCcw,
  Send,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Dropzone, type DropzoneItem } from "@/components/ui/dropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useProjects } from "@/hooks/use-projects";
import {
  useCreateVendor,
  useProposals,
  useSubmitProposal,
  useVendors,
  type SubmissionFile,
  type VendorInput,
} from "@/hooks/use-proposals";
import { useSettings } from "@/hooks/use-settings";
import { ApiClientError } from "@/lib/api-client";
import type { ProjectSummaryDto, VendorDto } from "@/lib/api-types";
import { deadlineLabel } from "@/lib/format";
import { middleTruncate } from "@/lib/files";

type VendorMode = "existing" | "new";
const EMPTY_VENDOR: VendorInput = { name: "", country: "", contactName: "", contactEmail: "" };

interface Result {
  projectId: string;
  projectCode: string;
  vendorName: string;
  replaced: boolean;
  files: { name: string; kind: string; pct: number; error?: string }[];
  done: boolean;
}

/**
 * PRD FR-4.2 demo tool: plays the vendor's side of the tender. A real vendor would upload
 * through its own supplier-portal account; here one page picks the tender, the vendor and
 * the two envelopes (commercial + technical) and submits them.
 */
export function VendorPortal() {
  const params = useSearchParams();
  const { data: projects, isLoading } = useProjects();
  const open = (projects ?? []).filter((p) => p.status === "open");
  const preselect = params.get("project");
  const [projectId, setProjectId] = useState<string | null>(null);
  const project =
    open.find((p) => p.id === (projectId ?? preselect)) ??
    (open.length === 1 ? open[0] : undefined);
  const [round, setRound] = useState(0); // remounts the form after "Submit another"
  const [result, setResult] = useState<Result | null>(null);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start gap-3 rounded-xl border border-info/25 bg-info-soft/50 px-4 py-3 text-[13px] text-ink-2">
        <FlaskConical className="mt-0.5 size-4 shrink-0 text-info" aria-hidden />
        <span>
          <strong className="font-semibold text-ink">Demo tool.</strong> This page simulates a
          vendor submitting its bid. In production, vendors would upload through their own
          supplier-portal accounts.
        </span>
      </div>
      <PageHeader
        eyebrow="Vendor side"
        title="Vendor simulator"
        description="Submit a vendor's commercial and technical proposals to an open tender. The proposal appears in the project's Proposals tab."
      />

      {isLoading ? (
        <Skeleton className="h-[520px] max-w-3xl rounded-xl" />
      ) : open.length === 0 ? (
        <div className="max-w-3xl rounded-2xl border border-dashed border-border-strong bg-surface/60">
          <EmptyState
            size="lg"
            art={<Send className="size-12 text-ink-faint" strokeWidth={1.25} />}
            title="No tender is open for proposals"
            description="Publish a project to vendors first (Projects → a project → Publish to vendors)."
            actions={
              <Button asChild variant="secondary">
                <Link href="/projects">Go to Projects</Link>
              </Button>
            }
          />
        </div>
      ) : result ? (
        <ResultPanel
          result={result}
          onAgain={() => {
            setResult(null);
            setRound((r) => r + 1);
          }}
        />
      ) : (
        <SubmissionForm
          key={round}
          projects={open}
          project={project}
          onProject={setProjectId}
          onResult={setResult}
        />
      )}
    </div>
  );
}

function Section({
  n,
  title,
  children,
  hint,
}: {
  n: number;
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs">
      <header className="flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-ink tabular-nums">
          {n}
        </span>
        <span className="flex flex-col gap-0.5">
          <h2 className="font-heading text-base font-semibold tracking-tight text-ink">{title}</h2>
          {hint && <span className="text-[13px] text-ink-muted">{hint}</span>}
        </span>
      </header>
      {children}
    </section>
  );
}

function SubmissionForm({
  projects,
  project,
  onProject,
  onResult,
}: {
  projects: ProjectSummaryDto[];
  project?: ProjectSummaryDto;
  onProject: (id: string) => void;
  onResult: (r: Result) => void;
}) {
  const { data: settings } = useSettings();
  const { data: vendors } = useVendors();
  const { data: existing } = useProposals(project?.id ?? "none");
  const createVendor = useCreateVendor();
  const submit = useSubmitProposal(project?.id ?? "none");
  const [mode, setMode] = useState<VendorMode>("existing");
  const [vendorId, setVendorId] = useState<string>("");
  const [vendor, setVendor] = useState<VendorInput>(EMPTY_VENDOR);
  const [commercial, setCommercial] = useState<DropzoneItem[]>([]);
  const [technical, setTechnical] = useState<DropzoneItem[]>([]);
  const [touched, setTouched] = useState(false);
  const [vendorError, setVendorError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const maxMb = settings?.runtime.maxUploadMb ?? 50;

  const vendorList = vendors ?? [];
  const effectiveMode: VendorMode = vendorList.length === 0 ? "new" : mode;
  const chosen = vendorList.find((v) => v.id === vendorId);
  const already = chosen && existing?.some((p) => p.vendorId === chosen.id);

  const errors = {
    project: !project ? "Choose the tender." : null,
    vendor:
      effectiveMode === "existing"
        ? !chosen
          ? "Choose the vendor."
          : null
        : vendor.name.trim().length < 2
          ? "Enter the vendor's company name."
          : vendor.contactEmail && !/^\S+@\S+\.\S+$/.test(vendor.contactEmail)
            ? "Enter a valid email address."
            : vendorError,
    commercial: commercial.length === 0 ? "Add the commercial proposal (at least one file)." : null,
    technical: technical.length === 0 ? "Add the technical proposal (at least one file)." : null,
  };
  const show = (e: string | null) => (touched ? e : null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (Object.values(errors).some(Boolean) || !project) return;
    setBusy(true);
    try {
      let v: VendorDto | undefined = chosen;
      if (effectiveMode === "new") {
        try {
          v = await createVendor.mutateAsync({ ...vendor, name: vendor.name.trim() });
        } catch (err) {
          setVendorError(err instanceof ApiClientError && err.status === 409 ? err.message : null);
          if (!(err instanceof ApiClientError && err.status === 409)) throw err;
          return;
        }
      }
      if (!v) return;
      const files: SubmissionFile[] = [
        ...commercial.map((i) => ({ file: i.file, kind: "commercial" as const })),
        ...technical.map((i) => ({ file: i.file, kind: "technical" as const })),
      ];
      const base: Result = {
        projectId: project.id,
        projectCode: project.code,
        vendorName: v.name,
        replaced: !!already,
        files: files.map((f) => ({ name: f.file.name, kind: f.kind, pct: 0 })),
        done: false,
      };
      onResult(base);
      let live = base;
      const update = (next: Result) => {
        live = next;
        onResult(next);
      };
      const res = await submit.mutateAsync({
        vendorId: v.id,
        files,
        onFileProgress: (i, pct) =>
          update({ ...live, files: live.files.map((f, j) => (j === i ? { ...f, pct } : f)) }),
      });
      update({
        ...live,
        replaced: res.proposal.replaced,
        done: true,
        files: live.files.map((f) => {
          const failed = res.failed.find((x) => x.name === f.name);
          return failed ? { ...f, error: failed.message } : { ...f, pct: 100 };
        }),
      });
      if (res.failed.length) toast.error(`${res.failed.length} file(s) failed to upload.`);
      else toast.success(`${v.name}'s proposal submitted to ${project.code}.`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't submit the proposal.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={onSubmit} noValidate className="flex max-w-3xl flex-col gap-6">
      <Section n={1} title="Tender" hint="Only tenders open for proposals are listed.">
        <Field label="Open tender" error={show(errors.project)}>
          <Select value={project?.id ?? ""} onValueChange={onProject}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Choose a tender" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <span className="font-mono text-xs text-ink-muted">{p.code}</span>{" "}
                  {middleTruncate(p.name, 70)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        {project && (
          <p className="-mt-2 text-xs text-ink-muted">
            {project.rfpCount} RFP document{project.rfpCount === 1 ? "" : "s"} ·{" "}
            {project.deadline ? deadlineLabel(project.deadline) : "No deadline"} ·{" "}
            {project.proposalCount} proposal
            {project.proposalCount === 1 ? "" : "s"} received
          </p>
        )}
      </Section>

      <Section n={2} title="Vendor" hint="The company submitting the bid.">
        {vendorList.length > 0 && (
          <SegmentedControl<VendorMode>
            aria-label="Vendor"
            size="sm"
            value={effectiveMode}
            onValueChange={(m) => {
              setMode(m);
              setVendorError(null);
            }}
            options={[
              { value: "existing", label: "Existing vendor" },
              { value: "new", label: "New vendor" },
            ]}
            className="w-fit"
          />
        )}
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={effectiveMode}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
          >
            {effectiveMode === "existing" ? (
              <div className="flex flex-col gap-3">
                <Field label="Vendor" error={show(errors.vendor)}>
                  <Select value={vendorId} onValueChange={setVendorId}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Choose a vendor" />
                    </SelectTrigger>
                    <SelectContent>
                      {vendorList.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          {v.name}
                          {v.country && <span className="text-ink-muted"> · {v.country}</span>}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                {already && (
                  <p className="flex items-start gap-2 rounded-lg bg-partial-soft/60 px-3 py-2 text-xs text-ink-2">
                    <CircleAlert className="mt-px size-3.5 shrink-0 text-partial" aria-hidden />
                    {chosen.name} already submitted to this tender. Submitting again replaces its
                    previous files.
                  </p>
                )}
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Company name" error={show(errors.vendor)} className="sm:col-span-2">
                  <Input
                    value={vendor.name}
                    onChange={(e) => {
                      setVendor({ ...vendor, name: e.target.value });
                      setVendorError(null);
                    }}
                    placeholder="e.g. Harborline Systems"
                    dir="auto"
                  />
                </Field>
                <Field label="Country" optional>
                  <Input
                    value={vendor.country}
                    onChange={(e) => setVendor({ ...vendor, country: e.target.value })}
                  />
                </Field>
                <Field label="Contact name" optional>
                  <Input
                    value={vendor.contactName}
                    onChange={(e) => setVendor({ ...vendor, contactName: e.target.value })}
                  />
                </Field>
                <Field label="Contact email" optional className="sm:col-span-2">
                  <Input
                    type="email"
                    value={vendor.contactEmail}
                    onChange={(e) => setVendor({ ...vendor, contactEmail: e.target.value })}
                  />
                </Field>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Section>

      <Section
        n={3}
        title="Proposal documents"
        hint="Two envelopes, as the RFP requires: the financial (commercial) proposal and the technical proposal."
      >
        <div className="grid gap-6 lg:grid-cols-2 [&>*]:min-w-0">
          <div className="flex flex-col gap-2">
            <Dropzone
              label="Commercial proposal"
              maxSizeMb={maxMb}
              maxFiles={10}
              onChange={setCommercial}
            />
            {show(errors.commercial) && <p className="text-xs text-fail">{errors.commercial}</p>}
          </div>
          <div className="flex flex-col gap-2">
            <Dropzone
              label="Technical proposal"
              maxSizeMb={maxMb}
              maxFiles={10}
              onChange={setTechnical}
            />
            {show(errors.technical) && <p className="text-xs text-fail">{errors.technical}</p>}
          </div>
        </div>
      </Section>

      <div className="flex flex-wrap items-center justify-end gap-3">
        <span className="me-auto text-xs text-ink-muted">
          {commercial.length + technical.length} file
          {commercial.length + technical.length === 1 ? "" : "s"} ready
        </span>
        <Button type="submit" size="lg" loading={busy}>
          <Send /> Submit proposal
        </Button>
      </div>
    </form>
  );
}

function ResultPanel({ result, onAgain }: { result: Result; onAgain: () => void }) {
  const failed = result.files.filter((f) => f.error).length;
  return (
    <section
      aria-live="polite"
      className="flex max-w-3xl flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs"
    >
      <header className="flex items-start gap-3">
        {!result.done ? (
          <Loader2 className="mt-0.5 size-5 animate-spin text-brand" aria-hidden />
        ) : failed ? (
          <CircleAlert className="mt-0.5 size-5 text-partial" aria-hidden />
        ) : (
          <CircleCheck className="mt-0.5 size-5 text-ok" aria-hidden />
        )}
        <span className="flex flex-col gap-1">
          <h2 className="font-heading text-base font-semibold tracking-tight text-ink">
            {!result.done
              ? `Submitting ${result.vendorName}'s proposal…`
              : failed
                ? `Submitted with ${failed} failed file${failed === 1 ? "" : "s"}`
                : result.replaced
                  ? "Proposal resubmitted"
                  : "Proposal submitted"}
          </h2>
          <span className="text-[13px] text-ink-muted">
            {result.vendorName} → {result.projectCode}
            {result.replaced && " · the previous files were replaced"}
          </span>
        </span>
      </header>
      <ul className="flex flex-col gap-2">
        {result.files.map((f) => (
          <li
            key={`${f.kind}-${f.name}`}
            className="flex flex-col gap-1.5 rounded-lg border border-border px-3 py-2.5"
          >
            <span className="flex items-center justify-between gap-3 text-[13px]">
              <span className="min-w-0 truncate text-ink" dir="auto">
                <span className="me-2 text-2xs font-semibold tracking-wide text-ink-muted uppercase">
                  {f.kind}
                </span>
                {f.name}
              </span>
              <span
                className={cn(
                  "shrink-0 text-xs tabular-nums",
                  f.error ? "text-fail" : "text-ink-muted",
                )}
              >
                {f.error ? "Failed" : `${Math.round(f.pct)}%`}
              </span>
            </span>
            {f.error ? (
              <span className="text-xs text-fail">{f.error}</span>
            ) : (
              <span className="h-1 overflow-hidden rounded-full bg-surface-muted">
                <span
                  className="block h-full rounded-full bg-brand transition-[width] duration-200"
                  style={{ width: `${f.pct}%` }}
                />
              </span>
            )}
          </li>
        ))}
      </ul>
      {result.done && (
        <div className="flex flex-wrap justify-end gap-3">
          <Button variant="secondary" onClick={onAgain}>
            <RotateCcw /> Submit another
          </Button>
          <Button asChild>
            <Link href={`/projects/${result.projectId}/proposals`}>
              View proposals <ArrowRight />
            </Link>
          </Button>
        </div>
      )}
    </section>
  );
}
