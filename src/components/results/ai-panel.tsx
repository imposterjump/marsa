"use client";

import { Sparkles } from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";

/**
 * RTA "AI narrative panel": an analyst's brief in a frame, never a chat bubble. Always marked
 * AI-generated with the model and time; the only card allowed a gradient border.
 */
export function AiPanel({
  title,
  model,
  when,
  children,
  actions,
  className,
}: {
  title: string;
  model?: string;
  when?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  const t = useT();
  return (
    <section
      aria-label={title}
      className={cn(
        "relative rounded-xl p-px shadow-sm",
        "bg-[linear-gradient(135deg,rgb(236_28_36/0.55),rgb(255_138_92/0.35)_45%,var(--border)_80%)]",
        className,
      )}
    >
      <div className="flex flex-col gap-4 rounded-[13px] bg-surface bg-[linear-gradient(180deg,rgb(236_28_36/0.035),transparent_40%)] p-5">
        <header className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden
              className="flex size-8 items-center justify-center rounded-lg bg-rta text-white shadow-[0_6px_16px_-8px_rgb(236_28_36/0.7)]"
            >
              <Sparkles className="size-4" />
            </span>
            <div className="flex flex-col">
              <h3 className="font-heading text-base font-semibold tracking-tight text-ink">
                {title}
              </h3>
              <span className="text-xs text-ink-muted">
                {t("AI-generated")}
                {model ? ` · ${model}` : ""}
                {when ? ` · ${when}` : ""}
              </span>
            </div>
          </div>
          {actions}
        </header>
        <div className="flex flex-col gap-3 text-sm leading-relaxed text-ink-2">{children}</div>
      </div>
    </section>
  );
}
