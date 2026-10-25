"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "motion/react";

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // i18n-ignore
const ARABIC_GLYPHS = "ابتثجحخدذرزسشصضطظعغفقكلمنهوي";

/**
 * M4 Scramble text (epic-design text-animations #5): when `text` changes, letters scramble
 * for ~400 ms then settle left-to-right. Used sparingly (phase names). Static under reduced motion.
 */
export function ScrambleText({
  text,
  duration = 420,
  className,
}: {
  text: string;
  duration?: number;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [out, setOut] = useState(text);
  const frame = useRef<number>(0);

  useEffect(() => {
    if (reduce) return;
    const start = performance.now();
    const glyphs = /[\u0600-\u06ff]/.test(text) ? ARABIC_GLYPHS : GLYPHS;
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      const settled = Math.floor(p * text.length);
      setOut(
        text
          .split("")
          .map((ch, i) =>
            i < settled || ch === " " ? ch : glyphs[Math.floor(Math.random() * glyphs.length)],
          )
          .join(""),
      );
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current);
  }, [text, duration, reduce]);

  return (
    <span className={className} aria-label={text}>
      <span aria-hidden>{reduce ? text : out}</span>
    </span>
  );
}
