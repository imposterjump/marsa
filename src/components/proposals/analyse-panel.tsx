"use client";

import Link from "next/link";
import { ArrowRight, CircleAlert, Info, Loader2, Sparkles } from "lucide-react";
import { cn } from "cn";
import { StartRunButton } from "@/components/evaluation/start-run-button";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { Pill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRunEstimate } from "@/hooks/use-estimate";
import { useSettings } from "@/hooks/use-settings";
import type { ProjectDetailDto, ProposalSummaryDto } from "@/lib/api-types";
import { DEFAULT_AI_MODEL, DEFAULT_CONCURRENCY } from "@/lib/domain";
import { AI_MODEL_LABEL } from "@/lib/labels";
import { estimateSeconds, planRun } from "@/lib/plan";

/**
 * PRD FR-5.3: the analysis summary under the proposals table. Shows what the run will cover
 * (P8: each vendor against the standards, then the RFP, then its risks, then a recommendation;
 * T = 4N + 3 steps, 3N + 3 without standards, incl. the reports and the translation) with a
 * time and cost estimate calibrated on real
 * runs (estimateRun). With live AI the button confirms the estimated cost first.
 */
export function AnalysePanel({
  project,
  proposals,
}: {
  project: ProjectDetailDto;
  proposals: ProposalSummaryDto[];
}) {
  const t = useT();
  const { data: settings } = useSettings();
  const n = proposals.length;
  const plan = planRun(n, project.standards.length > 0);
  const mode = settings?.runtime.aiMode ?? "mock";
  const model = settings?.aiModel ?? DEFAULT_AI_MODEL;
  const estimate = useRunEstimate(project.id);
  const seconds =
    mode === "live" && estimate
      ? estimate.seconds
      : estimateSeconds(n, {
          concurrency: settings?.concurrency ?? DEFAULT_CONCURRENCY,
          mode,
          withStandards: project.standards.length > 0,
        });
  const rules = project.standards.reduce((s, x) => s + x.rulesCount, 0);
  const incomplete = proposals.filter(
    (p) => !p.documentCounts.commercial || !p.documentCounts.technical,
  );

  const notes: { tone: "warn" | "info"; text: string }[] = [];
  if (incomplete.length) {
    notes.push({
      tone: "warn",
      text: t.plural(
        incomplete.length,
        "{names} is missing a commercial or technical file.",
        "{names} are missing a commercial or technical file.",
        { names: incomplete.map((p) => p.vendor.name).join(t.locale === "ar" ? "، " : ", ") },
      ),
    });
  }
  if (!project.standards.length) {
    notes.push({
      tone: "info",
      text: t("No standards applied: proposals are checked against the RFP only."),
    });
  }

  const steps: [string, number][] = [
    [t("Checklist"), plan.phases.checklist],
    ...(plan.phases.standards
      ? ([[t("Standards"), plan.phases.standards]] as [string, number][])
      : []),
    [t("RFP"), plan.phases.analyze],
    [t("Risk"), plan.phases.risk],
    [t("Recommendation"), plan.phases.summary],
    [t("Report"), plan.phases.report],
    [t("Translation"), plan.phases.translate],
  ];
  const standardsCount = project.standards.length;

  return (
    <section
      aria-labelledby="analyse-title"
      className="relative overflow-hidden rounded-xl border border-border bg-surface shadow-xs"
    >
      <span aria-hidden className="absolute inset-x-0 top-0 h-0.5 bg-rta" />
      <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h3
              id="analyse-title"
              className="flex items-center gap-2 font-heading text-base font-semibold tracking-tight text-ink"
            >
              <Sparkles className="size-4 text-brand" aria-hidden />
              {t("AI analysis")}
            </h3>
            <p className="max-w-2xl text-[13px] leading-relaxed text-ink-muted">
              {n === 0
                ? t(
                    "Once vendors are added, {app} checks every proposal against the standards and, separately, the RFP, assesses its risks, recommends a vendor and writes a consultant report on each bid.",
                    { app: t.appName },
                  )
                : standardsCount
                  ? n === 1
                    ? t.plural(
                        standardsCount,
                        "{app} will check the proposal against {n} standard ({rules} rules) and, separately, the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        "{app} will check the proposal against {n} standards ({rules} rules) and, separately, the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        { app: t.appName, rules },
                      )
                    : t.plural(
                        standardsCount,
                        "{app} will check each of the {count} proposals against {n} standard ({rules} rules) and, separately, the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        "{app} will check each of the {count} proposals against {n} standards ({rules} rules) and, separately, the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        { app: t.appName, count: n, rules },
                      )
                  : n === 1
                    ? t(
                        "{app} will check the proposal against the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        { app: t.appName },
                      )
                    : t(
                        "{app} will check each of the {count} proposals against the RFP, assess its risks, recommend a vendor and write a consultant report on each bid.",
                        { app: t.appName, count: n },
                      )}
            </p>
          </div>

          {n > 0 && (
            <dl className="flex flex-wrap gap-x-8 gap-y-3 text-[13px]">
              <Stat label={t("Proposals")} value={String(n)} />
              <Stat
                label={t("Standards")}
                value={
                  project.standards.length ? (
                    <span className="flex flex-wrap gap-1.5">
                      {project.standards.map((s) => (
                        <Pill key={s.id} tone="neutral" size="sm">
                          <span className="font-mono">{s.code}</span>
                        </Pill>
                      ))}
                    </span>
                  ) : (
                    t("None")
                  )
                }
              />
              <Stat
                label={t("Steps")}
                value={
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        tabIndex={0}
                        className="cursor-help underline decoration-dotted underline-offset-4"
                      >
                        {plan.total} ({plan.phases.standards ? 4 : 3} × {n} + 3)
                      </span>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      {plan.phases.standards
                        ? t(
                            "1 checklist, then per vendor: standards, RFP and risk, then 1 recommendation, then a consultant report per vendor, then the translation into Arabic.",
                          )
                        : t(
                            "1 checklist, then per vendor: RFP and risk, then 1 recommendation, then a consultant report per vendor, then the translation into Arabic.",
                          )}
                    </TooltipContent>
                  </Tooltip>
                }
              />
              <Stat label={t("Time")} value={`≈ ${t.duration(seconds)}`} />
              <Stat
                label={t("AI")}
                value={mode === "live" ? AI_MODEL_LABEL[model] : t("Demo AI")}
              />
            </dl>
          )}

          {n > 0 && (
            <ol
              aria-label={t("Pipeline")}
              className="flex flex-wrap items-center gap-1.5 text-xs text-ink-2"
            >
              {steps.map(([label, count], i) => (
                <li key={label} className="flex items-center gap-1.5">
                  <span className="rounded-md border border-border bg-surface-muted/60 px-2 py-0.5 tabular-nums">
                    {count} × {label}
                  </span>
                  {i < steps.length - 1 && (
                    <ArrowRight className="size-3 text-ink-faint rtl:rotate-180" aria-hidden />
                  )}
                </li>
              ))}
            </ol>
          )}

          {notes.length > 0 && (
            <ul className="flex flex-col gap-1.5">
              {notes.map((x) => (
                <li
                  key={x.text}
                  className={cn(
                    "flex items-start gap-2 text-xs",
                    x.tone === "warn" ? "text-partial" : "text-ink-muted",
                  )}
                >
                  {x.tone === "warn" ? (
                    <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                  ) : (
                    <Info className="mt-px size-3.5 shrink-0" aria-hidden />
                  )}
                  {x.text}
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="flex shrink-0 flex-col items-stretch gap-2 lg:items-end">
          {project.status === "evaluating" ? (
            <Button asChild size="lg" className="w-full lg:w-auto">
              <Link href={`/analysis/${project.id}`}>
                <Loader2 className="motion-safe:animate-spin" /> {t("View progress")}
              </Link>
            </Button>
          ) : n > 0 && (project.status === "open" || project.status === "evaluated") ? (
            <StartRunButton projectId={project.id} className="w-full lg:w-auto" />
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span tabIndex={0} className="inline-flex rounded-lg">
                  <Button size="lg" disabled className="w-full lg:w-auto">
                    <Sparkles /> {t("Analyse & process")}
                  </Button>
                </span>
              </TooltipTrigger>
              <TooltipContent>
                {n === 0
                  ? t("Needs at least one proposal.")
                  : t("Publish or restore the tender first.")}
              </TooltipContent>
            </Tooltip>
          )}
          <span className="text-center text-2xs text-ink-faint lg:text-end">
            {n === 0
              ? t("Needs at least one proposal")
              : project.status === "evaluated"
                ? t("Already analysed · runs again with current settings")
                : t("Estimates are rough")}
          </span>
        </div>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="caption-caps text-ink-muted">{label}</dt>
      <dd className="font-medium text-ink tabular-nums">{value}</dd>
    </div>
  );
}
