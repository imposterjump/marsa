"use client";

import { useId, cloneElement, isValidElement } from "react";
import { CircleAlert } from "lucide-react";
import { cn } from "cn";
import { Label } from "./label";
import { useT } from "@/components/i18n-provider";

interface FieldProps {
  label: string;
  /** Single form control; receives id / aria-describedby / aria-invalid automatically. */
  children: React.ReactElement<Record<string, unknown>>;
  hint?: React.ReactNode;
  error?: string | null;
  optional?: boolean;
  className?: string;
}

/** Label + control + hint/error with correct ARIA wiring. */
export function Field({ label, children, hint, error, optional, className }: FieldProps) {
  const t = useT();
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy =
    [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(" ") || undefined;

  const control = isValidElement(children)
    ? cloneElement(children, {
        id,
        "aria-describedby": describedBy,
        "aria-invalid": error ? true : undefined,
      })
    : children;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label htmlFor={id} className="flex items-baseline gap-2 text-[13px] font-medium text-ink">
        {label}
        {optional && <span className="text-xs font-normal text-ink-faint">{t("Optional")}</span>}
      </Label>
      {control}
      {error ? (
        <p id={errorId} className="flex items-center gap-1.5 text-xs text-fail">
          <CircleAlert className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
