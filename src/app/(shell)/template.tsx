"use client";

import { motion } from "motion/react";

// M8 route transition (RDD §11): fade + 6 px rise, 220 ms. Templates re-mount on navigation.
export default function ShellTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
