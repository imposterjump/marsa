"use client";

import { Bot, Check, FlaskConical, KeyRound } from "lucide-react";
import { RadioGroup as RadioGroupPrimitive } from "radix-ui";
import { cn } from "cn";
import { KeyValueList } from "@/components/data/key-value-list";
import { useT } from "@/components/i18n-provider";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/status-pill";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { AiModel } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { SaveStatus, Section } from "./settings-section";

// No prices on the model cards (user, 2026-10-25: the client never sees costs).
const MODELS: { id: AiModel; name: string; blurb: string }[] = [
  {
    id: "claude-opus-5-5",
    name: "Claude Opus 5.5", // i18n-ignore
    blurb: msg(
      "Most thorough. Best for long, technical proposals and subtle partial-compliance calls.",
    ),
  },
  {
    id: "claude-sonnet-5-5",
    name: "Claude Sonnet 5.5", // i18n-ignore
    blurb: msg("Faster, with slightly less depth on very long, complex proposals."),
  },
  {
    id: "claude-haiku-5-5",
    name: "Claude Haiku 5.5", // i18n-ignore
    blurb: msg(
      "Fastest, for trying the pipeline end to end. Rougher calls on partial compliance and subtle conflicts.",
    ),
  },
];

export function AiSection() {
  const t = useT();
  const { data } = useSettings();
  const save = useUpdateSettings();

  if (!data) {
    return (
      <Section id="ai" title={t("AI & runtime")}>
        <Skeleton className="h-64 w-full" />
      </Section>
    );
  }
  const { aiMode, apiKeyConfigured, maxUploadMb } = data.runtime;

  return (
    <Section
      id="ai"
      title={t("AI & runtime")}
      description={t(
        "Which Claude model evaluates proposals, and how. Changes apply to the next analysis run.",
      )}
      aside={<SaveStatus pending={save.isPending} saved={save.isSuccess} />}
    >
      <div className="flex flex-col gap-7">
        <div className="flex flex-col gap-3">
          <span id="model-label" className="font-medium text-ink">
            {t("Model")}
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
                  <span className="text-[13px] leading-relaxed text-ink-muted">{t(m.blurb)}</span>
                  {m.id === "claude-opus-5-5" && (
                    <Pill tone="brand" size="sm" className="absolute end-4 -top-2.5">
                      {t("Recommended")}
                    </Pill>
                  )}
                </RadioGroupPrimitive.Item>
              );
            })}
          </RadioGroupPrimitive.Root>
        </div>

        {/* 2026-10-25: no language to pick; every analysis comes in both (the Translator). */}
        <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{t("Languages of the results")}</span>
            <span className="text-[13px] text-ink-muted">
              {t(
                "Every analysis is written in English, then the Translator agent writes it in Arabic (always on Claude Haiku 5.5). Results and report PDFs follow the screen's language. Documents can be in any language.",
              )}
            </span>
          </div>
          <span className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg bg-surface-muted px-3 text-[13px] font-medium text-ink-2">
            <span lang="en">English</span> {/* i18n-ignore */}
            <span aria-hidden>+</span>
            <span lang="ar">العربية</span>
          </span>
        </div>

        <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{t("Parallel AI steps")}</span>
            <span className="text-[13px] text-ink-muted">
              {t(
                "Steps of the same phase run at once. Higher is faster but can hit API rate limits.",
              )}
            </span>
          </div>
          <SegmentedControl<string>
            aria-label={t("Parallel AI steps")}
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
                label: t("AI mode"),
                value:
                  aiMode === "mock" ? (
                    <Pill tone="info" icon={FlaskConical}>
                      {t("Mock (fixtures, $0)")}
                    </Pill>
                  ) : (
                    <Pill tone="brand" icon={Bot}>
                      {t("Live (Anthropic API)")}
                    </Pill>
                  ),
              },
              {
                label: t("API key"),
                value: apiKeyConfigured ? (
                  <Pill tone="ok" icon={KeyRound}>
                    {t("Configured on the server")}
                  </Pill>
                ) : (
                  <Pill tone="partial" icon={KeyRound}>
                    {t("Missing: add ANTHROPIC_API_KEY to .env")}
                  </Pill>
                ),
              },
              {
                label: t("Max upload size"),
                value: t("{n} MB per file", { n: maxUploadMb }),
              },
            ]}
          />
          <p className="mt-2 text-xs text-ink-muted">
            {t("AI mode is set on the server ({setting} in {file}).", {
              setting: (
                <code dir="ltr" className="font-mono">
                  {"AI_MODE"}
                </code>
              ),
              file: (
                <code dir="ltr" className="font-mono">
                  {".env.local"}
                </code>
              ),
            })}
          </p>
        </div>
      </div>
    </Section>
  );
}
