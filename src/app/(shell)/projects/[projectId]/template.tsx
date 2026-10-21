"use client";

import { motion } from "motion/react";

// Tab switches (Overview ↔ Proposals ↔ Evaluation) fade the content in; templates re-mount
// whenever the child segment changes.
export default function ProjectTabTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="min-w-0"
    >
      {children}
    </motion.div>
  );
}
