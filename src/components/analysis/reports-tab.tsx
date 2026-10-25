"use client";

import { useState } from "react";
import { Download, Eye, LoaderCircle, ScrollText, TriangleAlert } from "lucide-react";
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { VerdictPill } from "@/components/ui/status-pill";
import { DocumentReader } from "@/components/viewer/document-reader";
import type {
  AnalysisResultsDto,
  DocumentDto,
  ReportSummaryDto,
  VendorResultDto,
} from "@/lib/api-types";
import { APP_NAME } from "@/lib/brand";
import { VendorLabel } from "./shared";

const card = "rounded-xl border border-border bg-surface shadow-sm";

/**
 * Reports (user, 2026-10-25): one consultant report per vendor, written by the last AI step and
 * laid out by Marsa as a two-page PDF. One row per vendor in rank order: its verdict and one-line
 * conclusion, View (in the app's reader) and Download PDF.
 */
export function ReportsTab({ d, colors }: { d: AnalysisResultsDto; colors: Map<string, string> }) {
  const t = useT();
  const [viewing, setViewing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rows = d.vendors.map((v) => ({
    v,
    r: d.reports.find((x) => x.proposalId === v.proposalId),
  }));
  const open = rows.find((x) => x.v.proposalId === viewing);
  const doc = open?.r ? reportDocument(open.v, open.r, d, t.locale) : null;

  return (
    <section aria-label={t("Reports")} className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <ScrollText className="size-5 text-ink-muted" aria-hidden /> {t("Reports")}
          </h2>
          <span aria-hidden className="rta-rule" />
        </div>
        <span className="text-xs text-ink-muted">
          {t("A consultant report per vendor · AI-generated · PDF, 2 pages")}
        </span>
      </header>
      <ul
        aria-label={t("Vendor reports")}
        className={cn(card, "flex flex-col divide-y divide-border/70")}
      >
        {rows.map(({ v, r }) => (
          <ReportRow
            key={v.proposalId}
            v={v}
            r={r}
            color={colors.get(v.proposalId)}
            onView={() => {
              setPage(1);
              setViewing(v.proposalId);
            }}
          />
        ))}
      </ul>

      <DocumentReader
        open={!!doc}
        onOpenChange={(o) => !o && setViewing(null)}
        title={open?.v.vendor.name ?? ""}
        subtitle={t("{code} · consultant report", { code: d.project.code })}
        groups={doc ? [{ id: "report", label: t("Report"), docs: [doc] }] : []}
        docId={doc?.id ?? null}
        page={page}
        onNavigate={(_, p) => setPage(p)}
      />
    </section>
  );
}

function ReportRow({
  v,
  r,
  color,
  onView,
}: {
  v: VendorResultDto;
  r: ReportSummaryDto | undefined;
  color?: string;
  onView: () => void;
}) {
  const t = useT();
  const ready = r?.status === "done";
  const busy = r?.status === "queued" || r?.status === "running";
  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
      <span
        aria-label={v.scores ? t("Rank {rank}", { rank: v.scores.rank }) : undefined}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-surface-muted text-xs font-semibold text-ink-2 tabular-nums"
      >
        {v.scores?.rank ?? "–"}
      </span>
      <div className="flex min-w-0 flex-1 basis-72 flex-col gap-1.5">
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
          <VendorLabel v={v} color={color} size="md" />
          {ready && r.verdict && <VerdictPill verdict={r.verdict} size="sm" />}
        </span>
        {ready ? (
          <p className="line-clamp-2 text-[13px] text-ink-2" dir="auto">
            {r.headline}
          </p>
        ) : busy ? (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden />{" "}
            {t("Writing the report…")}
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <TriangleAlert className="size-3.5 shrink-0 text-partial" aria-hidden />
            {r?.status === "failed"
              ? r.error
                ? t(
                    "The report could not be written: {error}. Retry it under AI quality → Steps.",
                    {
                      error: t.auto(r.error),
                    },
                  )
                : t("The report could not be written. Retry it under AI quality → Steps.")
              : r?.status === "skipped"
                ? r.error != null
                  ? t("No report: {reason}.", { reason: t.auto(r.error) })
                  : t("No report: the step was skipped.")
                : r?.status === "cancelled"
                  ? t("The report was cancelled with the analysis.")
                  : t("This analysis has no report for this vendor.")}
          </p>
        )}
      </div>
      {ready && (
        <div className="flex shrink-0 items-center gap-3">
          {r.generatedAt && (
            <span className="text-xs text-ink-muted tabular-nums">{t.date(r.generatedAt)}</span>
          )}
          <Button variant="secondary" size="sm" onClick={onView}>
            <Eye aria-hidden /> {t("View")}
          </Button>
          <Button size="sm" asChild>
            <a href={`${r.url}?lang=${t.locale}&download=1`} download>
              <Download aria-hidden /> {t("Download PDF")}
            </a>
          </Button>
        </div>
      )}
    </li>
  );
}

/** The report PDF as the reader expects a document. */
/** The PDF in the screen's language (the run's translation when it has one). */
function reportDocument(
  v: VendorResultDto,
  r: ReportSummaryDto,
  d: AnalysisResultsDto,
  lang: "en" | "ar",
): DocumentDto {
  return {
    id: `report-${v.proposalId}-${lang}`,
    kind: "commercial",
    // A file name, as the download saves it: stays English.
    originalName: `${APP_NAME} report - ${d.project.code} - ${v.vendor.name}.pdf`, // i18n-ignore
    mimeType: "application/pdf",
    ext: "pdf",
    sizeBytes: 0,
    pageCount: 2,
    aiReadable: false,
    createdAt: r.generatedAt ?? d.run.createdAt,
    url: `${r.url}?lang=${lang}`,
  };
}
