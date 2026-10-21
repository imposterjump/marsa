"use client";

import { motion, useReducedMotion } from "motion/react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "./reveal";

type Tag = "h1" | "h2" | "h3" | "p" | "div" | "span";

interface MaskedTextProps {
  /** One string per line (or a single string with "\n"). */
  text: string | string[];
  as?: Tag;
  className?: string;
  lineClassName?: string;
  delay?: number;
  /** Change this to replay the animation (e.g. the current step label). */
  replayKey?: string | number;
}

/**
 * M1 Masked line curtain reveal (epic-design text-animations #2): each line rises from below
 * an overflow mask. Screen readers get the plain text once (aria-label on the wrapper).
 */
export function MaskedText({
  text,
  as = "h1",
  className,
  lineClassName,
  delay = 0,
  replayKey,
}: MaskedTextProps) {
  const reduce = useReducedMotion();
  const lines = Array.isArray(text) ? text : text.split("\n");
  const Tag = motion[as];
  const label = lines.join(" ");

  return (
    <Tag key={replayKey} className={className} aria-label={label}>
      {lines.map((line, i) => (
        <span
          key={`${i}-${line}`}
          aria-hidden
          className="-mb-[0.08em] block overflow-hidden pb-[0.08em]"
        >
          <motion.span
            className={cn("block will-change-transform", lineClassName)}
            initial={reduce ? { opacity: 0 } : { y: "105%" }}
            animate={reduce ? { opacity: 1 } : { y: "0%" }}
            transition={{
              duration: reduce ? 0.2 : 0.6,
              ease: EASE_OUT_QUINT,
              delay: delay + i * 0.06,
            }}
          >
            {line}
          </motion.span>
        </span>
      ))}
    </Tag>
  );
}
