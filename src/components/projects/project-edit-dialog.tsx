"use client";

import { useState } from "react";
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
import { useSetProjectStandards, useUpdateProject, type ProjectInput } from "@/hooks/use-projects";
import { ApiClientError } from "@/lib/api-client";
import type { ProjectDetailDto } from "@/lib/api-types";
import {
  hasErrors,
  ProjectDetailsForm,
  validateProject,
  type ProjectErrors,
} from "./project-details-form";
import { StandardsPicker } from "./standards-picker";

/** Edit name, description, category, deadline and notes of an existing project. */
export function ProjectEditDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetailDto;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {open && <EditForm project={project} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function EditForm({ project, onDone }: { project: ProjectDetailDto; onDone: () => void }) {
  const update = useUpdateProject(project.id);
  const [value, setValue] = useState<ProjectInput>({
    name: project.name,
    description: project.description,
    category: project.category,
    deadline: project.deadline,
    notes: project.notes,
  });
  const [touched, setTouched] = useState(false);
  const [serverErrors, setServerErrors] = useState<ProjectErrors>({});
  const local = validateProject(value, { allowPastDeadline: value.deadline === project.deadline });
  const errors: ProjectErrors = touched ? { ...local, ...serverErrors } : {};

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    setServerErrors({});
    if (hasErrors(local)) return;
    try {
      await update.mutateAsync({
        ...value,
        name: value.name.trim(),
        description: value.description.trim(),
        notes: value.notes.trim(),
      });
      toast.success("Project updated.");
      onDone();
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
    <form onSubmit={submit} noValidate className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>Edit project</DialogTitle>
        <DialogDescription>
          {project.status === "draft"
            ? "Vendors see these details once the tender is published."
            : "Vendors already see this tender. Changes apply to everyone right away."}
        </DialogDescription>
      </DialogHeader>
      <ProjectDetailsForm value={value} onChange={setValue} errors={errors} />
      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" loading={update.isPending}>
          Save changes
        </Button>
      </DialogFooter>
    </form>
  );
}

/** Change which standards apply to the project. */
export function ProjectStandardsDialog({
  open,
  onOpenChange,
  project,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: ProjectDetailDto;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-2xl">
        {open && <StandardsForm project={project} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function StandardsForm({ project, onDone }: { project: ProjectDetailDto; onDone: () => void }) {
  const save = useSetProjectStandards(project.id);
  const [selected, setSelected] = useState(project.standards.map((s) => s.id));
  return (
    <div className="flex flex-col gap-6">
      <DialogHeader>
        <DialogTitle>Applied standards</DialogTitle>
        <DialogDescription>
          Every rule of the selected standards joins the RFP requirements in this project&apos;s
          evaluation checklist.
        </DialogDescription>
      </DialogHeader>
      <StandardsPicker value={selected} onChange={setSelected} />
      <DialogFooter>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          loading={save.isPending}
          onClick={async () => {
            try {
              await save.mutateAsync(selected);
              toast.success("Standards updated.");
              onDone();
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Couldn't save the standards.");
            }
          }}
        >
          Save standards
        </Button>
      </DialogFooter>
    </div>
  );
}
