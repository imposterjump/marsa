"use client";

import { useEffect, useMemo, useState } from "react";
import { Minus, Plus, RotateCcw, ShieldAlert } from "lucide-react";
import { ProgressRing } from "@/components/data/progress-ring";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingStatusPill, PriorityPill } from "@/components/ui/status-pill";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { SettingsDto } from "@/lib/api-types";
import {
  DEFAULT_PARTIAL_CREDIT,
  DEFAULT_WEIGHTS,
  PRIORITIES,
  type FindingStatus,
  type Priority,
  type Weights,
} from "@/lib/domain";
import { PRIORITY_LABEL } from "@/lib/labels";
import { computeScore, creditFor } from "@/lib/scoring";
import { SaveStatus, Section } from "./settings-section";
import { APP_NAME } from "@/lib/brand";

const PRIORITY_HINT: Record<Priority, string> = {
  mandatory: "Must be met. Failing one also flags the vendor at the mandatory gate.",
  important: "Strongly influences the score.",
  desirable: "Nice to have; small influence.",
};

/** Fixed sample so the effect of every setting is visible at a glance. */
const SAMPLE: { code: string; priority: Priority; status: FindingStatus }[] = [
  { code: "REQ-001", priority: "mandatory", status: "compliant" },
  { code: "REQ-002", priority: "mandatory", status: "compliant" },
  { code: "REQ-003", priority: "mandatory", status: "partial" },
  { code: "REQ-004", priority: "mandatory", status: "non_compliant" },
  { code: "REQ-005", priority: "important", status: "compliant" },
  { code: "REQ-006", priority: "important", status: "partial" },
  { code: "REQ-007", priority: "important", status: "compliant" },
  { code: "REQ-008", priority: "desirable", status: "not_addressed" },
  { code: "REQ-009", priority: "desirable", status: "compliant" },
  { code: "REQ-010", priority: "desirable", status: "partial" },
];

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2).replace(/0$/, ""));

export function ScoringSection() {
  const { data } = useSettings();
  return (
    <Section
      id="scoring"
      title="Scoring"
      description={`How a vendor's compliance % is calculated from its findings. ${APP_NAME} computes it; the AI never picks the number.`}
    >
      {/* Mounted once when settings load; later saves don't remount (keeps focus while editing). */}
      {data ? <ScoringEditor initial={data} /> : <Skeleton className="h-96 w-full" />}
    </Section>
  );
}

