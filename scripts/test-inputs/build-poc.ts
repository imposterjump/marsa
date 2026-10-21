/**
 * Builds the POC inputs into test-inputs/poc-inputs/ (user request, 2026-10-21): two small,
 * complete tenders to show the workflow in a meeting. Set 1 is for rehearsing, set 2 for the
 * meeting itself. Each set has the standard's rules as a paste block, the RFP PDF, and two
 * vendors with a technical and a commercial PDF.
 *
 *   npx tsx scripts/test-inputs/build-poc.ts
 */
import fs from "node:fs";
import path from "node:path";
import { ESEALS_BIDS, ESEALS_STANDARD, ESEALS_TENDER } from "./content/poc-eseals";
import { GATES_BIDS, GATES_STANDARD, GATES_TENDER } from "./content/poc-gates";
import {
  bidTotals,
  commercialHtml,
  rfpHtml,
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
];

const fileRef = (ref: string) => ref.replace(/\//g, "-");

async function main() {
  for (const s of SETS) {
    const out = path.join(ROOT, s.dir);
    fs.mkdirSync(out, { recursive: true });
    fs.writeFileSync(
      path.join(out, `Standard-${s.standard.code}-rules.txt`),
      `${rulesText(s.standard)}\n`,
    );
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
