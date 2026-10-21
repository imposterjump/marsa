"use client";

import { motion, type HTMLMotionProps } from "motion/react";

export const EASE_OUT_QUINT = [0.22, 1, 0.36, 1] as const;

interface RevealProps extends HTMLMotionProps<"div"> {
  delay?: number;
  /** Vertical offset in px the element rises from. */
  y?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
}

/** One-shot fade + rise when the element enters the viewport (safe under reduced motion: opacity only). */
export function Reveal({ delay = 0, y = 12, immediate = false, children, ...rest }: RevealProps) {
  const target = { opacity: 1, y: 0 };
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      {...(immediate
        ? { animate: target }
        : { whileInView: target, viewport: { once: true, margin: "-40px" } })}
      transition={{ duration: 0.32, ease: EASE_OUT_QUINT, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
