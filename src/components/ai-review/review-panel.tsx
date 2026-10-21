"use client";

import { useState } from "react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { toast } from "sonner";
import { CircleCheck, CircleX, Send, ShieldAlert, Star } from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Pill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useCreateReview, useRunReviews, type ReviewInput } from "@/hooks/use-ai-review";
import { useSettings } from "@/hooks/use-settings";
import type { RunReviewDto } from "@/lib/api-types";
import type { ReviewVerdict } from "@/lib/domain";
import { formatDateTime } from "@/lib/format";

const DIMENSIONS = [
  { key: "accuracy", label: "Accuracy", hint: "Are the compliance calls right?" },
  { key: "evidence", label: "Evidence", hint: "Do the quotes and pages support them?" },
  { key: "completeness", label: "Completeness", hint: "Did it miss requirements or risks?" },
  { key: "usefulness", label: "Usefulness", hint: "Would the summary help a committee decide?" },
] as const;
type Dimension = (typeof DIMENSIONS)[number]["key"];

const VERDICTS: {
  id: ReviewVerdict;
  label: string;
  tone: "ok" | "partial" | "fail";
  icon: typeof CircleCheck;
}[] = [
  { id: "trust", label: "Trust it", tone: "ok", icon: CircleCheck },
  { id: "trust_with_edits", label: "Trust with corrections", tone: "partial", icon: ShieldAlert },
  { id: "do_not_trust", label: "Don't trust it", tone: "fail", icon: CircleX },
];

/** 1–5 stars as an accessible radio group (arrow keys move, Space/Enter selects). */
function Stars({
  value,
  onChange,
  label,
  size = "md",
}: {
  value: number | null;
  onChange: (v: number) => void;
  label: string;
  size?: "md" | "lg";
}) {
  return (
    <RadioGroupPrimitive.Root
      aria-label={label}
      value={value ? String(value) : ""}
      onValueChange={(v) => onChange(Number(v))}
      orientation="horizontal"
      className="flex items-center gap-0.5"
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <RadioGroupPrimitive.Item
          key={n}
          value={String(n)}
          aria-label={`${n} of 5`}
          className="rounded-md p-0.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/30"
        >
          <Star
            aria-hidden
            className={cn(
              size === "lg" ? "size-7" : "size-5",
              "transition-colors",
              value && n <= value ? "fill-brand text-brand" : "text-ink-faint",
            )}
          />
        </RadioGroupPrimitive.Item>
      ))}
    </RadioGroupPrimitive.Root>
  );
}

function StarsReadOnly({ value, label }: { value: number; label: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${label}: ${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          aria-hidden
          className={cn("size-3.5", n <= value ? "fill-brand text-brand" : "text-ink-faint")}
        />
      ))}
    </span>
  );
}

/**
 * Human review of one run (saved with a snapshot of the run's metrics, for improving the system).
 */
