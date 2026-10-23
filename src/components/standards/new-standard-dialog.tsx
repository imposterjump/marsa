"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ClipboardPaste, FileSpreadsheet, Loader2, Sparkles, X } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Dropzone } from "@/components/ui/dropzone";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStandard } from "@/hooks/use-standards";
import { useSettings } from "@/hooks/use-settings";
import { api, ApiClientError } from "@/lib/api-client";
import type { StandardDto } from "@/lib/api-types";
import { STANDARD_CATEGORIES, type StandardCategory } from "@/lib/domain";
import { AI_MODEL_LABEL } from "@/lib/labels";
import { parseRules, type ParsedRule } from "@/lib/rules-parse";
import { uploadFile } from "@/lib/upload";

interface FileResult {
  rules: ParsedRule[];
  errors: { line: number; message: string }[];
  needsAi: boolean;
  usedAi: boolean;
  costUsd: number;
}

/**
 * Create a standard without leaving the guided form (P8): code, title, category, and its rules
 * from a dropped file (Excel, CSV, Word, text: read for free; a PDF whose text gives no rules can
 * be read by AI after the customer agrees). Pasting stays as a fallback.
 */
export function NewStandardDialog({
  open,
  onOpenChange,
  defaultCategory,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultCategory: StandardCategory;
  onCreated: (standard: StandardDto) => void;
}) {
  const { data: settings } = useSettings();
  const create = useCreateStandard();
  const [code, setCode] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<StandardCategory>(defaultCategory);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<FileResult | null>(null);
  const [reading, setReading] = useState<"file" | "ai" | null>(null);
  const [paste, setPaste] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const live = settings?.runtime.aiMode === "live";
  const model = settings?.aiModel;

  const rules = paste !== null ? parseRules(paste).rules : (result?.rules ?? []);
  const errors = {
    code: !/^[A-Za-z][A-Za-z0-9._-]{0,23}$/.test(code.trim()) ? "Enter a short code, e.g. CTS-2026." : null,
    title: title.trim().length < 3 ? "Enter the standard's title." : null,
    rules: rules.length === 0 ? "Add the rules: drop a rules file or paste them." : null,
  };

  const reset = () => {
    setCode("");
    setTitle("");
    setFile(null);
    setResult(null);
    setPaste(null);
    setTouched(false);
    setServerError(null);
  };

  const read = async (f: File, ai = false) => {
    setReading(ai ? "ai" : "file");
    try {
      const body = new FormData();
      body.set("file", f);
      if (ai) body.set("ai", "1");
      const res = await api<FileResult>("/api/standards/rules-from-file", { method: "POST", body });
      setResult(res);
      if (res.usedAi && res.costUsd > 0) toast.success(`Rules read by AI · $${res.costUsd.toFixed(3)}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't read the file.");
    } finally {
      setReading(null);
    }
  };

  const submit = async () => {
    setTouched(true);
    setServerError(null);
    if (Object.values(errors).some(Boolean)) return;
    setSaving(true);
    try {
      const std = await create.mutateAsync({
        code: code.trim(),
        title: title.trim(),
        category,
        description: "",
        isActive: true,
      });
      await api(`/api/standards/${std.id}/rules/bulk`, {
        method: "POST",
        body: JSON.stringify({
          rules: rules.map((r) => ({ code: r.code, text: r.text, priority: r.priority })),
        }),
      });
      // Keep the original file with the standard for reference (PDF / Word only: tables add nothing).
      if (file && /\.(pdf|docx)$/i.test(file.name)) {
        await uploadFile(`/api/standards/${std.id}/documents`, file, () => {}).catch(() => {});
      }
      toast.success(`${std.code} created · ${rules.length} rules`);
      onCreated(std);
      reset();
      onOpenChange(false);
    } catch (err) {
      setServerError(
        err instanceof ApiClientError ? err.message : "Couldn't create the standard.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(o) : (reset(), onOpenChange(o)))}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>New standard</DialogTitle>
          <DialogDescription>
            Drop the file with the standard&apos;s rules: an Excel or CSV table, a Word table or a
            text file with one rule per row (code, rule, priority). A PDF works too.
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-5">
          <div className="grid gap-4 sm:grid-cols-[10rem_1fr]">
            <Field label="Code" error={touched ? errors.code : null}>
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="CTS-2026" />
            </Field>
            <Field label="Title" error={touched ? errors.title : null}>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Customs Transit Security Standard"
              />
            </Field>
          </div>
          <Field label="Category">
            <Select value={category} onValueChange={(v) => setCategory(v as StandardCategory)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STANDARD_CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          {paste === null ? (
            <div className="flex flex-col gap-3">
              {!file ? (
                <Dropzone
                  label="Rules file"
                  description="Excel, CSV, Word, text or PDF"
                  maxSizeMb={settings?.runtime.maxUploadMb ?? 50}
                  maxFiles={1}
                  onChange={(items) => {
                    const f = items[0]?.file;
                    if (f) {
                      setFile(f);
                      void read(f);
                    }
                  }}
                />
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/40 px-4 py-3 text-sm">
                  <FileSpreadsheet className="size-4 text-ink-muted" aria-hidden />
                  <span className="min-w-0 flex-1 truncate" dir="auto">
                    {file.name}
                  </span>
                  {reading ? (
                    <span className="flex items-center gap-1.5 text-xs text-ink-muted">
                      <Loader2 className="size-3.5 motion-safe:animate-spin" aria-hidden />
                      {reading === "ai" ? "Reading with AI…" : "Reading…"}
                    </span>
                  ) : (
                    <span className="text-xs font-medium text-ink-2">{rules.length} rules</span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label="Remove the file"
                    onClick={() => {
                      setFile(null);
                      setResult(null);
                    }}
                  >
                    <X />
                  </Button>
                </div>
              )}
              {result?.needsAi && !reading && file && (
                <div className="flex flex-col gap-2 rounded-xl border border-info/30 bg-info-soft p-4 text-[13px] text-ink-2">
                  <span>
                    No rule table was found in this file&apos;s text. Marsa can read the rules with
                    AI:{" "}
                    {live
                      ? `one small request to ${model ? AI_MODEL_LABEL[model] : "Claude"} (about $0.01 on Haiku, $0.05 on Sonnet).`
                      : "free with the demo AI."}
                  </span>
                  <Button size="sm" className="w-fit" onClick={() => void read(file, true)}>
                    <Sparkles /> Read the rules with AI
                  </Button>
                </div>
              )}
              <button
                type="button"
                onClick={() => setPaste("")}
                className="inline-flex w-fit items-center gap-1.5 rounded-sm text-xs font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                <ClipboardPaste className="size-3.5" aria-hidden /> Paste the rules instead
              </button>
            </div>
          ) : (
            <Field label="Rules (one per line: CODE | rule | priority)">
              <Textarea
                rows={7}
                value={paste}
                onChange={(e) => setPaste(e.target.value)}
                placeholder="TR-01 | Tracking data shall stay in the State. | mandatory"
                className="font-mono text-xs"
              />
            </Field>
          )}

          {rules.length > 0 && (
            <section aria-label="Rules found" className="flex flex-col gap-2">
              <span className="caption-caps text-ink-muted">
                {rules.length} rule{rules.length === 1 ? "" : "s"} found
              </span>
              <ul className="flex max-h-52 flex-col divide-y divide-border/70 overflow-y-auto rounded-xl border border-border">
                {rules.map((r) => (
                  <li key={`${r.line}-${r.code}`} className="flex items-start gap-3 px-3 py-2 text-[13px]">
                    <span className="w-16 shrink-0 font-mono text-xs text-ink-muted">
                      {r.code ?? "auto"}
                    </span>
                    <span className="min-w-0 flex-1 text-ink-2" dir="auto">
                      {r.text}
                    </span>
                    <PriorityPill priority={r.priority} size="sm" short />
                  </li>
                ))}
              </ul>
            </section>
          )}
          {(touched && errors.rules) || serverError ? (
            <p className={cn("text-xs text-fail")}>{serverError ?? errors.rules}</p>
          ) : null}
        </DialogBody>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} loading={saving} disabled={!!reading}>
            Create standard
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
