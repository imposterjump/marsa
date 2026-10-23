"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { Check, FileText, Plus, Receipt, Trash2, UserPlus } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Dropzone, type DropzoneItem } from "@/components/ui/dropzone";
import { Field } from "@/components/ui/field";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  useCreateVendor,
  useDeleteProposal,
  useProposals,
  useSubmitProposal,
  useVendors,
  type VendorInput,
} from "@/hooks/use-proposals";
import { useSettings } from "@/hooks/use-settings";
import { ApiClientError } from "@/lib/api-client";
import type { ProposalSummaryDto, VendorDto } from "@/lib/api-types";
import { PROPOSAL_SECTION_LABEL } from "@/lib/labels";
import { PROPOSAL_SECTIONS } from "@/lib/domain";

const EMPTY: VendorInput = { name: "", country: "", contactName: "", contactEmail: "" };

/**
 * The customer enters vendors and their two proposal files (P8 guided form, step 3, and "Add
 * vendor" on the project): saved vendors collapse to one line each; one form below adds the next.
 * Each vendor is saved with its files as soon as it is complete, so nothing is lost on refresh.
 */
export function VendorsEditor({
  projectId,
  ensureProject,
  onSaved,
  compact = false,
}: {
  /** null: the guided form has no draft yet; `ensureProject` creates it when a vendor is saved. */
  projectId: string | null;
  ensureProject?: () => Promise<string>;
  onSaved?: (p: { vendorName: string }) => void;
  /** Dialog use: only the form, no list of saved vendors. */
  compact?: boolean;
}) {
  const { data: proposals } = useProposals(projectId);
  const [adding, setAdding] = useState(true);
  const list = proposals ?? [];

  return (
    <div className="flex flex-col gap-4">
      {!compact && projectId && list.length > 0 && (
        <ul aria-label="Vendors added" className="flex flex-col gap-2">
          {list.map((p) => (
            <SavedVendor key={p.id} p={p} projectId={projectId} />
          ))}
        </ul>
      )}
      <AnimatePresence initial={false} mode="wait">
        {adding || compact || list.length === 0 ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2, ease: EASE_OUT_QUINT }}
          >
            <VendorForm
              projectId={projectId}
              ensureProject={ensureProject}
              taken={list.map((p) => p.vendorId)}
              onSaved={(name) => {
                onSaved?.({ vendorName: name });
                if (!compact) setAdding(false);
              }}
              onCancel={!compact && list.length > 0 ? () => setAdding(false) : undefined}
            />
          </motion.div>
        ) : (
          <motion.div key="add" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Button variant="brand" onClick={() => setAdding(true)}>
              <Plus /> Add another vendor
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SavedVendor({ p, projectId }: { p: ProposalSummaryDto; projectId: string }) {
  const remove = useDeleteProposal(projectId);
  const [confirm, setConfirm] = useState(false);
  const c = p.documentCounts;
  return (
    <li className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 shadow-xs">
      <InitialsAvatar name={p.vendor.name} size="sm" />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-sm font-medium text-ink" dir="auto">
          {p.vendor.name}
        </span>
        <span className="flex flex-wrap items-center gap-x-3 text-xs text-ink-muted">
          <span className={cn("inline-flex items-center gap-1", c.commercial ? "text-ok" : "text-partial")}>
            {c.commercial ? <Check className="size-3" aria-hidden /> : null}
            Commercial {c.commercial}
          </span>
          <span className={cn("inline-flex items-center gap-1", c.technical ? "text-ok" : "text-partial")}>
            {c.technical ? <Check className="size-3" aria-hidden /> : null}
            Technical {c.technical}
          </span>
          {p.vendor.country && <span>{p.vendor.country}</span>}
        </span>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        aria-label={`Remove ${p.vendor.name}`}
        onClick={() => setConfirm(true)}
      >
        <Trash2 />
      </Button>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={`Remove ${p.vendor.name}?`}
        description="Its proposal files are deleted from this project."
        confirmLabel="Remove vendor"
        onConfirm={async () => {
          await remove.mutateAsync(p.id);
          toast.success(`${p.vendor.name} removed.`);
        }}
      />
    </li>
  );
}

function VendorForm({
  projectId,
  ensureProject,
  taken,
  onSaved,
  onCancel,
}: {
  projectId: string | null;
  ensureProject?: () => Promise<string>;
  taken: string[];
  onSaved: (vendorName: string) => void;
  onCancel?: () => void;
}) {
  const reduce = useReducedMotion();
  const { data: settings } = useSettings();
  const { data: vendors } = useVendors();
  const createVendor = useCreateVendor();
  const submit = useSubmitProposal(projectId);
  const [mode, setMode] = useState<"new" | "existing">("new");
  const [vendorId, setVendorId] = useState("");
  const [vendor, setVendor] = useState<VendorInput>(EMPTY);
  const [commercial, setCommercial] = useState<DropzoneItem[]>([]);
  const [technical, setTechnical] = useState<DropzoneItem[]>([]);
  const [touched, setTouched] = useState(false);
  const [nameError, setNameError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [formKey, setFormKey] = useState(0); // resets the drop zones after a save
  const maxMb = settings?.runtime.maxUploadMb ?? 50;
  const choices = (vendors ?? []).filter((v) => !taken.includes(v.id));
  const chosen = choices.find((v) => v.id === vendorId);
  // A name typed again (a vendor from an earlier tender) reuses that vendor instead of failing.
  const typed = vendor.name.trim().toLowerCase();
  const match =
    mode === "new" && typed ? (vendors ?? []).find((v) => v.name.trim().toLowerCase() === typed) : undefined;

  const errors = {
    vendor:
      mode === "existing"
        ? !chosen
          ? "Choose the vendor."
          : null
        : vendor.name.trim().length < 2
          ? "Enter the vendor's company name."
          : match && taken.includes(match.id)
            ? `${match.name} is already on this project.`
            : vendor.contactEmail && !/^\S+@\S+\.\S+$/.test(vendor.contactEmail)
              ? "Enter a valid email address."
              : nameError,
    files:
      commercial.length + technical.length === 0
        ? "Add the commercial and the technical proposal."
        : null,
  };
  const show = (e: string | null) => (touched ? e : null);

  const save = async () => {
    setTouched(true);
    if (errors.vendor || errors.files) return;
    setBusy(true);
    try {
      // The guided form may have no draft yet: create it now (it needs the project name first).
      const target = projectId ?? (await ensureProject?.()) ?? null;
      if (!target) throw new Error("Save the project first.");
      let v: VendorDto | undefined = mode === "new" ? match : chosen;
      if (mode === "new" && !v) {
        try {
          v = await createVendor.mutateAsync({ ...vendor, name: vendor.name.trim() });
        } catch (err) {
          if (err instanceof ApiClientError && err.status === 409) {
            setNameError(`${vendor.name.trim()} already exists: pick it under "Existing vendor".`);
            return;
          }
          throw err;
        }
      }
      if (!v) return;
      const res = await submit.mutateAsync({
        projectId: target,
        vendorId: v.id,
        files: [
          ...commercial.map((i) => ({ file: i.file, kind: "commercial" as const })),
          ...technical.map((i) => ({ file: i.file, kind: "technical" as const })),
        ],
      });
      if (res.failed.length) {
        toast.error(`${res.failed.length} file(s) failed: ${res.failed.map((f) => f.name).join(", ")}`);
      } else {
        toast.success(`${v.name} added · ${res.uploaded.length} file${res.uploaded.length === 1 ? "" : "s"}`);
      }
      setVendor(EMPTY);
      setVendorId("");
      setCommercial([]);
      setTechnical([]);
      setTouched(false);
      setNameError(null);
      setFormKey((k) => k + 1);
      onSaved(v.name);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the vendor.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section
      aria-label="Add a vendor"
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-5 shadow-sm"
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 font-heading text-base font-semibold text-ink">
          <UserPlus className="size-4 text-brand" aria-hidden /> Vendor
        </h3>
        {choices.length > 0 && (
          <SegmentedControl
            aria-label="Vendor"
            value={mode}
            onValueChange={(v) => setMode(v)}
            options={[
              { value: "new", label: "New vendor" },
              { value: "existing", label: "Existing vendor" },
            ]}
          />
        )}
      </header>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={mode}
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
        >
          {mode === "existing" ? (
            <Field label="Vendor" error={show(errors.vendor)}>
              <Select value={vendorId} onValueChange={setVendorId}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a vendor" />
                </SelectTrigger>
                <SelectContent>
                  {choices.map((v) => (
                    <SelectItem key={v.id} value={v.id}>
                      {v.name}
                      {v.country && <span className="text-ink-muted"> · {v.country}</span>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <Field
                label="Company name"
                error={show(errors.vendor)}
                hint={match && !taken.includes(match.id) ? `${match.name} is already in Marsa: its details are reused.` : undefined}
                className="sm:col-span-2"
              >
                <Input
                  value={vendor.name}
                  onChange={(e) => {
                    setVendor({ ...vendor, name: e.target.value });
                    setNameError(null);
                  }}
                  placeholder="e.g. Trakom Security Solutions"
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

      <div key={formKey} className="grid gap-5 lg:grid-cols-2 [&>*]:min-w-0">
        <div className="flex flex-col gap-2">
          <Dropzone
            label="Commercial proposal"
            description={
              <span className="flex items-center gap-1.5">
                <Receipt className="size-3.5" aria-hidden /> Prices, payment and terms (sections 6–7)
              </span>
            }
            maxSizeMb={maxMb}
            maxFiles={10}
            onChange={setCommercial}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Dropzone
            label="Technical proposal"
            description={
              <span className="flex items-center gap-1.5">
                <FileText className="size-3.5" aria-hidden /> Solution, plan and support (sections 1–5)
              </span>
            }
            maxSizeMb={maxMb}
            maxFiles={10}
            onChange={setTechnical}
          />
        </div>
      </div>
      <details className="text-xs text-ink-muted">
        <summary className="cursor-pointer select-none">Proposal template (7 sections)</summary>
        <ol className="mt-2 grid list-decimal gap-1 ps-5 sm:grid-cols-2">
          {PROPOSAL_SECTIONS.map((s) => (
            <li key={s}>{PROPOSAL_SECTION_LABEL[s]}</li>
          ))}
        </ol>
      </details>
      {show(errors.files) && <p className="text-xs text-fail">{errors.files}</p>}

      <div className="flex flex-wrap items-center justify-end gap-3">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button onClick={() => void save()} loading={busy}>
          <Check /> Save vendor
        </Button>
      </div>
    </section>
  );
}
