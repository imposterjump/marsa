"use client";

import Link from "next/link";
import { ArrowUpRight, ShieldCheck, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { PriorityPill } from "@/components/ui/status-pill";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useStandard } from "@/hooks/use-standards";
import type { RequirementSourceDto } from "@/lib/api-types";

type RuleSource = Extract<RequirementSourceDto, { kind: "standard" }>;

/**
 * A standard-rule chip on the results and proposal pages. It opens the rule in a side panel over
 * the page, so closing it leaves the results exactly where they were (user, 2026-10-25: the old
 * link went to the standard page and Back lost the place). The full standard is one click away.
 */
export function StandardRuleChip({
  source,
  className,
  children,
}: {
  source: RuleSource;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <Sheet>
      <Tooltip>
        <TooltipTrigger asChild>
          <SheetTrigger asChild>
            <button type="button" className={className}>
              {children}
            </button>
          </SheetTrigger>
        </TooltipTrigger>
        <TooltipContent className="max-w-sm">
          {source.ruleCode}: {source.ruleText}
        </TooltipContent>
      </Tooltip>
      <SheetContent className="gap-0 p-0 data-[side=left]:w-full data-[side=right]:w-full data-[side=left]:sm:max-w-xl data-[side=right]:sm:max-w-xl">
        <RulePanel source={source} />
      </SheetContent>
    </Sheet>
  );
}

/**
 * The rule as the analysis read it (the stored wording), then every rule of the standard as it is
 * now, with this one marked. Standards can be edited after an analysis, so a changed or removed
 * rule is said plainly instead of silently showing other wording.
 */
function RulePanel({ source }: { source: RuleSource }) {
  const t = useT();
  const { data: std, isError } = useStandard(source.standardId);
  const live = std?.rules.find((r) => r.code === source.ruleCode);
  const changed = !!live && live.text.trim() !== source.ruleText.trim();
  const removed = !!std && !live;

  return (
    <>
      <SheetHeader className="gap-1 border-b border-border px-6 pe-14 pt-6 pb-5">
        <span className="caption-caps text-ink-faint">{t("Standard rule")}</span>
        <SheetTitle className="text-lg leading-snug font-semibold text-ink">
          {std?.title ?? source.standardCode}
        </SheetTitle>
        <SheetDescription className="text-xs text-ink-muted">
          <span className="font-mono">{source.standardCode}</span>
          {std && ` · ${t.plural(std.rules.length, "{n} rule", "{n} rules")}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 py-5">
        <section
          aria-label={t("Rule {code}", { code: source.ruleCode })}
          className="flex flex-col gap-2 rounded-xl border border-brand/30 bg-brand-soft p-4"
        >
          <div className="flex flex-wrap items-center gap-2">
            <ShieldCheck className="size-4 text-brand" aria-hidden />
            <span className="font-mono text-sm font-semibold text-ink">{source.ruleCode}</span>
            {live && <PriorityPill priority={live.priority} size="sm" />}
          </div>
          <p className="text-[15px] leading-relaxed text-ink" dir="auto">
            {source.ruleText}
          </p>
          {(changed || removed || isError) && (
            <p className="flex items-start gap-1.5 pt-1 text-xs text-ink-2">
              <TriangleAlert className="mt-px size-3.5 shrink-0 text-partial" aria-hidden />
              {isError
                ? t("This is the wording the analysis used. The standard has been deleted since.")
                : removed
                  ? t(
                      "This is the wording the analysis used. The rule has been removed from the standard since.",
                    )
                  : t(
                      "This is the wording the analysis used. The rule has been edited since; its current wording is in the list below.",
                    )}
            </p>
          )}
        </section>

        {!isError && (
          <section aria-labelledby="rule-sheet-all" className="flex flex-col gap-3">
            <h3 id="rule-sheet-all" className="caption-caps text-ink-faint">
              {t("All rules in this standard")}
            </h3>
            {!std ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-12 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <ol className="flex flex-col overflow-hidden rounded-xl border border-border">
                {std.rules.map((r) => {
                  const hit = r.code === source.ruleCode;
                  return (
                    <li
                      key={r.id}
                      aria-current={hit || undefined}
                      className={cn(
                        "relative flex items-start gap-3 border-b border-border/70 px-4 py-3 text-[13px] last:border-b-0",
                        hit && "bg-brand-soft",
                      )}
                    >
                      {hit && (
                        <span aria-hidden className="absolute inset-y-0 start-0 w-0.5 bg-brand" />
                      )}
                      <span className="mt-0.5 w-16 shrink-0 font-mono text-xs font-medium text-ink-2">
                        {r.code}
                      </span>
                      <span className="min-w-0 flex-1 leading-relaxed text-ink" dir="auto">
                        {r.text}
                      </span>
                      <PriorityPill priority={r.priority} size="sm" short />
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
        )}
      </div>

      {!isError && (
        <SheetFooter className="border-t border-border px-6 py-4 sm:flex-row sm:justify-end">
          <Button variant="secondary" asChild>
            <Link
              href={`/standards/${source.standardId}?rule=${encodeURIComponent(source.ruleCode)}`}
            >
              {t("Open full standard")} <ArrowUpRight className="rtl:-scale-x-100" />
            </Link>
          </Button>
        </SheetFooter>
      )}
    </>
  );
}