export function ReviewPanel({ projectId, runId }: { projectId: string; runId: string }) {
  const { data: settings } = useSettings();
  const { data: reviews } = useRunReviews(runId);
  const create = useCreateReview(projectId, runId);
  const [overall, setOverall] = useState<number | null>(null);
  const [dims, setDims] = useState<Record<Dimension, number | null>>({
    accuracy: null,
    evidence: null,
    completeness: null,
    usefulness: null,
  });
  const [verdict, setVerdict] = useState<ReviewVerdict | null>(null);
  const [comment, setComment] = useState("");
  const [reviewer, setReviewer] = useState<string | null>(null);
  const [tried, setTried] = useState(false);
  const name = reviewer ?? settings?.customerName ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!overall || !verdict) return;
    const input: ReviewInput = { reviewer: name, overall, ...dims, verdict, comment };
    try {
      await create.mutateAsync(input);
      toast.success("Review saved");
      setOverall(null);
      setDims({ accuracy: null, evidence: null, completeness: null, usefulness: null });
      setVerdict(null);
      setComment("");
      setTried(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save the review.");
    }
  };

  return (
    <section
      aria-labelledby="review-title"
      className="flex flex-col gap-5 rounded-xl border border-border bg-surface p-6 shadow-xs"
    >
      <div className="flex flex-col gap-1">
        <h3 id="review-title" className="font-heading text-base font-semibold text-ink">
          Your review of this analysis
        </h3>
        <p className="text-[13px] text-ink-muted">
          Rate the AI’s work after checking its findings. Reviews are stored with this run’s metrics
          and can be exported to improve prompts, models and scoring.
        </p>
      </div>

      <form onSubmit={submit} noValidate className="flex flex-col gap-5">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-ink">Overall rating</span>
          <Stars value={overall} onChange={setOverall} label="Overall rating" size="lg" />
          {tried && !overall && <p className="text-xs text-fail">Choose an overall rating.</p>}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {DIMENSIONS.map((d) => (
            <div key={d.key} className="flex flex-col gap-1">
              <span className="text-[13px] font-medium text-ink">
                {d.label} <span className="font-normal text-ink-faint">(optional)</span>
              </span>
              <span className="text-xs text-ink-muted">{d.hint}</span>
              <Stars
                value={dims[d.key]}
                onChange={(v) => setDims((x) => ({ ...x, [d.key]: v }))}
                label={d.label}
              />
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-2">
          <span id="verdict-label" className="text-sm font-medium text-ink">
            Would you rely on it for the award decision?
          </span>
          <RadioGroupPrimitive.Root
            aria-labelledby="verdict-label"
            value={verdict ?? ""}
            onValueChange={(v) => setVerdict(v as ReviewVerdict)}
            className="flex flex-wrap gap-2"
          >
            {VERDICTS.map((v) => (
              <RadioGroupPrimitive.Item
                key={v.id}
                value={v.id}
                className={cn(
                  "flex items-center gap-2 rounded-lg border px-3 py-2 text-[13px] font-medium transition-colors outline-none focus-visible:ring-3 focus-visible:ring-ring/25",
                  verdict === v.id
                    ? v.tone === "ok"
                      ? "border-ok bg-ok-soft text-ink"
                      : v.tone === "partial"
                        ? "border-partial bg-partial-soft text-ink"
                        : "border-fail bg-fail-soft text-ink"
                    : "border-border text-ink-2 hover:bg-surface-muted",
                )}
              >
                <v.icon
                  aria-hidden
                  className={cn(
                    "size-4",
                    v.tone === "ok"
                      ? "text-ok"
                      : v.tone === "partial"
                        ? "text-partial"
                        : "text-fail",
                  )}
                />
                {v.label}
              </RadioGroupPrimitive.Item>
            ))}
          </RadioGroupPrimitive.Root>
          {tried && !verdict && <p className="text-xs text-fail">Choose one.</p>}
        </div>

        <Field
          label="Comments"
          optional
          hint="What was wrong or missing? Which findings did you have to correct?"
        >
          <Textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            maxLength={4000}
          />
        </Field>
        <Field label="Reviewer" optional>
          <Input value={name} onChange={(e) => setReviewer(e.target.value)} maxLength={120} />
        </Field>

        <div>
          <Button type="submit" disabled={create.isPending}>
            <Send /> Submit review
          </Button>
        </div>
      </form>

      {!!reviews?.length && (
        <div className="flex flex-col gap-3 border-t border-border pt-5">
          <h4 className="text-2xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
            Reviews of this run ({reviews.length})
          </h4>
          <ul className="flex flex-col gap-3">
            {reviews.map((r) => (
              <ReviewItem key={r.id} r={r} />
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

function ReviewItem({ r }: { r: RunReviewDto }) {
  const v = VERDICTS.find((x) => x.id === r.verdict)!;
  return (
    <li className="flex flex-col gap-2 rounded-lg border border-border/70 p-4 text-[13px]">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <StarsReadOnly value={r.overall} label="Overall" />
        <Pill tone={v.tone} icon={v.icon} size="sm">
          {v.label}
        </Pill>
        <span className="text-xs text-ink-muted">
          {r.reviewer || "Anonymous"} · {formatDateTime(r.createdAt)}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-muted">
        {DIMENSIONS.map((d) =>
          r[d.key] ? (
            <span key={d.key} className="flex items-center gap-1">
              {d.label} <StarsReadOnly value={r[d.key]!} label={d.label} />
            </span>
          ) : null,
        )}
      </div>
      {r.comment && <p className="leading-relaxed whitespace-pre-line text-ink-2">{r.comment}</p>}
    </li>
  );
}
