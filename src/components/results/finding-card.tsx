"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import {
  ArrowUpRight,
  BookOpen,
  ChevronDown,
  FileText,
  Quote,
  ShieldCheck,
  StickyNote,
} from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { EASE_OUT_QUINT } from "@/components/motion/reveal";
import { FindingStatusPill, PriorityPill } from "@/components/ui/status-pill";
import { StandardRuleChip } from "@/components/standards/rule-sheet";
import type { FindingDto, RequirementDto, RequirementSourceDto } from "@/lib/api-types";
import type { Priority } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";

export type OnEvidence = (docId: string, page: number | null, quote: string) => void;

/** A vendor document as findings cite it: which envelope, which file. */
export interface VendorDocRef {
  id: string;
  name: string;
  envelope: "Technical" | "Commercial";
}

const CONFIDENCE = { high: msg("High"), medium: msg("Medium"), low: msg("Low") } as const;

/**
 * One finding as a compact card (P8): what it breaks (RFP clause in its document, or the standard
 * rule) and where the vendor's proposal says it (document, page, quote) are always visible; the
 * requirement text and the reasoning open with "View details".
 */
export function FindingCard({
  f,
  req,
  code,
  title,
  priority,
  sources,
  sourceLabel,
  vendorDocs,
  onEvidence,
  note,
}: {
  f: FindingDto;
  req?: RequirementDto;
  code: string;
  title: React.ReactNode;
  priority?: Priority;
  sources: RequirementSourceDto[];
  /** Already translated by the caller (default "Breaks"). */
  sourceLabel?: string;
  vendorDocs: VendorDocRef[];
  onEvidence: OnEvidence;
  /** Extra line under the title (e.g. "Also checked by REQ-012"). */
  note?: React.ReactNode;
}) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const id = useId();
  const short = f.status !== "compliant";

  return (
    <li className="rounded-xl border border-border bg-surface shadow-xs transition-shadow hover:shadow-sm">
      <div className="flex flex-col gap-3 p-4">
        <div className="flex flex-wrap items-start gap-x-3 gap-y-2">
          <FindingStatusPill status={f.status} size="sm" />
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <p className="text-sm leading-snug text-ink" dir="auto">
              <span className="me-2 font-mono text-xs text-ink-muted">{code}</span>
              <span className="font-medium">{title}</span>
            </p>
            {note && <p className="text-xs text-ink-muted">{note}</p>}
          </div>
          {priority && <PriorityPill priority={priority} size="sm" />}
        </div>

        <dl className="grid gap-x-4 gap-y-2 text-[13px] sm:grid-cols-[8.5rem_1fr]">
          <dt className="pt-1 text-xs font-semibold text-ink-muted">
            {short ? (sourceLabel ?? t("Breaks")) : t("Requirement")}
          </dt>
          <dd>
            <SourceChips sources={sources} fallback={req?.sourceRef} onOpen={onEvidence} />
          </dd>
          <dt className="pt-1 text-xs font-semibold text-ink-muted">{t("Vendor's proposal")}</dt>
          <dd className="flex min-w-0 flex-col gap-1.5">
            {f.status === "not_addressed" && !f.evidenceQuote ? (
              <span className="pt-1 text-ink-muted italic">
                {t("Not addressed anywhere in the proposal.")}
              </span>
            ) : (
              <>
                <EvidenceChip f={f} vendorDocs={vendorDocs} onEvidence={onEvidence} />
                {f.evidenceQuote ? (
                  <q className="line-clamp-2 text-ink-2 italic" dir="auto">
                    {f.evidenceQuote}
                  </q>
                ) : (
                  <span className="text-ink-2">{f.vendorResponse}</span>
                )}
              </>
            )}
          </dd>
        </dl>

        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="inline-flex w-fit items-center gap-1 rounded-sm text-xs font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring/50"
        >
          {open ? t("Hide details") : short ? t("Why it falls short") : t("View details")}
          <ChevronDown
            aria-hidden
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            animate={reduce ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: EASE_OUT_QUINT }}
            className="overflow-hidden"
          >
            <dl className="grid gap-x-4 gap-y-2.5 border-t border-border/70 bg-surface-muted/40 px-4 py-4 text-[13px] sm:grid-cols-[8.5rem_1fr]">
              <dt className="text-xs font-semibold text-ink-muted">{t("Required")}</dt>
              <dd className="text-ink" dir="auto">
                {req?.description || req?.title || "—"}
              </dd>
              {f.vendorResponse && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">{t("The vendor offers")}</dt>
                  <dd className="text-ink-2" dir="auto">
                    {f.vendorResponse}
                  </dd>
                </>
              )}
              {(f.gap || f.assessment) && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">
                    {f.status === "compliant"
                      ? t("Assessment")
                      : f.status === "partial"
                        ? t("What is missing")
                        : t("Why it falls short")}
                  </dt>
                  <dd className="text-ink-2" dir="auto">
                    {f.status === "compliant" ? f.assessment : f.gap || f.assessment}
                  </dd>
                </>
              )}
              {f.evidenceQuote && (
                <>
                  <dt className="text-xs font-semibold text-ink-muted">{t("Quote")}</dt>
                  <dd className="flex items-start gap-2 text-ink-2">
                    <Quote className="mt-0.5 size-3.5 shrink-0 text-ink-faint" aria-hidden />
                    <q className="italic" dir="auto">
                      {f.evidenceQuote}
                    </q>
                  </dd>
                </>
              )}
              <dt className="text-xs font-semibold text-ink-muted">{t("AI confidence")}</dt>
              <dd className="text-ink-2">
                {t(CONFIDENCE[f.confidence])}
                {f.aiStatus !== f.status && ` · ${t("status changed by a reviewer")}`}
              </dd>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
}

