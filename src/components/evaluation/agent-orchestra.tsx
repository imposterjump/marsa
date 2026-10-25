"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import {
  Check,
  ClipboardCheck,
  Columns3,
  FileSearch,
  Gauge,
  Languages,
  ScrollText,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  Trophy,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import type { RunStatusDto } from "@/lib/api-types";
import { RUN_PHASES, type RunPhase } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";

type Steps = RunStatusDto["steps"];
export type PhaseState = "done" | "active" | "pending" | "skipped";

export function phaseStates(steps: Steps): Record<RunPhase, PhaseState> {
  const out = {} as Record<RunPhase, PhaseState>;
  for (const phase of RUN_PHASES) {
    const s = steps.filter((x) => x.phase === phase);
    const finished = (x: (typeof s)[number]) =>
      x.status === "done" ||
      x.status === "skipped" ||
      x.status === "failed" ||
      x.status === "cancelled";
    out[phase] =
      s.length && s.every((x) => x.status === "skipped")
        ? "skipped"
        : s.length && s.every(finished)
          ? "done"
          : s.some((x) => x.status === "running" || finished(x))
            ? "active"
            : "pending";
  }
  return out;
}

/** Each phase of the pipeline as the agent that does it (the step texts stay the run's own). */
const AGENTS: Record<RunPhase, { name: string; job: string; icon: LucideIcon }> = {
  checklist: {
    name: msg("Extraction Agent"),
    job: msg("Reads the RFP, builds the checklist"),
    icon: FileSearch,
  },
  standards: {
    name: msg("Standards Agent"),
    job: msg("Checks every standard rule"),
    icon: ShieldCheck,
  },
  analyze: {
    name: msg("RFP Compliance Agent"),
    job: msg("Checks every RFP requirement"),
    icon: ClipboardCheck,
  },
  compare: { name: msg("Comparison Agent"), job: msg("Compares the bids"), icon: Columns3 },
  risk: { name: msg("Risk Agent"), job: msg("Builds each risk register"), icon: Gauge },
  summary: {
    name: msg("Recommendation Agent"),
    job: msg("Scores, ranks and recommends"),
    icon: Trophy,
  },
  report: {
    name: msg("Consultant Agent"),
    job: msg("Writes a report per vendor"),
    icon: ScrollText,
  },
  translate: {
    name: msg("Translator Agent"),
    job: msg("Writes every result in Arabic and English"),
    icon: Languages,
  },
};

