"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useCreateStandard, useUpdateStandard, type StandardInput } from "@/hooks/use-standards";
import { ApiClientError } from "@/lib/api-client";
import type { StandardDto } from "@/lib/api-types";
import { STANDARD_CATEGORIES, type StandardCategory } from "@/lib/domain";

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]*$/;

/** Create (standard = undefined) or edit a standard's details. */
export function StandardFormDialog({
  open,
  onOpenChange,
  standard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard?: StandardDto;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        {open && (
          <StandardForm
            key={standard?.updatedAt ?? "new"}
            standard={standard}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function StandardForm({ standard, onDone }: { standard?: StandardDto; onDone: () => void }) {
  const router = useRouter();
  const create = useCreateStandard();
  const update = useUpdateStandard(standard?.id ?? "");
  const [form, setForm] = useState<StandardInput>({
    code: standard?.code ?? "",
    title: standard?.title ?? "",
    category: (standard?.category as StandardCategory) ?? "IT & security",
    description: standard?.description ?? "",
    isActive: standard?.isActive ?? true,
  });
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof StandardInput>(k: K, v: StandardInput[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setServerErrors((e) => ({ ...e, [k]: "" }));
  };

  const code = form.code.trim();
  const errors = {
    code: !code
      ? "Code is required."
      : !CODE_RE.test(code)
        ? "Use letters, digits, - . _ and start with a letter."
        : code.length > 24
          ? "Keep the code under 24 characters."
          : serverErrors.code || null,
    title:
      form.title.trim().length < 3
        ? "Title must be at least 3 characters."
        : serverErrors.title || null,
    description:
      form.description.length > 2000 ? "Keep the description under 2,000 characters." : null,
  };
  const valid = !errors.code && !errors.title && !errors.description;
  const busy = create.isPending || update.isPending;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (!valid) return;
    const payload = {
      ...form,
      code: code.toUpperCase(),
      title: form.title.trim(),
      description: form.description.trim(),
    };
    try {
      if (standard) {
        await update.mutateAsync(payload);
        toast.success("Standard updated.");
      } else {
        const created = await create.mutateAsync(payload);
        toast.success(`${created.code} created`, {
          description: "Now add its rules or upload the standard document.",
        });
        router.push(`/standards/${created.id}`);
      }
      onDone();
    } catch (err) {
      if (err instanceof ApiClientError && err.status === 409) {
        setServerErrors({ code: `${payload.code} is already used by another standard.` });
      } else {
        toast.error(err instanceof Error ? err.message : "Couldn't save the standard.");
      }
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-5">
      <DialogHeader>
        <DialogTitle>{standard ? "Edit standard" : "New standard"}</DialogTitle>
        <DialogDescription>
          A standard groups the rules every proposal must respect. Its rules and documents are sent
          to the AI for each project that applies it.
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-5 sm:grid-cols-[160px_1fr]">
        <Field
          label="Code"
          error={touched || serverErrors.code ? errors.code : null}
          hint="e.g. CITS-2026"
        >
          <Input
            value={form.code}
            onChange={(e) => set("code", e.target.value.toUpperCase())}
            className="font-mono uppercase"
            maxLength={30}
            autoFocus={!standard}
          />
        </Field>
        <Field label="Title" error={touched ? errors.title : null}>
          <Input
            value={form.title}
            onChange={(e) => set("title", e.target.value)}
            maxLength={150}
          />
        </Field>
      </div>
      <Field label="Category">
        <Select value={form.category} onValueChange={(v) => set("category", v as StandardCategory)}>
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
      <Field label="Description" optional error={errors.description}>
        <Textarea
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Scope and purpose of this standard"
          rows={3}
        />
      </Field>
      <label className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
        <span className="flex flex-col gap-0.5">
          <span className="font-medium text-ink">Active</span>
          <span className="text-[13px] text-ink-muted">
            Active standards are pre-selected for new projects.
          </span>
        </span>
        <Switch checked={form.isActive} onCheckedChange={(v) => set("isActive", v)} />
      </label>
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
        <Button type="submit" loading={busy} disabled={touched && !valid}>
          {standard ? "Save changes" : "Create standard"}
        </Button>
      </DialogFooter>
    </form>
  );
}
