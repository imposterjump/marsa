"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * M10 Float loop (epic-design depth-system): gentle vertical drift for hero/empty-state art.
 * 6–14 s cycle, never fully static — but completely still under reduced motion.
 */
export function FloatLoop({
  children,
  amplitude = 4,
  duration = 10,
  className,
}: {
  children: React.ReactNode;
  amplitude?: number;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      animate={{ y: [0, -amplitude, 0, amplitude * 0.5, 0] }}
      transition={{ duration, repeat: Infinity, ease: "easeInOut" }}
    >
      {children}
    </motion.div>
  );
}
