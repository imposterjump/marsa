"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "cn";

/**
 * M3 Depth layers (epic-design depth-system), adapted for app UI:
 *   depth-0  grid lines (static, faded at the edges)
 *   depth-1  two soft brand glows drifting on 14 s / 19 s loops
 * The harbour line art (cranes + containers) that was depth-2 was removed on 2026-10-24: the
 * product is about procurement, not ports (user feedback on the Projects hero).
 * Pointer parallax (≤ 3 px) only on fine pointers; everything static under reduced motion.
 * Purely decorative: aria-hidden, pointer-events none.
 */
export function DepthBackdrop({ className }: { className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const sx = useSpring(px, { stiffness: 60, damping: 20 });
  const sy = useSpring(py, { stiffness: 60, damping: 20 });
  const d0x = useTransform(sx, (v) => v * 1.5);
  const d0y = useTransform(sy, (v) => v * 1.5);
  const d1x = useTransform(sx, (v) => v * 3);
  const d1y = useTransform(sy, (v) => v * 3);

  useEffect(() => {
    if (reduce || !window.matchMedia("(pointer: fine)").matches) return;
    const host = ref.current?.parentElement;
    if (!host) return;
    const onMove = (e: PointerEvent) => {
      const r = host.getBoundingClientRect();
      px.set(((e.clientX - r.left) / r.width - 0.5) * 2);
      py.set(((e.clientY - r.top) / r.height - 0.5) * 2);
    };
    const onLeave = () => {
      px.set(0);
      py.set(0);
    };
    host.addEventListener("pointermove", onMove);
    host.addEventListener("pointerleave", onLeave);
    return () => {
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerleave", onLeave);
    };
  }, [reduce, px, py]);

  return (
    <div
      ref={ref}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      {/* depth-0: grid */}
      <motion.div
        data-depth="0"
        className="absolute -inset-8"
        style={reduce ? undefined : { x: d0x, y: d0y }}
      >
        <svg className="size-full" preserveAspectRatio="none">
          <defs>
            <pattern id="marsa-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="var(--grid-line)" strokeWidth="1" />
            </pattern>
            <radialGradient id="marsa-grid-fade" cx="70%" cy="20%" r="85%">
              <stop offset="0" stopColor="white" stopOpacity="1" />
              <stop offset="1" stopColor="white" stopOpacity="0" />
            </radialGradient>
            <mask id="marsa-grid-mask">
              <rect width="100%" height="100%" fill="url(#marsa-grid-fade)" />
            </mask>
          </defs>
          <rect width="100%" height="100%" fill="url(#marsa-grid)" mask="url(#marsa-grid-mask)" />
        </svg>
      </motion.div>

      {/* depth-1: glows */}
      <motion.div
        data-depth="1"
        className="absolute inset-0"
        style={reduce ? undefined : { x: d1x, y: d1y }}
      >
        <motion.div
          className="absolute end-[8%] -top-24 size-[420px] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, var(--glow), transparent 70%)" }}
          animate={reduce ? undefined : { x: [0, 30, -10, 0], y: [0, 20, 10, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute start-[18%] -bottom-40 size-[360px] rounded-full opacity-70 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--glow), transparent 70%)" }}
          animate={reduce ? undefined : { x: [0, -24, 12, 0], y: [0, -14, 6, 0] }}
          transition={{ duration: 19, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}