interface Pt {
  x: number;
  y: number;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/**
 * The run as an agent team (user, 2026-10-25, after a reference image): the AI Orchestrator in
 * the middle, one agent per pipeline phase around it in run order (clockwise from the top left).
 * Finished agents turn green, the working one glows with a turning ring and its vendor count,
 * waiting ones stay pale. A ball sits in the working agent; when the phase ends it travels back to
 * the orchestrator and on to the next agent. The step texts above stay the run's own.
 */
export function AgentOrchestra({ steps }: { steps: Steps }) {
  const t = useT();
  const reduce = useReducedMotion();
  const [ref, w] = useWidth<HTMLDivElement>();
  const phases = RUN_PHASES.filter((ph) => steps.some((s) => s.phase === ph));
  const states = phaseStates(steps);
  const active = phases.find((ph) => states[ph] === "active") ?? null;
  const allDone =
    phases.length > 0 && phases.every((ph) => states[ph] === "done" || states[ph] === "skipped");

  // ─── Geometry: an ellipse that fits the card, with room for the labels ───
  const wide = w >= 760;
  const compact = w > 0 && w < 560;
  const node = wide ? 54 : compact ? 44 : 50;
  const hub = wide ? 80 : compact ? 64 : 72;
  const h = wide ? 390 : compact ? 400 : 400;
  const labelW = compact ? 100 : wide ? 196 : 172;
  const label = compact ? 32 : 38; // room for a name and its job line
  const cx = w / 2;
  const cy = h / 2;
  const rx = Math.max(0, Math.min(w / 2 - labelW / 2 - 4, 420));
  const ry = h / 2 - node / 2 - label - 8;
  const n = phases.length;
  // Clockwise in run order from the top left; agents in the top half carry their label above,
  // so no line ever runs through a label.
  const at = (i: number) => {
    const a = ((-90 - 360 / n + (360 / n) * i) * Math.PI) / 180;
    return { x: cx + rx * Math.cos(a), y: cy + ry * Math.sin(a), above: Math.sin(a) < -0.2 };
  };
  const posOf = new Map(phases.map((ph, i) => [ph, at(i)]));
  const center: Pt = { x: cx, y: cy };
  // The ball rests in the lower part of the working agent, under its icon.
  const restOf = (ph: RunPhase | null): Pt => {
    const p = ph ? posOf.get(ph) : undefined;
    return p ? { x: p.x, y: p.y + node * 0.24 } : { x: cx, y: cy + hub * 0.24 };
  };

  // ─── The hand-off: last agent → orchestrator → next agent ───
  // When the working agent changes, the ball starts a trip (state adjusted while rendering).
  const [sentTo, setSentTo] = useState<RunPhase | null>(null);
  const [hop, setHop] = useState<{ from: RunPhase | null; to: RunPhase | null } | null>(null);
  if (active !== sentTo) {
    setSentTo(active);
    setHop({ from: sentTo, to: active });
  }
  const path: Pt[] = hop
    ? hop.from
      ? [restOf(hop.from), center, restOf(hop.to)]
      : [center, restOf(hop.to)]
    : [restOf(active)];

  return (
    <div ref={ref} className="relative w-full select-none" style={{ height: h }}>
      {w > 0 && (
        <>
          <svg width={w} height={h} className="absolute inset-0" aria-hidden>
            {/* The team's orbit */}
            <ellipse
              cx={cx}
              cy={cy}
              rx={rx}
              ry={ry}
              fill="none"
              strokeWidth={1}
              strokeDasharray="2 7"
              strokeLinecap="round"
              className="stroke-border-strong/80"
            />
            {phases.map((ph) => {
              const p = posOf.get(ph)!;
              const state = states[ph];
              return (
                <g key={ph}>
                  <line
                    x1={cx}
                    y1={cy}
                    x2={p.x}
                    y2={p.y}
                    strokeWidth={state === "pending" || state === "skipped" ? 1.5 : 2.5}
                    strokeLinecap="round"
                    strokeDasharray={state === "skipped" ? "4 6" : undefined}
                    className={cn(
                      "transition-[stroke] duration-500",
                      state === "done"
                        ? "stroke-ok-fill/60"
                        : state === "active"
                          ? "stroke-brand/25"
                          : "stroke-border-strong/70",
                    )}
                  />
                  {state === "active" && (
                    <line
                      x1={cx}
                      y1={cy}
                      x2={p.x}
                      y2={p.y}
                      strokeWidth={2.5}
                      strokeLinecap="round"
                      strokeDasharray="5 11"
                      className="stroke-brand motion-safe:animate-[marsa-flow_0.9s_linear_infinite]"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* The orchestrator */}
          <div
            className="absolute flex flex-col items-center gap-2.5"
            style={{
              left: cx - (compact ? 70 : 120),
              top: cy - hub / 2,
              width: compact ? 140 : 240,
            }}
          >
            <motion.div
              className="relative grid place-items-center rounded-[26px] text-[#ff8a5c] shadow-[0_0_0_10px_var(--brand-soft),0_18px_40px_-14px_rgb(23_27_33/0.55)]"
              style={{
                width: hub,
                height: hub,
                border: "1.5px solid transparent", // i18n-ignore
                background:
                  "linear-gradient(160deg, #232931, #12161b) padding-box, linear-gradient(135deg, #ec1c24, #ff5a47 55%, #ff8a5c) border-box",
              }}
              animate={reduce || allDone ? { scale: 1 } : { scale: [1, 1.035, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Sparkles className={wide ? "size-8" : "size-7"} strokeWidth={1.6} aria-hidden />
            </motion.div>
            <div className="flex flex-col items-center rounded-lg bg-surface/90 px-2 py-0.5 text-center backdrop-blur-sm">
              <span className={cn("font-semibold text-ink", compact ? "text-xs" : "text-sm")}>
                {t("AI Orchestrator")}
              </span>
              <span className={cn("text-xs text-ink-muted", compact && "hidden")}>
                {allDone
                  ? t("All agents finished")
                  : active
                    ? t("Working with the {agent}", { agent: t(AGENTS[active].name) })
                    : t("Coordinating the agents")}
              </span>
            </div>
          </div>

          {/* The agents */}
          <ol aria-label={t("Phases")} className="absolute inset-0">
            {phases.map((ph, i) => {
              const p = posOf.get(ph)!;
              const state = states[ph];
              const agent = AGENTS[ph];
              const own = steps.filter((s) => s.phase === ph);
              const done = own.filter((s) => s.status === "done").length;
              const failed = own.filter((s) => s.status === "failed").length;
              const Icon = state === "done" ? (failed ? TriangleAlert : Check) : agent.icon;
              return (
                <li
                  key={ph}
                  className={cn(
                    "absolute flex items-center gap-2 text-center",
                    p.above ? "flex-col-reverse" : "flex-col",
                  )}
                  style={
                    p.above
                      ? { left: p.x - labelW / 2, bottom: h - p.y - node / 2, width: labelW }
                      : { left: p.x - labelW / 2, top: p.y - node / 2, width: labelW }
                  }
                >
                  <motion.div
                    className={cn(
                      "relative grid place-items-center rounded-2xl border transition-colors duration-500",
                      state === "done" &&
                        (failed
                          ? "border-fail/25 bg-fail-soft text-fail"
                          : "border-ok/25 bg-ok-soft text-ok"),
                      state === "active" &&
                        "border-transparent bg-rail text-[#ff8a5c] shadow-[0_0_0_6px_var(--brand-soft),0_14px_30px_-12px_rgb(236_28_36/0.55)]",
                      state === "pending" && "border-border bg-surface text-ink-faint shadow-xs",
                      state === "skipped" &&
                        "border-dashed border-border-strong bg-surface text-ink-faint",
                    )}
                    style={{ width: node, height: node }}
                    animate={{ scale: state === "active" ? 1.08 : 1 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                  >
                    {state === "active" && (
                      <span
                        aria-hidden
                        className="marsa-orbit absolute -inset-[5px] rounded-[20px]"
                      />
                    )}
                    {/* Its turn in the run */}
                    <span
                      aria-hidden
                      className={cn(
                        "absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full border text-[10px] font-bold tabular-nums",
                        state === "active"
                          ? "border-transparent bg-rta text-white"
                          : state === "done"
                            ? "border-ok/30 bg-surface text-ok"
                            : "border-border bg-surface text-ink-faint",
                      )}
                    >
                      {i + 1}
                    </span>
                    <Icon
                      aria-hidden
                      className={cn(
                        compact ? "size-[18px]" : "size-5",
                        state === "active" && "-translate-y-[18%]",
                      )}
                      strokeWidth={state === "done" ? 2.4 : 1.8}
                    />
                  </motion.div>
                  <span className="flex flex-col items-center rounded-md bg-surface/85 px-1.5 py-0.5 leading-tight backdrop-blur-[2px]">
                    <span
                      className={cn(
                        "font-semibold",
                        compact ? "text-[11px]" : "text-[12.5px]",
                        state === "pending" || state === "skipped" ? "text-ink-faint" : "text-ink",
                      )}
                    >
                      {t(agent.name)}
                    </span>
                    <span
                      className={cn(
                        "mt-0.5",
                        compact ? "text-[10px]" : "text-[11px]",
                        state === "active"
                          ? "font-medium text-brand-ink"
                          : failed
                            ? "text-fail"
                            : "text-ink-muted",
                        compact && state !== "active" && !failed && "hidden",
                      )}
                    >
                      {state === "active"
                        ? own.length > 1
                          ? t.plural(
                              own.length,
                              "{done} of {n} vendors done",
                              "{done} of {n} vendors done",
                              { done },
                            )
                          : t("Working…")
                        : failed
                          ? t.plural(failed, "{n} step failed", "{n} steps failed")
                          : state === "skipped"
                            ? t("Skipped")
                            : t(agent.job)}
                    </span>
                  </span>
                  <span className="sr-only">
                    {state === "done"
                      ? t(", done")
                      : state === "active"
                        ? t(", in progress")
                        : state === "skipped"
                          ? t(", skipped")
                          : t(", pending")}
                  </span>
                </li>
              );
            })}
          </ol>

          {/* The ball the agents pass along (left/ml stay physical: the diagram's x is physical) */}
          <motion.span
            aria-hidden
            className="pointer-events-none absolute top-0 left-0 -mt-[7px] -ml-[7px] size-3.5 rounded-full bg-rta shadow-[0_0_0_4px_rgb(236_28_36/0.14),0_0_18px_5px_rgb(255_90_71/0.55)]"
            initial={false}
            animate={
              hop && !reduce
                ? { x: path.map((q) => q.x), y: path.map((q) => q.y) }
                : { x: path.at(-1)!.x, y: path.at(-1)!.y }
            }
            transition={
              hop && !reduce
                ? { duration: path.length > 2 ? 1.6 : 0.9, ease: "easeInOut" }
                : { duration: reduce ? 0 : 0.4 }
            }
            onAnimationComplete={() => hop && setHop(null)}
          >
            {!hop && !reduce && !allDone && (
              <span className="absolute inset-0 animate-ping rounded-full bg-[#ff5a47]/60" />
            )}
          </motion.span>
        </>
      )}
    </div>
  );
}
