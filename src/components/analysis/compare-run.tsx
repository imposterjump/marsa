"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Check, FileText, Sparkles } from "lucide-react";
import { cn } from "cn";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import type { AnalysisResultsDto, DocumentDto, VendorResultDto } from "@/lib/api-types";
import { SECTION_ORDER } from "./shared";

interface Step {
  title: string;
  detail: React.ReactNode;
  /** How long the step "works", in ms (shortened under reduced motion). */
  ms: number;
}

/**
 * The comparison as the agents' work (user, 2026-10-25: "i want the client to feel and see the
 * steps of the agentic env"): the comparison itself is computed from the saved analysis and is
 * instant, but pressing Compare plays the hand-over: the bids' files go to the agents, they
 * compare and assess, the results are prepared; each step ticks off, then the section folds away
 * and the table appears. The details are real (files, counts, differing points, prices).
 */
export function CompareRun({
  d,
  vendors,
  rfpDocs,
  onDone,
}: {
  d: AnalysisResultsDto;
  vendors: VendorResultDto[];
  rfpDocs: DocumentDto[];
  onDone: () => void;
}) {
  const reduce = useReducedMotion();
  const steps = buildSteps(d, vendors, rfpDocs);
  const [current, setCurrent] = useState(0);
  const ready = current >= steps.length;
  // The timer only follows the steps: a parent re-render must not restart it.
  const done = useRef(onDone);
  useEffect(() => {
    done.current = onDone;
  });
  const ms = ready ? 900 : steps[current].ms;
  useEffect(() => {
    const t = setTimeout(
      () => (ready ? done.current() : setCurrent((c) => c + 1)),
      ms * (reduce ? 0.3 : 1),
    );
    return () => clearTimeout(t);
  }, [current, ready, ms, reduce]);

  const total = steps.length;
  const pct = Math.round((Math.min(current, total) / total) * 100);

  return (
    <section
      aria-label="AI comparison in progress"
      className="relative overflow-hidden rounded-xl p-5 shadow-md rta-featured sm:p-6"
    >
      <span
        aria-hidden
        className="pointer-events-none absolute -end-16 -top-20 h-64 w-96"
        style={{
          background:
            "linear-gradient(135deg, rgb(236 28 36 / 0.08), rgb(255 138 92 / 0.04) 60%, transparent 85%)",
          clipPath: "polygon(100% 0, 0 18%, 100% 92%)",
        }}
      />
      <header className="relative flex flex-wrap items-center gap-x-4 gap-y-3">
        <motion.span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-2xl text-[#ff8a5c] shadow-[0_0_0_6px_var(--brand-soft)]"
          style={{
            border: "1.5px solid transparent",
            background:
              "linear-gradient(160deg, #232931, #12161b) padding-box, linear-gradient(135deg, #ec1c24, #ff5a47 55%, #ff8a5c) border-box",
          }}
          animate={reduce || ready ? { scale: 1 } : { scale: [1, 1.06, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        >
          {ready ? (
            <Check className="size-6 text-ok-fill" strokeWidth={2.6} />
          ) : (
            <Sparkles className="size-6" strokeWidth={1.7} />
          )}
        </motion.span>
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold text-ink" aria-live="polite">
            {ready ? "Results ready" : `AI agents are comparing ${vendors.length} vendors`}
          </h2>
          <span className="flex flex-wrap items-center gap-2">
            {vendors.map((v) => (
              <span
                key={v.proposalId}
                className="inline-flex items-center gap-1.5 text-xs text-ink-2"
              >
                <InitialsAvatar name={v.vendor.name} size="sm" />
                <span dir="auto">{v.vendor.name}</span>
              </span>
            ))}
          </span>
        </div>
        <span className="text-3xl kpi text-ink tabular-nums" aria-hidden>
          {pct}%
        </span>
      </header>

      <div
        role="progressbar"
        aria-label="Comparison progress"
        aria-valuemin={0}
        aria-valuemax={total}
        aria-valuenow={Math.min(current, total)}
        className="relative mt-4 h-1.5 overflow-hidden rounded-full bg-border"
      >
        <motion.span
          className="absolute inset-y-0 start-0 rounded-full bg-rta"
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: reduce ? 0 : 0.6, ease: EASE_OUT_QUINT }}
        />
        {!ready && !reduce && (
          <span className="absolute inset-y-0 start-0 w-1/3 rounded-full bg-white/40 motion-safe:animate-[marsa-rail_1.4s_ease-in-out_infinite]" />
        )}
      </div>

      <ol className="relative mt-5 flex flex-col gap-1" aria-label="Comparison steps">
        {steps.map((s, i) => {
          const state = i < current ? "done" : i === current ? "running" : "pending";
          return (
            <li key={s.title} className="flex items-start gap-3 rounded-lg px-2 py-2">
              <StepMark state={state} />
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <span
                  className={cn(
                    "text-sm transition-colors duration-300",
                    state === "pending" ? "text-ink-faint" : "font-medium text-ink",
                  )}
                >
                  {s.title}
                  <span className="sr-only">
                    {state === "done"
                      ? ", done"
                      : state === "running"
                        ? ", in progress"
                        : ", pending"}
                  </span>
                </span>
                <AnimatePresence initial={false}>
                  {state !== "pending" && (
                    <motion.div
                      initial={reduce ? { opacity: 0 } : { opacity: 0, height: 0 }}
                      animate={reduce ? { opacity: 1 } : { opacity: 1, height: "auto" }}
                      transition={{ duration: 0.35, ease: EASE_OUT_QUINT }}
                      className="overflow-hidden text-[13px] text-ink-muted"
                    >
                      {s.detail}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

function StepMark({ state }: { state: "done" | "running" | "pending" }) {
  return (
    <span aria-hidden className="relative mt-0.5 grid size-5 shrink-0 place-items-center">
      {state === "pending" && (
        <span className="size-4 rounded-full border-2 border-border-strong" />
      )}
      {state === "running" && (
        <span className="size-4 animate-spin rounded-full border-2 border-brand/20 border-t-brand" />
      )}
      {state === "done" && (
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 420, damping: 18 }}
          className="grid size-5 place-items-center rounded-full bg-ok-fill text-white"
        >
          <Check className="size-3.5" strokeWidth={3} />
        </motion.span>
      )}
    </span>
  );
}

/** Small chips that pop in one after the other. */
function Chips({ items, icon = true }: { items: string[]; icon?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <span className="flex flex-wrap gap-1.5 pt-0.5">
      {items.map((x, i) => (
        <motion.span
          key={x}
          initial={reduce ? false : { opacity: 0, y: 4, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: reduce ? 0 : i * 0.08, duration: 0.25 }}
          className="inline-flex max-w-full items-center gap-1 rounded-md border border-border bg-surface px-2 py-0.5 text-xs text-ink-2"
        >
          {icon && <FileText className="size-3 shrink-0 text-brand" aria-hidden />}
          <span className="truncate" dir="auto">
            {x}
          </span>
        </motion.span>
      ))}
    </span>
  );
}

function buildSteps(
  d: AnalysisResultsDto,
  vendors: VendorResultDto[],
  rfpDocs: DocumentDto[],
): Step[] {
  const files = [
    ...rfpDocs.map((x) => x.originalName),
    ...vendors.flatMap((v) =>
      [...v.technicalDocuments, ...v.commercialDocuments].map((x) => x.originalName),
    ),
  ];
  const sections = SECTION_ORDER.filter((s) => d.requirements.some((r) => r.section === s)).length;
  const rfp = d.requirements.filter((r) => r.scope === "rfp").length;
  const rules = d.requirements.filter((r) => r.scope === "standard").length;
  // Points where the chosen vendors' statuses differ: the assessment's real workload.
  const differing = d.requirements.filter((r) => {
    const statuses = new Set(
      vendors.map((v) => v.findings.find((f) => f.requirementId === r.id)?.status ?? "none"),
    );
    return statuses.size > 1;
  }).length;
  const risks = vendors.reduce((n, v) => n + v.risks.length, 0);
  const prices = vendors.map(
    (v) =>
      `${v.vendor.name}: ${v.commercial.totalPrice?.replace(/[\s,;.]+$/, "") || "price not stated"}`,
  );
  const names = vendors.map((v) => v.vendor.name).join(", ");
  return [
    {
      title: `Collecting the bids of ${names}`,
      detail: <Chips items={files} />,
      ms: 1300,
    },
    {
      title: "Handing the documents to the agents",
      detail: (
        <Chips
          icon={false}
          items={[
            "RFP Compliance Agent",
            ...(rules ? ["Standards Agent"] : []),
            "Risk Agent",
            "Commercial Agent",
          ]}
        />
      ),
      ms: 950,
    },
    {
      title: "Comparing the proposals section by section",
      detail: `${sections} proposal sections · ${rfp} RFP requirements${rules ? ` · ${rules} standard rules` : ""} · ${risks} risks`,
      ms: 1100,
    },
    {
      title: "Assessing where the vendors differ",
      detail: `${differing} point${differing === 1 ? "" : "s"} where the vendors' results differ`,
      ms: 950,
    },
    {
      title: "Weighing the commercial terms",
      detail: <Chips icon={false} items={prices} />,
      ms: 850,
    },
    {
      title: "Preparing the results",
      detail: "Building the side-by-side table and marking the best value in each row",
      ms: 800,
    },
  ];
}
