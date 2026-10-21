"use client";

import { useRef } from "react";
import { motion, useInView, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";

type Tone = "auto" | "brand" | "ok" | "partial" | "fail" | "neutral";

const STROKE: Record<Exclude<Tone, "auto">, string> = {
  brand: "var(--brand)",
  ok: "var(--ok)",
  partial: "var(--partial)",
  fail: "var(--fail)",
  neutral: "var(--ink-muted)",
};

/** Compliance-score colouring: ≥85 ok · ≥70 partial · below fail. */
export function scoreTone(value: number): Exclude<Tone, "auto"> {
  if (value >= 85) return "ok";
  if (value >= 70) return "partial";
  return "fail";
}

interface ProgressRingProps {
  value: number; // 0–100
  size?: number;
  thickness?: number;
  tone?: Tone;
  /** Text under the number, e.g. "compliant". */
  caption?: string;
  showValue?: boolean;
  decimals?: number;
  className?: string;
  label: string; // accessible name, e.g. "Compliance score"
}

export function ProgressRing({
  value,
  size = 96,
  thickness = 8,
  tone = "auto",
  caption,
  showValue = true,
  decimals = 0,
  className,
  label,
}: ProgressRingProps) {
  const ref = useRef<SVGSVGElement>(null);
  const inView = useInView(ref, { once: true });
  const reduce = useReducedMotion();
  const clamped = Math.max(0, Math.min(100, value));
  const r = (size - thickness) / 2;
  const resolved = tone === "auto" ? scoreTone(clamped) : tone;

  return (
    <div
      role="meter"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      className={cn("relative inline-grid shrink-0 place-items-center", className)}
      style={{ width: size, height: size }}
    >
      <svg ref={ref} width={size} height={size} className="-rotate-90" aria-hidden>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-muted)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={STROKE[resolved]}
          strokeWidth={thickness}
          strokeLinecap="round"
          initial={{ pathLength: reduce ? clamped / 100 : 0 }}
          animate={{ pathLength: inView ? clamped / 100 : reduce ? clamped / 100 : 0 }}
          transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex flex-col items-center justify-center leading-none">
          <span
            className="font-heading font-semibold tracking-tight text-ink"
            style={{ fontSize: Math.max(12, size * 0.24) }}
          >
            <CountUp value={clamped} decimals={decimals} suffix="%" />
          </span>
          {caption && (
            <span className="mt-1 text-2xs text-ink-muted" style={{ fontSize: Math.max(10, size * 0.1) }}>
              {caption}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