/** Where the vendor's proposal says it: envelope, file and page, opening the reader at the quote. */
export function EvidenceChip({
  f,
  vendorDocs,
  onEvidence,
}: {
  f: FindingDto;
  vendorDocs: VendorDocRef[];
  onEvidence: OnEvidence;
}) {
  const t = useT();
  if (!f.evidenceDocId) return null;
  const doc = vendorDocs.find((d) => d.id === f.evidenceDocId);
  return (
    <button
      type="button"
      onClick={() => onEvidence(f.evidenceDocId!, f.evidencePage, f.evidenceQuote ?? "")}
      className="inline-flex w-fit max-w-full items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-2 transition-colors outline-none hover:border-brand/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50"
      title={t("Open the proposal at this sentence")}
    >
      <BookOpen className="size-3.5 shrink-0 text-brand" aria-hidden />
      <span className="font-medium">{doc ? t(doc.envelope) : t("Proposal")}</span>
      <span className="truncate text-ink-muted" dir="auto">
        {doc?.name ?? t("document")}
      </span>
      {f.evidencePage && (
        <span className="shrink-0 tabular-nums">{t("p. {page}", { page: f.evidencePage })}</span>
      )}
      {!f.evidencePage && f.evidenceSection && (
        <span className="max-w-40 shrink-0 truncate">§ {f.evidenceSection}</span>
      )}
      <ArrowUpRight className="size-3 shrink-0 text-ink-faint rtl:-scale-x-100" aria-hidden />
    </button>
  );
}

/**
 * Where a requirement comes from, as links: an RFP clause opens its RFP document in the reader on
 * the page with the clause highlighted; a standard rule opens the standard with the rule
 * highlighted. The document name is always shown, so it is clear which file was broken.
 */
export function SourceChips({
  sources,
  fallback,
  onOpen,
}: {
  sources: RequirementSourceDto[];
  fallback?: string;
  onOpen: OnEvidence;
}) {
  const t = useT();
  const chip =
    "inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-surface px-2 py-1 text-xs text-ink-2";
  const link =
    "transition-colors outline-none hover:border-brand/50 hover:text-ink focus-visible:ring-2 focus-visible:ring-ring/50";
  if (!sources.length) {
    return fallback ? (
      <span className={chip}>{fallback}</span>
    ) : (
      <span className="text-ink-faint">—</span>
    );
  }
  return (
    <span className="flex flex-wrap gap-1.5">
      {sources.map((s, i) => {
        if (s.kind === "standard") {
          return (
            <StandardRuleChip key={i} source={s} className={cn(chip, link)}>
              <ShieldCheck className="size-3.5 text-info" aria-hidden />
              <span className="font-mono">{s.label}</span>
              <ArrowUpRight className="size-3 text-ink-faint rtl:-scale-x-100" aria-hidden />
            </StandardRuleChip>
          );
        }
        if (s.kind === "notes") {
          return (
            <span key={i} className={chip}>
              <StickyNote className="size-3.5 text-ink-faint" aria-hidden /> {s.label}
            </span>
          );
        }
        if (!s.documentId) {
          return (
            <span key={i} className={chip} title={t("Not found in the RFP documents")}>
              <FileText className="size-3.5 text-ink-faint" aria-hidden /> {s.label}
            </span>
          );
        }
        return (
          <button
            key={i}
            type="button"
            onClick={() => onOpen(s.documentId!, s.page, s.needle ?? "")}
            className={cn(chip, link)}
            title={
              s.page
                ? t("Open {document}, page {page}", {
                    document: s.documentName ?? "",
                    page: s.page,
                  })
                : t("Open {document}", { document: s.documentName ?? "" })
            }
          >
            <FileText className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="truncate">{s.label}</span>
            <span className="max-w-48 truncate text-ink-muted" dir="auto">
              {s.documentName}
            </span>
            {s.page && (
              <span className="shrink-0 text-ink-muted tabular-nums">
                {t("p. {page}", { page: s.page })}
              </span>
            )}
            <ArrowUpRight className="size-3 shrink-0 text-ink-faint rtl:-scale-x-100" aria-hidden />
          </button>
        );
      })}
    </span>
  );
}
