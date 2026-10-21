"use client";

import { useId } from "react";
import { motion } from "motion/react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "cn";

export interface SegmentOption<T extends string> {
  value: T;
  label: React.ReactNode;
  icon?: React.ReactNode;
  /** Optional count badge (e.g. number of findings). */
  count?: number;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: SegmentOption<T>[];
  "aria-label": string;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Single-choice segmented control with a sliding indicator.
 * Radix ToggleGroup provides roving focus + arrow-key navigation.
 */
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  size = "md",
  className,
  ...aria
}: SegmentedControlProps<T>) {
  const layoutId = useId();
  return (
    <ToggleGroupPrimitive.Root
      type="single"
      value={value}
      onValueChange={(v) => v && onValueChange(v as T)}
      aria-label={aria["aria-label"]}
      className={cn(
        "inline-flex max-w-full [scrollbar-width:none] items-center gap-0.5 overflow-x-auto rounded-lg bg-surface-muted p-1",
        size === "md" ? "h-10" : "h-8",
        className,
      )}
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <ToggleGroupPrimitive.Item
            key={opt.value}
            value={opt.value}
            className={cn(
              "relative inline-flex h-full items-center gap-2 rounded-md font-medium whitespace-nowrap outline-none",
              "transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/25",
              size === "md" ? "px-3 text-sm" : "px-2.5 text-xs",
              active ? "text-ink" : "text-ink-muted hover:text-ink",
            )}
          >
            {active && (
              <motion.span
                layoutId={`seg-${layoutId}`}
                className="absolute inset-0 rounded-md bg-surface shadow-xs"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative inline-flex items-center gap-2 [&_svg]:size-4">
              {opt.icon}
              {opt.label}
              {opt.count !== undefined && (
                <span
                  className={cn(
                    "min-w-5 rounded-full px-1.5 text-center text-2xs tabular-nums",
                    active ? "bg-brand-soft text-brand-ink" : "bg-surface text-ink-muted",
                  )}
                >
                  {opt.count}
                </span>
              )}
            </span>
          </ToggleGroupPrimitive.Item>
        );
      })}
    </ToggleGroupPrimitive.Root>
  );
}
