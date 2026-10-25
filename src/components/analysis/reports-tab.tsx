"use client";

import { useState } from "react";
import { Download, Eye, LoaderCircle, ScrollText, TriangleAlert } from "lucide-react";
import { cn } from "cn";
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
  const [viewing, setViewing] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const rows = d.vendors.map((v) => ({
    v,
    r: d.reports.find((x) => x.proposalId === v.proposalId),
  }));
  const open = rows.find((x) => x.v.proposalId === viewing);
  const doc = open?.r ? reportDocument(open.v, open.r, d) : null;

  return (
    <section aria-label="Reports" className="flex flex-col gap-4">
      <header className="flex flex-wrap items-end justify-between gap-2">
        <div className="flex flex-col gap-1">
          <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-ink">
            <ScrollText className="size-5 text-ink-muted" aria-hidden /> Reports
          </h2>
          <span aria-hidden className="rta-rule" />
        </div>
        <span className="text-xs text-ink-muted">
          A consultant report per vendor · AI-generated · PDF, 2 pages
        </span>
      </header>
      <ul
        aria-label="Vendor reports"
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
        subtitle={`${d.project.code} · consultant report`}
        groups={doc ? [{ id: "report", label: "Report", docs: [doc] }] : []}
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
  const ready = r?.status === "done";
  const busy = r?.status === "queued" || r?.status === "running";
  return (
    <li className="flex flex-wrap items-center gap-x-5 gap-y-3 px-5 py-4">
      <span
        aria-label={v.scores ? `Rank ${v.scores.rank}` : undefined}
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
            <LoaderCircle className="size-3.5 animate-spin" aria-hidden /> Writing the report…
          </p>
        ) : (
          <p className="flex items-center gap-1.5 text-[13px] text-ink-muted">
            <TriangleAlert className="size-3.5 shrink-0 text-partial" aria-hidden />
            {r?.status === "failed"
              ? `The report could not be written${r.error ? `: ${r.error}` : ""}. Retry it under AI quality → Steps.`
              : r?.status === "skipped"
                ? `No report: ${r.error ?? "the step was skipped"}.`
                : r?.status === "cancelled"
                  ? "The report was cancelled with the analysis."
                  : "This analysis has no report for this vendor."}
          </p>
        )}
      </div>
      {ready && (
        <div className="flex shrink-0 items-center gap-3">
          {r.generatedAt && (
            <span className="text-xs text-ink-muted tabular-nums">
              {new Date(r.generatedAt).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={onView}>
            <Eye aria-hidden /> View
          </Button>
          <Button size="sm" asChild>
            <a href={`${r.url}?download=1`} download>
              <Download aria-hidden /> Download PDF
            </a>
          </Button>
        </div>
      )}
    </li>
  );
}

/** The report PDF as the reader expects a document. */
function reportDocument(
  v: VendorResultDto,
  r: ReportSummaryDto,
  d: AnalysisResultsDto,
): DocumentDto {
  return {
    id: `report-${v.proposalId}`,
    kind: "commercial",
    originalName: `${APP_NAME} report - ${d.project.code} - ${v.vendor.name}.pdf`,
    mimeType: "application/pdf",
    ext: "pdf",
    sizeBytes: 0,
    pageCount: 2,
    aiReadable: false,
    createdAt: r.generatedAt ?? d.run.createdAt,
    url: r.url,
  };
}
