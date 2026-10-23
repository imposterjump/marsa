/**
 * Builds the POC inputs into test-inputs/poc-inputs/ (user request, 2026-10-21): small, complete
 * tenders to show the workflow in a meeting. Set 1 is for rehearsing, set 2 for the meeting
 * itself, sets 3 and 4 (2026-10-23) have three vendors. Each set has the standard's rules as a
 * file to drop (Excel, CSV and text), the RFP PDF, and vendors with a technical and a commercial
 * PDF that follow the 7-section proposal template (P8).
 *
 *   npx tsx scripts/test-inputs/build-poc.ts
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import { AIRQ_BIDS, AIRQ_STANDARD, AIRQ_TENDER } from "./content/poc-airq";
import { ESEALS_BIDS, ESEALS_STANDARD, ESEALS_TENDER } from "./content/poc-eseals";
import { GATES_BIDS, GATES_STANDARD, GATES_TENDER } from "./content/poc-gates";
import { LIMS_BIDS, LIMS_STANDARD, LIMS_TENDER } from "./content/poc-lims";
import {
  bidTotals,
  commercialHtml,
  rfpHtml,
  rulesCsv,
  rulesText,
  technicalHtml,
  usd,
  type PocBid,
  type PocStandard,
  type PocTender,
} from "./content/poc-render";
import { closeBrowser, htmlToPdf } from "./lib/pdf";

const ROOT = path.join(process.cwd(), "test-inputs", "poc-inputs");

const SETS: { dir: string; standard: PocStandard; tender: PocTender; bids: PocBid[] }[] = [
  {
    dir: "1-rehearsal-smart-gates",
    standard: GATES_STANDARD,
    tender: GATES_TENDER,
    bids: GATES_BIDS,
  },
  {
    dir: "2-meeting-e-seals",
    standard: ESEALS_STANDARD,
    tender: ESEALS_TENDER,
    bids: ESEALS_BIDS,
  },
  {
    dir: "3-three-vendors-air-quality",
    standard: AIRQ_STANDARD,
    tender: AIRQ_TENDER,
    bids: AIRQ_BIDS,
  },
  {
    dir: "4-three-vendors-customs-lab",
    standard: LIMS_STANDARD,
    tender: LIMS_TENDER,
    bids: LIMS_BIDS,
  },
];

const fileRef = (ref: string) => ref.replace(/\//g, "-");

/** The rules as an Excel sheet: Code | Rule | Priority, as a standards team would keep them. */
async function writeRulesXlsx(s: PocStandard, file: string) {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(s.code);
  ws.columns = [
    { header: "Code", key: "code", width: 10 },
    { header: "Rule", key: "text", width: 100 },
    { header: "Priority", key: "priority", width: 12 },
  ];
  ws.getRow(1).font = { bold: true };
  for (const [code, text, priority] of s.rules) ws.addRow({ code, text, priority });
  ws.getColumn("text").alignment = { wrapText: true, vertical: "top" };
  await wb.xlsx.writeFile(file);
}

async function main() {
  for (const s of SETS) {
    const out = path.join(ROOT, s.dir);
    fs.mkdirSync(out, { recursive: true });
    const rulesBase = path.join(out, `Standard-${s.standard.code}-rules`);
    fs.writeFileSync(`${rulesBase}.txt`, `${rulesText(s.standard)}\n`);
    fs.writeFileSync(`${rulesBase}.csv`, `﻿${rulesCsv(s.standard)}\r\n`);
    await writeRulesXlsx(s.standard, `${rulesBase}.xlsx`);
    await htmlToPdf(rfpHtml(s.tender), path.join(out, `RFP-${fileRef(s.tender.ref)}.pdf`), {
      headerLeft: `${s.tender.ref} · Request for Proposal`,
      headerRight: s.tender.issuer,
      footerLeft:
        "SAMPLE — fictional tender created for a software demonstration. Not a real procurement.",
    });
    for (const [i, b] of s.bids.entries()) {
      const footerLeft = `${b.name} · Proposal for ${s.tender.ref} · SAMPLE — fictional bid created for a software demonstration`;
      const base = path.join(out, `Vendor-${i + 1}-${b.slug}`);
      await htmlToPdf(technicalHtml(s.tender, b), `${base}-Technical.pdf`, {
        headerLeft: `${s.tender.ref} · Technical Proposal (Envelope 1)`,
        headerRight: b.legalName,
        footerLeft,
      });
      await htmlToPdf(commercialHtml(s.tender, b), `${base}-Commercial.pdf`, {
        headerLeft: `${s.tender.ref} · Commercial Proposal (Envelope 2)`,
        headerRight: b.legalName,
        footerLeft,
      });
      const t = bidTotals(b);
      console.log(
        `✔ ${s.dir} · ${b.name}: ${usd(t.supply)} + ${usd(t.recurring)} = ${usd(t.total)}`,
      );
    }
  }
  await closeBrowser();
}

main().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
