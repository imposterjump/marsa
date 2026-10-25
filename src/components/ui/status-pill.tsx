import {
  Archive,
  BadgeCheck,
  CircleCheck,
  CircleMinus,
  CircleX,
  Contrast,
  Loader2,
  Megaphone,
  PencilLine,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  Shield,
  type LucideIcon,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import type {
  FindingStatus,
  Priority,
  ProjectStatus,
  ReportVerdict,
  RiskSeverity,
} from "@/lib/domain";
import {
  FINDING_STATUS_LABEL,
  PRIORITY_LABEL,
  PROJECT_STATUS_LABEL,
  REPORT_VERDICT_LABEL,
  RISK_SEVERITY_LABEL,
} from "@/lib/labels";

type Tone =
  | "ok"
  | "partial"
  | "fail"
  | "missing"
  | "info"
  | "brand"
  | "neutral"
  | "ink"
  | "risk-low"
  | "risk-moderate"
  | "risk-high"
  | "risk-critical";

const TONE: Record<Tone, string> = {
  ok: "bg-ok-soft text-ok",
  partial: "bg-partial-soft text-partial",
  fail: "bg-fail-soft text-fail",
  missing: "bg-missing-soft text-missing",
  info: "bg-info-soft text-info",
  brand: "bg-brand-soft text-brand-ink",
  neutral: "bg-surface-muted text-ink-2",
  /** Strong but not alarming: dark ink, used for "Mandatory". */
  ink: "bg-ink text-surface",
  "risk-low": "bg-risk-low-soft text-risk-low",
  "risk-moderate": "bg-risk-moderate-soft text-risk-moderate",
  "risk-high": "bg-risk-high-soft text-risk-high",
  "risk-critical": "bg-risk-critical-soft text-risk-critical",
};

interface PillProps {
  tone: Tone;
  icon?: LucideIcon;
  children: React.ReactNode;
  size?: "sm" | "md";
  className?: string;
  /** Spin the icon (e.g. "Evaluating"). */
  spin?: boolean;
}

/** Status is never colour-only: every pill carries an icon and a text label (WCAG 1.4.1). */
export function Pill({ tone, icon: Icon, children, size = "md", className, spin }: PillProps) {
  return (
    <span
      data-slot="status-pill"
      className={cn(
        "inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full font-medium whitespace-nowrap",
        size === "md" ? "h-6 ps-2 pe-2.5 text-xs" : "h-5 ps-1.5 pe-2 text-2xs",
        TONE[tone],
        className,
      )}
    >
      {Icon && (
        <Icon
          aria-hidden
          className={cn(size === "md" ? "size-3.5" : "size-3", spin && "animate-spin")}
          strokeWidth={2.25}
        />
      )}
      {children}
    </span>
  );
}

const FINDING: Record<FindingStatus, { tone: Tone; icon: LucideIcon }> = {
  compliant: { tone: "ok", icon: CircleCheck },
  partial: { tone: "partial", icon: Contrast },
  non_compliant: { tone: "fail", icon: CircleX },
  not_addressed: { tone: "missing", icon: CircleMinus },
};

export function FindingStatusPill({
  status,
  size,
  label,
}: {
  status: FindingStatus;
  size?: "sm" | "md";
  label?: string;
}) {
  const t = useT();
  const s = FINDING[status];
  return (
    <Pill tone={s.tone} icon={s.icon} size={size}>
      {label ?? t(FINDING_STATUS_LABEL[status])}
    </Pill>
  );
}

const RISK: Record<RiskSeverity, { tone: Tone; icon: LucideIcon }> = {
  low: { tone: "risk-low", icon: ShieldCheck },
  moderate: { tone: "risk-moderate", icon: Shield },
  high: { tone: "risk-high", icon: ShieldAlert },
  critical: { tone: "risk-critical", icon: ShieldX },
};

export function RiskPill({ severity, size }: { severity: RiskSeverity; size?: "sm" | "md" }) {
  const t = useT();
  const s = RISK[severity];
  return (
    <Pill tone={s.tone} icon={s.icon} size={size}>
      {t(RISK_SEVERITY_LABEL[severity])}
    </Pill>
  );
}

const VERDICT: Record<ReportVerdict, { tone: Tone; icon: LucideIcon }> = {
  preferred_bidder: { tone: "ok", icon: BadgeCheck },
  acceptable_with_conditions: { tone: "partial", icon: Contrast },
  not_recommended: { tone: "fail", icon: CircleX },
};

/** The consultant report's verdict on a vendor. */
export function VerdictPill({ verdict, size }: { verdict: ReportVerdict; size?: "sm" | "md" }) {
  const t = useT();
  const v = VERDICT[verdict];
  return (
    <Pill tone={v.tone} icon={v.icon} size={size}>
      {t(REPORT_VERDICT_LABEL[verdict])}
    </Pill>
  );
}

const PROJECT: Record<ProjectStatus, { tone: Tone; icon: LucideIcon; spin?: boolean }> = {
  draft: { tone: "neutral", icon: PencilLine },
  open: { tone: "info", icon: Megaphone },
  evaluating: { tone: "brand", icon: Loader2, spin: true },
  evaluated: { tone: "ok", icon: BadgeCheck },
  archived: { tone: "neutral", icon: Archive },
};

export function ProjectStatusPill({ status, size }: { status: ProjectStatus; size?: "sm" | "md" }) {
  const t = useT();
  const s = PROJECT[status];
  return (
    <Pill tone={s.tone} icon={s.icon} size={size} spin={s.spin}>
      {t(PROJECT_STATUS_LABEL[status])}
    </Pill>
  );
}

const PRIORITY: Record<Priority, { tone: Tone; label: string; short: string }> = {
  mandatory: { tone: "ink", label: PRIORITY_LABEL.mandatory, short: "M" },
  important: { tone: "info", label: PRIORITY_LABEL.important, short: "I" },
  desirable: { tone: "neutral", label: PRIORITY_LABEL.desirable, short: "D" },
};

/** Requirement priority. Deliberately not red/amber/green so it never reads as a compliance status. */
export function PriorityPill({
  priority,
  size,
  short,
}: {
  priority: Priority;
  size?: "sm" | "md";
  short?: boolean;
}) {
  const t = useT();
  const p = PRIORITY[priority];
  // Arabic has no one-letter abbreviations: the short pill shows the (short) word.
  const letter = short && t.locale === "en";
  return (
    <Pill
      tone={p.tone}
      size={size}
      className={letter ? "min-w-6 justify-center px-1.5" : undefined}
    >
      <span aria-hidden={letter || undefined}>{letter ? p.short : t(p.label)}</span>
      {letter && <span className="sr-only">{t(p.label)}</span>}
    </Pill>
  );
}
