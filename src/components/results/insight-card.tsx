"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ChevronDown, Sparkles, ThumbsDown, ThumbsUp, type LucideIcon } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";

/**
 * A point as a card (client feedback: no paragraph blocks): the headline is always visible, the
 * detail opens with "View more". Used for advantages, disadvantages, strengths and weaknesses.
 */
export function InsightCard({
  tone,
  headline,
  detail,
  meta,
  icon,
  defaultOpen = false,
}: {
  tone: "plus" | "minus" | "neutral";
  headline: string;
  detail?: React.ReactNode;
  meta?: React.ReactNode;
  icon?: LucideIcon;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const reduce = useReducedMotion();
  const id = useId();
  const Icon = icon ?? (tone === "plus" ? ThumbsUp : tone === "minus" ? ThumbsDown : Sparkles);
  const hasDetail = Boolean(detail);
  return (
    <li
      className={cn(
        "group/insight flex flex-col rounded-xl border bg-surface shadow-xs transition-[box-shadow,border-color] duration-150 hover:shadow-sm",
        tone === "plus" ? "border-ok/20" : tone === "minus" ? "border-fail/20" : "border-border",
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg",
            tone === "plus"
              ? "bg-ok-soft text-ok"
              : tone === "minus"
                ? "bg-fail-soft text-fail"
                : "bg-surface-muted text-ink-muted",
          )}
        >
          <Icon className="size-3.5" strokeWidth={2.25} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <p className="text-sm leading-snug font-medium text-ink" dir="auto">
            {headline}
          </p>
          {meta && <div className="text-xs text-ink-muted">{meta}</div>}
          {hasDetail && (
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              aria-expanded={open}
              aria-controls={id}
              className="mt-1 inline-flex w-fit items-center gap-1 rounded-sm text-xs font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
            >
              {open ? "View less" : "View more"}
              <ChevronDown
                aria-hidden
                className={cn("size-3.5 transition-transform", open && "rotate-180")}
              />
            </button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {open && hasDetail && (
          <motion.div
            id={id}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <div className="border-t border-border/70 px-4 py-3 ps-14 text-[13px] leading-relaxed text-ink-2">
              {detail}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** First sentence (or first ~12 words) as the headline; the full text as the detail. */
export function splitPoint(text: string): { headline: string; detail: string | undefined } {
  const t = text.trim();
  const sentence = t.match(/^([\s\S]{20,140}?[.;:])\s+([\s\S]+)$/);
  if (sentence) return { headline: sentence[1].replace(/[;:]$/, ""), detail: t };
  const words = t.split(/\s+/);
  if (words.length <= 14) return { headline: t, detail: undefined };
  return { headline: `${words.slice(0, 12).join(" ")}…`, detail: t };
}