function ScoringEditor({ initial }: { initial: SettingsDto }) {
  const save = useUpdateSettings();
  const [weights, setWeights] = useState<Weights>(initial.weights);
  const [partial, setPartial] = useState(initial.partialCredit);
  const [saved, setSaved] = useState({ weights: initial.weights, partial: initial.partialCredit });

  const dirty =
    partial !== saved.partial || PRIORITIES.some((p) => weights[p] !== saved.weights[p]);

  // Debounced auto-save (sync to the server = external system, allowed in an effect).
  useEffect(() => {
    if (!dirty) return;
    const t = setTimeout(() => {
      save.mutate(
        { weights, partialCredit: partial },
        { onSuccess: () => setSaved({ weights, partial }) },
      );
    }, 600);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- save identity is stable enough; avoid re-arming on each render
  }, [weights, partial, dirty]);

  const result = useMemo(() => computeScore(SAMPLE, weights, partial), [weights, partial]);
  const isDefault =
    partial === DEFAULT_PARTIAL_CREDIT &&
    PRIORITIES.every((p) => weights[p] === DEFAULT_WEIGHTS[p]);
  const allZero = PRIORITIES.every((p) => weights[p] === 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-4">
        <SaveStatus pending={dirty || save.isPending} saved={!dirty && save.isSuccess} />
        <Button
          variant="ghost"
          size="sm"
          className="ms-auto"
          disabled={isDefault}
          onClick={() => {
            setWeights({ ...DEFAULT_WEIGHTS });
            setPartial(DEFAULT_PARTIAL_CREDIT);
          }}
        >
          <RotateCcw /> Reset to defaults
        </Button>
      </div>

      {/* Weights */}
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-3 font-medium text-ink">Weight per priority</legend>
        {PRIORITIES.map((p) => (
          <div
            key={p}
            className="flex items-center justify-between gap-4 border-b border-border/60 py-3 last:border-b-0"
          >
            <div className="flex min-w-0 items-center gap-3">
              <PriorityPill priority={p} />
              <span className="hidden text-[13px] text-ink-muted md:inline">
                {PRIORITY_HINT[p]}
              </span>
            </div>
            <Stepper
              label={`${PRIORITY_LABEL[p]} weight`}
              value={weights[p]}
              onChange={(v) => setWeights((w) => ({ ...w, [p]: v }))}
            />
          </div>
        ))}
        {allZero && (
          <p className="text-xs text-fail">
            At least one weight must be above 0, otherwise every score is 0%.
          </p>
        )}
      </fieldset>

      {/* Partial credit */}
      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <label htmlFor="partial-credit" className="font-medium text-ink">
            Credit for “partially compliant”
          </label>
          <span className="font-heading text-lg font-semibold text-ink tabular-nums">
            {Math.round(partial * 100)}%
          </span>
        </div>
        <input
          id="partial-credit"
          type="range"
          min={0}
          max={100}
          step={5}
          value={Math.round(partial * 100)}
          onChange={(e) => setPartial(Number(e.target.value) / 100)}
          className="h-2 w-full cursor-pointer accent-[var(--brand)]"
          aria-valuetext={`${Math.round(partial * 100)} percent`}
        />
        <p className="text-[13px] text-ink-muted">
          A requirement that is only partly met earns this share of its weight. Example: 27″ display
          requested at 2K, offered at HD → partial.
        </p>
      </div>

      {/* Live example */}
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface-muted/40 p-5">
        <div className="flex flex-col gap-1">
          <h3 className="font-semibold text-ink">Live example</h3>
          <p className="text-[13px] text-ink-muted">
            A vendor with 10 findings. Change the settings above and watch the score.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_200px]">
          <div className="overflow-x-auto">
            <table className="w-full text-[13px]">
              <caption className="sr-only">Sample findings and points</caption>
              <thead>
                <tr className="text-xs text-ink-muted">
                  <th className="py-1.5 pe-3 text-start font-medium">Req.</th>
                  <th className="py-1.5 pe-3 text-start font-medium">Priority</th>
                  <th className="py-1.5 pe-3 text-start font-medium">Finding</th>
                  <th className="py-1.5 text-end font-medium">Points</th>
                </tr>
              </thead>
              <tbody>
                {SAMPLE.map((r) => {
                  const w = weights[r.priority];
                  const got = w * creditFor(r.status, partial);
                  return (
                    <tr key={r.code} className="border-t border-border/60">
                      <td className="py-1.5 pe-3 font-mono text-xs text-ink-2">{r.code}</td>
                      <td className="py-1.5 pe-3">
                        <PriorityPill priority={r.priority} size="sm" />
                      </td>
                      <td className="py-1.5 pe-3">
                        <FindingStatusPill status={r.status} size="sm" />
                      </td>
                      <td className="py-1.5 text-end text-ink tabular-nums">
                        {fmt(got)} <span className="text-ink-faint">/ {fmt(w)}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border-strong font-semibold text-ink">
                  <td colSpan={3} className="py-2">
                    Total
                  </td>
                  <td className="py-2 text-end tabular-nums">
                    {fmt(result.earned)} / {fmt(result.possible)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg bg-surface p-4">
            <ProgressRing
              key={`${result.scorePct}`}
              value={result.scorePct}
              decimals={1}
              size={120}
              caption="compliance"
              label="Example compliance score"
            />
            <p className="text-center text-xs text-ink-muted tabular-nums">
              {fmt(result.earned)} ÷ {fmt(result.possible)} × 100
            </p>
            {result.mandatoryFailures > 0 && (
              <p className="flex items-center gap-1.5 text-center text-xs font-medium text-fail">
                <ShieldAlert className="size-3.5" aria-hidden />
                {result.mandatoryFailures} mandatory failure: flagged at the gate
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  const clamp = (v: number) => Math.max(0, Math.min(10, Math.round(v)));
  return (
    <div className="flex items-center gap-1" role="group" aria-label={label}>
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        aria-label={`Decrease ${label}`}
        disabled={value <= 0}
        onClick={() => onChange(clamp(value - 1))}
      >
        <Minus />
      </Button>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        max={10}
        aria-label={label}
        value={value}
        onChange={(e) => onChange(clamp(Number(e.target.value || 0)))}
        className="h-8 w-12 [appearance:textfield] rounded-md border border-input bg-surface text-center font-semibold text-ink tabular-nums outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 [&::-webkit-inner-spin-button]:appearance-none"
      />
      <Button
        type="button"
        variant="secondary"
        size="icon-sm"
        aria-label={`Increase ${label}`}
        disabled={value >= 10}
        onClick={() => onChange(clamp(value + 1))}
      >
        <Plus />
      </Button>
    </div>
  );
}
