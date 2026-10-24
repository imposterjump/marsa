"use client";

import Link from "next/link";
import {
  ChevronRight,
  ClipboardCheck,
  FileStack,
  FileText,
  Plus,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { MaskedText } from "@/components/motion/masked-text";
import { Reveal } from "@/components/motion/reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useGreeting, useToday } from "@/hooks/use-client-store";
import { useVendors } from "@/hooks/use-proposals";
import { useSettings } from "@/hooks/use-settings";
import { useStandards } from "@/hooks/use-standards";
import type { ProjectSummaryDto } from "@/lib/api-types";
import { APP_NAME } from "@/lib/brand";
import { firstName } from "@/lib/format";

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

interface Step {
  title: string;
  icon: React.ReactNode;
  value: number | undefined;
  unit: (n: number) => string;
  detail: string | undefined;
  featured?: boolean;
}

/**
 * Projects home welcome band (user, 2026-10-24): a general overview, never about one project.
 * Greeting + what the app does, then the procurement workflow as an RTA KPI band, each step
 * carrying workspace-wide totals. Replaces the old hero with the harbour line art.
 * Styled as the RTA "dark hero band" (ink, angular glow, gradient edge, clipped corner) so it
 * stands apart from the light project list; its content is a `dark` token island in both themes.
 */
export function ProjectsWelcome({ projects }: { projects: ProjectSummaryDto[] | undefined }) {
  const { data: settings } = useSettings();
  const { data: standards } = useStandards();
  const { data: vendors } = useVendors();
  // Time-of-day text exists only in the browser (server snapshot is null → skeleton).
  const greet = useGreeting();
  const date = useToday();
  const now = greet && date ? { greet, date } : null;

  const first =
    settings?.customerName && settings.customerName !== "Guest"
      ? firstName(settings.customerName)
      : null;
  const name = first ? first.charAt(0).toLocaleUpperCase() + first.slice(1) : null;

  const count = (s: ProjectSummaryDto["status"]) =>
    projects?.filter((p) => p.status === s).length ?? 0;
  const active = standards?.filter((s) => s.isActive);

  const steps: Step[] = [
    {
      title: "Publish the RFP",
      icon: <FileText />,
      value: projects?.filter((p) => p.status !== "archived").length,
      unit: (n) => (n === 1 ? "tender" : "tenders"),
      detail: projects
        ? [`${count("open")} open for proposals`, count("draft") && plural(count("draft"), "draft")]
            .filter(Boolean)
            .join(" · ")
        : undefined,
    },
    {
      title: "Apply standards",
      icon: <ShieldCheck />,
      value: active?.length,
      unit: (n) => (n === 1 ? "standard" : "standards"),
      detail: active
        ? `${plural(
            active.reduce((n, s) => n + s.rulesCount, 0),
            "rule",
          )} · ${active.reduce((n, s) => n + s.mandatoryCount, 0)} mandatory`
        : undefined,
    },
    {
      title: "Collect vendor bids",
      icon: <FileStack />,
      value: projects?.reduce((n, p) => n + p.proposalCount, 0),
      unit: (n) => (n === 1 ? "proposal" : "proposals"),
      detail: vendors
        ? `from ${plural(vendors.filter((v) => v.proposalCount > 0).length, "vendor")}`
        : undefined,
    },
    {
      title: "AI analysis",
      icon: <Sparkles />,
      value: projects ? count("evaluated") : undefined,
      unit: () => "evaluated",
      detail: projects
        ? count("evaluating")
          ? `${count("evaluating")} running now`
          : "Compliance, risks and a recommendation"
        : undefined,
      featured: true,
    },
  ];

  return (
    <section
      aria-label="Welcome"
      className="group/hero relative isolate overflow-hidden rounded-2xl bg-rail rta-clip dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.07)]"
    >
      <div className="dark relative">
        {/* RTA angular glow (top end) and gradient edge (start). */}
        <div
          aria-hidden
          className="pointer-events-none absolute -end-20 -top-16 h-80 w-[420px] max-w-full bg-[linear-gradient(135deg,rgb(236_28_36/0.35),rgb(255_138_92/0.12)_60%,transparent_80%)] opacity-80 transition-opacity duration-700 [clip-path:polygon(100%_0,0_20%,100%_90%)] group-hover/hero:opacity-100 rtl:bg-[linear-gradient(225deg,rgb(236_28_36/0.35),rgb(255_138_92/0.12)_60%,transparent_80%)] rtl:[clip-path:polygon(0_0,100%_20%,0_90%)]"
        />
        <span
          aria-hidden
          className="absolute inset-y-0 start-0 z-10 w-1 bg-[linear-gradient(180deg,#ec1c24,#ff5a47,#ff8a5c)]"
        />

        <div className="relative">
          <DepthBackdrop />
          <div className="relative flex flex-col gap-6 px-6 py-7 sm:px-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex max-w-2xl min-w-0 flex-col gap-3">
              <div className="flex min-h-4 flex-wrap items-center gap-x-2 gap-y-1 caption-caps text-ink-muted">
                {now ? (
                  <>
                    <span className="whitespace-nowrap">{now.date}</span>
                    {settings?.organization && (
                      <>
                        <span aria-hidden>·</span>
                        <span className="max-w-full truncate" dir="auto">
                          {settings.organization}
                        </span>
                      </>
                    )}
                  </>
                ) : (
                  <Skeleton className="h-3 w-48" />
                )}
              </div>
              {now && settings ? (
                <MaskedText
                  key={`${now.greet}-${name}`}
                  as="h1"
                  text={[name ? `${now.greet}, ${name}.` : `${now.greet}.`]}
                  className="font-heading text-[30px] leading-[1.1] font-semibold tracking-[-0.02em] text-ink sm:text-[36px]"
                  lineClassName="[&]:text-balance"
                />
              ) : (
                <Skeleton className="my-1 h-9 w-80 max-w-full" />
              )}
              <span aria-hidden className="rta-rule" />
              <Reveal delay={0.2} immediate>
                <p className="max-w-xl pt-1 text-[15px] leading-relaxed text-pretty text-ink-2">
                  Weigh every vendor bid against your RFP and your standards. {APP_NAME} checks each
                  requirement, scores compliance and risk, and backs every point with evidence.
                </p>
              </Reveal>
            </div>
            <Reveal delay={0.3} immediate className="flex shrink-0 flex-wrap items-center gap-3">
              <Button size="lg" className="group/new flex-1 sm:flex-none" asChild>
                <Link href="/projects/new">
                  <Plus className="transition-transform duration-300 group-hover/new:rotate-90" />{" "}
                  New project
                </Link>
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="group/std flex-1 sm:flex-none"
                asChild
              >
                <Link href="/standards">
                  <ClipboardCheck className="transition-transform duration-300 group-hover/std:-rotate-6" />{" "}
                  Manage standards
                </Link>
              </Button>
            </Reveal>
          </div>
        </div>

        {/* The procurement workflow, each step with workspace-wide totals (RTA hero KPI band). */}
        <Reveal delay={0.35} immediate>
          <ol
            aria-label="How it works, with your totals"
            className="grid grid-cols-2 border-t border-stage-line lg:grid-cols-4"
          >
            {steps.map((s, i) => (
              <li
                key={s.title}
                className="group relative flex min-w-0 flex-col gap-2 border-stage-line px-5 py-5 transition-colors duration-300 hover:bg-white/[0.04] max-lg:odd:border-e sm:px-6 lg:not-last:border-e max-lg:[&:nth-child(-n+2)]:border-b"
              >
                {/* Hover: the RTA gradient draws along the top edge. */}
                <span
                  aria-hidden
                  className="absolute inset-x-0 -top-px h-0.5 origin-left scale-x-0 bg-rta transition-transform duration-500 ease-out group-hover:scale-x-100 rtl:origin-right"
                />
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 caption-caps text-ink-muted">
                    <span className="text-brand-ink">{i + 1}</span> · {s.title}
                  </span>
                  <span
                    aria-hidden
                    className="hidden shrink-0 text-ink-muted transition duration-300 group-hover:-translate-y-0.5 group-hover:text-brand-ink sm:block [&_svg]:size-4"
                  >
                    {s.icon}
                  </span>
                </div>
                {s.value === undefined ? (
                  <Skeleton className="h-8 w-24" />
                ) : (
                  <p className="flex items-baseline gap-1.5">
                    <span
                      className={cn(
                        "font-heading text-[30px] kpi sm:text-[36px]",
                        s.featured && s.value > 0 ? "text-rta" : "text-ink",
                      )}
                    >
                      <CountUp value={s.value} />
                    </span>
                    <span className="text-sm text-ink-muted">{s.unit(s.value)}</span>
                  </p>
                )}
                {s.detail === undefined ? (
                  <Skeleton className="h-3.5 w-32" />
                ) : (
                  <span className="text-xs text-ink-muted">{s.detail}</span>
                )}
                {i < steps.length - 1 && (
                  <span
                    aria-hidden
                    className="absolute -end-3 top-1/2 z-10 hidden size-6 -translate-y-1/2 place-items-center rounded-full border border-stage-line bg-surface text-ink-muted transition duration-300 group-hover:translate-x-0.5 group-hover:border-brand/50 group-hover:text-brand-ink lg:grid rtl:group-hover:-translate-x-0.5"
                  >
                    <ChevronRight className="size-3.5 rtl:rotate-180" />
                  </span>
                )}
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
