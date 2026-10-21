"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "motion/react";

interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
}

/** M5 Count-up: numbers roll up to their value when first seen. Exact value under reduced motion. */
export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 0.9,
  className,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });
  const reduce = useReducedMotion();
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    if (!inView || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setAnimated(v),
    });
    return () => controls.stop();
  }, [inView, value, duration, reduce]);

  const display = reduce ? value : animated;

  return (
    <span ref={ref} className={className} style={{ fontVariantNumeric: "tabular-nums" }}>
      <span className="sr-only">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </span>
      <span aria-hidden>
        {prefix}
        {display.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  );
}
