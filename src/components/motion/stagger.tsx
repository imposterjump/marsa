"use client";

import { motion, type HTMLMotionProps, type Variants } from "motion/react";
import { EASE_OUT_QUINT } from "./reveal";

/**
 * M2 Multi-directional stagger grid (epic-design directional-reveals #7), softened for data UI:
 * children rise 12px and fade in, 50 ms apart. Only the first ~8 stagger; the rest follow at once.
 */
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.32, ease: EASE_OUT_QUINT } },
};

export function Stagger({
  children,
  immediate = true,
  ...rest
}: HTMLMotionProps<"div"> & { immediate?: boolean }) {
  return (
    <motion.div
      variants={container}
      initial="hidden"
      {...(immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true } })}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, ...rest }: HTMLMotionProps<"div">) {
  return (
    <motion.div variants={item} {...rest}>
      {children}
    </motion.div>
  );
}
