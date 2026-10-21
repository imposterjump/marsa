/**
 * Builds the Phase 1 test inputs into test-inputs/phase-1/.
 *   npx tsx scripts/test-inputs/build-phase-1.ts
 * Re-runnable; overwrites previous output. The 55 MB file is gitignored (regenerated here).
 */
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { buildAnnexB } from "./content/annex-b";
import { buildAnnexC } from "./content/annex-c";
import { addendumHtml, sitePlanHtml } from "./content/addendum";
import {
  arabicSummaryHtml,
  BULK_QUESTIONS,
  LEGACY_RTF,
  scannedLetterHtml,
} from "./content/edge-cases";
import { rfpHtml, TENDER } from "./content/rfp";
import { closeBrowser, htmlToPdf, htmlToPng } from "./lib/pdf";

const OUT = path.join(process.cwd(), "test-inputs", "phase-1");
const PACK = path.join(OUT, "rfp-pack");
const EDGE = path.join(OUT, "edge-cases");
const BULK = path.join(OUT, "bulk-21-files");

const header = {
  headerLeft: `${TENDER.ref} · Request for Proposal`,
  headerRight: TENDER.authority,
};

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  [PACK, EDGE, BULK].forEach((d) => fs.mkdirSync(d, { recursive: true }));

  console.log("RFP pack");
  await htmlToPdf(rfpHtml(), path.join(PACK, "01-RFP-NGPA-T-2026-014.pdf"), header);
  console.log("  ✔ 01 RFP main document (PDF)");
  await htmlToPng(
    sitePlanHtml(),
    path.join(PACK, "02-Annex-A-2-T2-Site-Plan.png"),
    { width: 1600, height: 1000 },
    1.5,
  );
  console.log("  ✔ 02 Annex A-2 site plan (PNG)");
  const b = await buildAnnexB(path.join(PACK, "03-Annex-B-Technical-Specifications.xlsx"));
  console.log(
    `  ✔ 03 Annex B (XLSX) · min usable storage = ${b.minUsableTb} TB from ${b.totalScans.toLocaleString()} scans/yr`,
  );
  await buildAnnexC(path.join(PACK, "04-Annex-C-Draft-Contract.docx"));
  console.log("  ✔ 04 Annex C draft contract (DOCX)");
  await htmlToPdf(addendumHtml(), path.join(PACK, "05-Addendum-No-1.pdf"), {
    ...header,
    headerLeft: `${TENDER.ref} · Addendum No. 1`,
  });
  console.log("  ✔ 05 Addendum No. 1 (PDF)");

  console.log("Edge cases");
  await htmlToPdf(arabicSummaryHtml(), path.join(EDGE, "عرض-فني-مختصر.pdf"), {
    ...header,
    headerLeft: `${TENDER.ref} · ملخص العرض الفني`,
  });
  console.log("  ✔ Arabic file name + bilingual content (PDF)");
  await htmlToPng(
    scannedLetterHtml(),
    path.join(EDGE, "scanned-clarification-letter.png"),
    { width: 900, height: 1180 },
    1.4,
  );
  console.log("  ✔ scanned letter (image only, no text layer)");
  fs.copyFileSync(
    path.join(PACK, "03-Annex-B-Technical-Specifications.xlsx"),
    path.join(
      EDGE,
      "NGPA-T-2026-014_Annex-B_Technical-Specifications_Compliance-Matrix_FINAL_v3_signed_stamped_ISSUED-FOR-TENDER.xlsx",
    ),
  );
  console.log("  ✔ very long file name (XLSX copy)");
  fs.writeFileSync(path.join(EDGE, "Legacy-Technical-Note.doc"), LEGACY_RTF);
  console.log("  ✔ legacy .doc");
  fs.writeFileSync(
    path.join(EDGE, "blocked-setup.exe"),
    "This is NOT a program. Plain text used to test that .exe uploads are blocked.\n",
  );
  console.log("  ✔ blocked .exe (plain text, harmless)");
  fs.writeFileSync(path.join(EDGE, "empty-file.txt"), "");
  console.log("  ✔ empty file (0 bytes)");
  // 55 MB: valid PDF header + random padding (gitignored; > the 50 MB per-file limit).
  const big = path.join(EDGE, "oversized-55MB.pdf");
  const fd = fs.openSync(big, "w");
  fs.writeSync(fd, "%PDF-1.7\n% Oversized test file for upload validation (SAMPLE)\n");
  const chunk = crypto.randomBytes(1024 * 1024);
  for (let i = 0; i < 55; i++) fs.writeSync(fd, chunk);
  fs.closeSync(fd);
  console.log("  ✔ oversized 55 MB file");

  console.log("Bulk (21 files)");
  BULK_QUESTIONS.forEach((q, i) => {
    const n = String(i + 1).padStart(2, "0");
    fs.writeFileSync(
      path.join(BULK, `Bidder-question-${n}.txt`),
      `Tender ${TENDER.ref} — clarification question ${n} (SAMPLE)\n\n${q}\n`,
    );
  });
  console.log(`  ✔ ${BULK_QUESTIONS.length} text files`);

  await closeBrowser();
  console.log(`\nDone → ${OUT}`);
})().catch(async (err) => {
  console.error(err);
  await closeBrowser();
  process.exit(1);
});
