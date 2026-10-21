"use client";

import { useEffect, useRef } from "react";
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform } from "motion/react";
import { cn } from "cn";

/**
 * M3 Depth layers (epic-design depth-system), adapted for app UI:
 *   depth-0  port-grid + contour lines (static, faded at the edges)
 *   depth-1  two soft teal glows drifting on 14 s / 19 s loops
 *   depth-2  harbour line art (cranes + container stacks), optional
 * Pointer parallax (≤ 6 px) only on fine pointers; everything static under reduced motion.
 * Purely decorative: aria-hidden, pointer-events none.
 */
export function DepthBackdrop({ art = true, className }: { art?: boolean; className?: string }) {
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
  const d2x = useTransform(sx, (v) => v * 6);
  const d2y = useTransform(sy, (v) => v * 4);

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

      {/* depth-2: harbour line art */}
      {art && (
        <motion.div
          data-depth="2"
          className="absolute end-0 bottom-0 hidden w-[min(560px,55%)] text-navy opacity-[0.16] md:block dark:opacity-[0.22]"
          style={reduce ? undefined : { x: d2x, y: d2y }}
        >
          <HarbourArt />
        </motion.div>
      )}
    </div>
  );
}

/** Ship-to-shore cranes over container stacks, drawn in 1.25 px strokes. */
function HarbourArt() {
  const stacks: [number, number, number][] = [
    // x, width, number of tiers
    [16, 46, 3],
    [66, 46, 5],
    [116, 46, 2],
    [166, 46, 4],
    [326, 46, 3],
    [376, 46, 6],
    [426, 46, 2],
  ];
  return (
    <svg
      viewBox="0 0 520 230"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.25"
      strokeLinejoin="round"
    >
      <line x1="0" y1="226" x2="520" y2="226" />
      {stacks.map(([x, w, tiers]) =>
        Array.from({ length: tiers }, (_, t) => (
          <g key={`${x}-${t}`}>
            <rect x={x} y={226 - (t + 1) * 16} width={w} height={16} rx="1.5" />
            <line x1={x + w / 3} y1={226 - (t + 1) * 16} x2={x + w / 3} y2={226 - t * 16} />
            <line
              x1={x + (2 * w) / 3}
              y1={226 - (t + 1) * 16}
              x2={x + (2 * w) / 3}
              y2={226 - t * 16}
            />
          </g>
        )),
      )}
      {/* crane 1 */}
      <path d="M232 226V70M286 226V70M226 70h66M232 110h54M232 110l54-40M286 110l-54-40" />
      <path d="M200 52h168M250 52V30h18v22M222 52l40-22 40 22" />
      <path d="M318 52v28M314 80h8v10h-8z" />
      {/* crane 2 (further back, smaller) */}
      <g opacity="0.6">
        <path d="M478 226V112M512 226V112M474 112h42M478 140h34M478 140l34-28M512 140l-34-28" />
        <path d="M456 98h64M486 98V84h12v14" />
      </g>
    </svg>
  );
}
