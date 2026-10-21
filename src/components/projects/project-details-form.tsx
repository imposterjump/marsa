"use client";

import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ProjectInput } from "@/hooks/use-projects";
import { PROJECT_CATEGORIES, type ProjectCategory } from "@/lib/domain";
import { deadlineLabel } from "@/lib/format";
import { PROJECT_CATEGORY_LABEL } from "@/lib/labels";

export const EMPTY_PROJECT: ProjectInput = {
  name: "",
  description: "",
  category: "equipment",
  deadline: null,
  notes: "",
};

const todayYmd = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export type ProjectErrors = Partial<Record<keyof ProjectInput, string | null>>;

/** Client-side validation mirroring the server's zod schema (server errors still win). */
export function validateProject(
  v: ProjectInput,
  { allowPastDeadline = false } = {},
): ProjectErrors {
  return {
    name:
      v.name.trim().length < 3
        ? "Give the project a name of at least 3 characters."
        : v.name.length > 160
          ? "Keep it under 160 characters."
          : null,
    description:
      v.description.length > 4000 ? "Keep the description under 4,000 characters." : null,
    notes: v.notes.length > 8000 ? "Keep the notes under 8,000 characters." : null,
    deadline:
      v.deadline && !allowPastDeadline && v.deadline < todayYmd()
        ? "The submission deadline can't be in the past."
        : null,
  };
}

export const hasErrors = (e: ProjectErrors) => Object.values(e).some(Boolean);

/** Name, description, category, deadline and notes (PRD FR-3.1). Controlled. */
export function ProjectDetailsForm({
  value,
  onChange,
  errors,
  autoFocus,
}: {
  value: ProjectInput;
  onChange: (v: ProjectInput) => void;
  errors: ProjectErrors;
  autoFocus?: boolean;
}) {
  const set = <K extends keyof ProjectInput>(k: K, v: ProjectInput[K]) =>
    onChange({ ...value, [k]: v });

  return (
    <div className="grid gap-6">
      <Field label="Project name" error={errors.name} hint="Shown to vendors with the tender.">
        <Input
          value={value.name}
          onChange={(e) => set("name", e.target.value)}
          placeholder="e.g. High-Energy Cargo X-Ray Inspection Systems"
          maxLength={170}
          autoFocus={autoFocus}
          dir="auto"
        />
      </Field>
      <Field label="Description" optional error={errors.description}>
        <Textarea
          value={value.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="What is being procured, where, and why"
          rows={4}
          dir="auto"
        />
      </Field>
      <div className="grid gap-6 sm:grid-cols-2">
        <Field label="Category">
          <Select
            value={value.category}
            onValueChange={(v) => set("category", v as ProjectCategory)}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PROJECT_CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {PROJECT_CATEGORY_LABEL[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field
          label="Submission deadline"
          optional
          error={errors.deadline}
          hint={
            value.deadline && !errors.deadline
              ? deadlineLabel(value.deadline)
              : "Last day vendors can submit."
          }
        >
          <Input
            type="date"
            value={value.deadline ?? ""}
            min={todayYmd()}
            onChange={(e) => set("deadline", e.target.value || null)}
          />
        </Field>
      </div>
      <Field
        label="Key requirements / notes"
        optional
        error={errors.notes}
        hint="Anything not in the RFP files that vendors and the AI should know. Leave empty to rely on the RFP alone."
      >
        <Textarea
          value={value.notes}
          onChange={(e) => set("notes", e.target.value)}
          placeholder="Quantities, specifications, constraints…"
          rows={4}
          dir="auto"
        />
      </Field>
    </div>
  );
}
