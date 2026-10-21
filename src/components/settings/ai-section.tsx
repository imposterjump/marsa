"use client";

import { Bot, Check, FlaskConical, KeyRound } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "cn";
import { KeyValueList } from "@/components/data/key-value-list";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { AiModel, ReportLanguage } from "@/lib/domain";
import { SaveStatus, Section } from "./settings-section";

const MODELS: { id: AiModel; name: string; blurb: string; price: string }[] = [
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5",
    blurb: "Most thorough. Best for long, technical proposals and subtle partial-compliance calls.",
    price: "$4 / $20 per million input / output tokens",
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5",
    blurb: "Faster and half the price. Slightly less depth on very long, complex proposals.",
    price: "$2 / $10 per million input / output tokens",
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5",
    blurb:
      "Fastest and cheapest, for trying the pipeline end to end. Rougher calls on partial compliance and subtle conflicts.",
    price: "$0.10 / $0.50 per million tokens (prompts ≤ 100K tokens; 5× above)",
  },
];

export function AiSection() {
  const { data } = useSettings();
  const save = useUpdateSettings();

  if (!data) {
    return (
      <Section id="ai" title="AI & runtime">
        <Skeleton className="h-64 w-full" />
      </Section>
    );
  }
  const { aiMode, apiKeyConfigured, maxUploadMb } = data.runtime;

  return (
    <Section
      id="ai"
      title="AI & runtime"
      description="Which Claude model evaluates proposals, and how. Changes apply to the next analysis run."
      aside={<SaveStatus pending={save.isPending} saved={save.isSuccess} />}
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <span id="model-label" className="font-medium text-ink">
            Model
          </span>
          <RadioGroupPrimitive.Root
            aria-labelledby="model-label"
            value={data.aiModel}
            onValueChange={(v) => save.mutate({ aiModel: v as AiModel })}
            className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3"
          >
            {MODELS.map((m) => {
              const selected = data.aiModel === m.id;
              return (
                <RadioGroupPrimitive.Item
                  key={m.id}
                  value={m.id}
                  className={cn(
                    "relative flex flex-col gap-2 rounded-xl border p-4 text-start transition-[border-color,box-shadow,background-color] duration-150 outline-none",
                    "focus-visible:ring-3 focus-visible:ring-ring/25",
                    selected
                      ? "border-brand bg-brand-soft/30 shadow-xs"
                      : "border-border hover:border-border-strong hover:bg-surface-muted/40",
                  )}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-ink">{m.name}</span>
                    <span
                      aria-hidden
                      className={cn(
                        "flex size-5 items-center justify-center rounded-full border transition-colors",
                        selected ? "border-brand bg-brand text-on-brand" : "border-border-strong",
                      )}
                    >
                      {selected && <Check className="size-3" strokeWidth={3} />}
                    </span>
                  </span>
                  <span className="text-[13px] leading-relaxed text-ink-muted">{m.blurb}</span>
                  <span className="text-xs font-medium text-ink-2">{m.price}</span>
                  {m.id === "claude-opus-5-5" && (
                    <Pill tone="brand" size="sm" className="absolute end-4 -top-2.5">
                      Recommended
                    </Pill>
                  )}
                </RadioGroupPrimitive.Item>
              );
            })}
          </RadioGroupPrimitive.Root>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">Report language</span>
            <span className="text-[13px] text-ink-muted">
              Language of the AI&apos;s findings and summaries. Documents can be in any language.
            </span>
          </div>
          <SegmentedControl<ReportLanguage>
            aria-label="Report language"
            value={data.reportLanguage}
            onValueChange={(v) => save.mutate({ reportLanguage: v })}
            options={[
              { value: "en", label: "English" },
              { value: "ar", label: <span lang="ar">العربية</span> },
            ]}
          />
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">Parallel AI steps</span>
            <span className="text-[13px] text-ink-muted">
              Steps of the same phase run at once. Higher is faster but can hit API rate limits.
            </span>
          </div>
          <SegmentedControl<string>
            aria-label="Parallel AI steps"
            size="sm"
            value={String(data.concurrency)}
            onValueChange={(v) => save.mutate({ concurrency: Number(v) })}
            options={["1", "2", "3", "4", "5", "6"].map((n) => ({ value: n, label: n }))}
          />
        </div>

        <div className="border-t border-border/70 pt-2">
          <KeyValueList
            items={[
              {
                label: "AI mode",
                value:
                  aiMode === "mock" ? (
                    <Pill tone="info" icon={FlaskConical}>
                      Mock (fixtures, $0)
                    </Pill>
                  ) : (
                    <Pill tone="brand" icon={Bot}>
                      Live (Anthropic API)
                    </Pill>
                  ),
              },
              {
                label: "API key",
                value: apiKeyConfigured ? (
                  <Pill tone="ok" icon={KeyRound}>
                    Configured on the server
                  </Pill>
                ) : (
                  <Pill tone="partial" icon={KeyRound}>
                    Missing: add ANTHROPIC_API_KEY to .env
                  </Pill>
                ),
              },
              { label: "Max upload size", value: `${maxUploadMb} MB per file` },
            ]}
          />
          <p className="mt-2 text-xs text-ink-muted">
            AI mode is set on the server (<code className="font-mono">AI_MODE</code> in{" "}
            <code className="font-mono">.env.local</code>).
          </p>
        </div>
      </div>
    </Section>
  );
}
