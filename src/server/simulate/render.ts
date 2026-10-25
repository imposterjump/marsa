/**
 * Renders a generated bid as real files (RDD §7.9): the technical proposal as DOCX (docx) and the
 * financial proposal as PDF (HTML printed by headless Chromium via playwright-core, the same way
 * the sample bids are built). Text from the model is escaped before it goes into HTML.
 */
import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from "docx";
import { htmlToPdf } from "../pdf/print";
import { bidTotals, type GeneratedBid } from "./schema";

export interface BidMeta {
  vendorName: string;
  tenderRef: string;
  tenderName: string;
  date: string;
}

const NAVY = "13304D";
const money = (n: number, currency: string) =>
  `${currency} ${Math.round(n).toLocaleString("en-US")}`;

// ─── Technical proposal → DOCX ───────────────────────────────────────────────
function docxTable(head: string[], rows: string[][]) {
  const cell = (text: string, header: boolean) =>
    new TableCell({
      shading: header ? { type: ShadingType.CLEAR, color: "auto", fill: NAVY } : undefined,
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [
        new Paragraph({
          children: [
            new TextRun({ text, size: 18, bold: header, color: header ? "FFFFFF" : "1B2733" }),
          ],
        }),
      ],
    });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: head.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: head.map((_, i) => cell(r[i] ?? "", false)) })),
    ],
  });
}

const para = (text: string, opts: { bold?: boolean; size?: number; color?: string } = {}) =>
  new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text, size: 20, ...opts })] });
const heading = (text: string, size = 26) =>
  new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, size, color: NAVY })],
  });

export async function technicalDocx(bid: GeneratedBid, meta: BidMeta): Promise<Uint8Array> {
  const v = bid.vendor;
  const children = [
    para(v.legalName, { bold: true, size: 28, color: NAVY }),
    para(`${v.address} · ${v.contactName} · ${v.contactEmail}`, { size: 18, color: "5C6774" }),
    heading("Technical proposal (Envelope 1)", 40),
    para(`Tender ${meta.tenderRef} · ${meta.tenderName}`, { size: 18, color: "5C6774" }),
    para(bid.technical.coverLetter),
    para(`${v.signatoryName}, ${v.signatoryTitle} · ${meta.date}`, { size: 18 }),
    ...bid.technical.sections.flatMap((s, i) => [
      heading(`${i + 1}. ${s.title}`),
      ...s.paragraphs.map((t) => para(t)),
      ...(s.tableHead.length ? [docxTable(s.tableHead, s.tableRows)] : []),
    ]),
    ...(bid.technical.compliance.length
      ? [
          heading(`${bid.technical.sections.length + 1}. Compliance table`),
          docxTable(
            ["Ref", "Requirement", "Response", "Offered"],
            bid.technical.compliance.map((c) => [c.ref, c.requirement, c.response, c.offered]),
          ),
        ]
      : []),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 360 },
      children: [
        new TextRun({
          text: "SAMPLE — fictional bid generated for software testing",
          size: 16,
          color: "8A93A0",
        }),
      ],
    }),
  ];
  const doc = new Document({
    creator: v.legalName,
    title: `${meta.vendorName} technical proposal`,
    styles: { default: { document: { run: { font: "Calibri", size: 20 } } } },
    sections: [{ children }],
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}

// ─── Financial proposal → PDF ────────────────────────────────────────────────
const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const CSS = `
  @page { size: A4; margin: 20mm 16mm; }
  body { font-family: "Segoe UI", Arial, Helvetica, sans-serif; color: #1b2733; font-size: 10.2pt; line-height: 1.5; }
  .lh { display: flex; justify-content: space-between; border-bottom: 1.5pt solid #13304d; padding-bottom: 6pt; margin-bottom: 12pt; }
  .lh b { font-size: 13pt; color: #13304d; }
  .small { font-size: 8.5pt; color: #5c6774; }
  h1 { font-size: 20pt; color: #13304d; margin: 0 0 4pt; }
  h2 { font-size: 13pt; color: #13304d; margin: 16pt 0 6pt; padding-bottom: 3pt; border-bottom: 1.2pt solid #0e7c7b; }
  table { width: 100%; border-collapse: collapse; margin: 6pt 0 10pt; font-size: 9.2pt; }
  th { background: #13304d; color: #fff; text-align: left; padding: 4pt 6pt; }
  td { border-bottom: 0.6pt solid #d6d1c6; padding: 4pt 6pt; vertical-align: top; }
  td.num, th.num { text-align: right; white-space: nowrap; }
  tr.total td { font-weight: 700; background: #eef2f6; }
  .sig { margin-top: 18pt; border-top: 0.8pt solid #1b2733; padding-top: 4pt; width: 50%; font-size: 8.5pt; color: #5c6774; }
  .foot { margin-top: 24pt; font-size: 7.5pt; color: #8a93a0; text-align: center; }`;

export function commercialHtml(bid: GeneratedBid, meta: BidMeta): string {
  const c = bid.commercial;
  const v = bid.vendor;
  const t = bidTotals(bid);
  const rows = [
    ...c.lines.map(
      (l, i) =>
        `<tr><td>${i + 1}</td><td>${esc(l.description)}</td><td class="num">${money(l.amount, esc(c.currency))}</td></tr>`,
    ),
    `<tr class="total"><td></td><td>Total one-off price</td><td class="num">${money(t.once, esc(c.currency))}</td></tr>`,
    ...c.recurring.map(
      (l, i) =>
        `<tr><td>R${i + 1}</td><td>${esc(l.description)}</td><td class="num">${money(l.amount, esc(c.currency))}</td></tr>`,
    ),
    ...(c.recurring.length
      ? [
          `<tr class="total"><td></td><td>Total recurring</td><td class="num">${money(t.recurring, esc(c.currency))}</td></tr>`,
        ]
      : []),
    `<tr class="total"><td></td><td>Total bid price</td><td class="num">${money(t.total, esc(c.currency))}</td></tr>`,
  ].join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>${esc(meta.vendorName)} financial proposal</title><style>${CSS}</style></head><body>
<div class="lh"><div><b>${esc(v.legalName)}</b><br><span class="small">${esc(v.address)}</span></div><div class="small" style="text-align:right">${esc(v.contactName)}<br>${esc(v.contactEmail)}</div></div>
<h1>Financial proposal (Envelope 2)</h1>
<p class="small">Tender ${esc(meta.tenderRef)} · ${esc(meta.tenderName)}</p>
<p>${esc(c.coverLetter)}</p>
<h2>Price schedule</h2>
<table><tr><th style="width:8%">Line</th><th>Description</th><th class="num" style="width:24%">Amount</th></tr>${rows}</table>
${c.notes.length ? `<h2>Notes</h2><ol>${c.notes.map((n) => `<li>${esc(n)}</li>`).join("")}</ol>` : ""}
${c.terms.map((x) => `<h2>${esc(x.title)}</h2><p>${esc(x.text)}</p>`).join("")}
<div class="sig">${esc(v.signatoryName)}<br>${esc(v.signatoryTitle)}, ${esc(v.legalName)} · ${esc(meta.date)}</div>
<div class="foot">SAMPLE — fictional bid generated for software testing</div>
</body></html>`;
}

export async function commercialPdf(bid: GeneratedBid, meta: BidMeta): Promise<Uint8Array> {
  return htmlToPdf(commercialHtml(bid, meta));
}
