/**
 * A fictional building works tender in the e-procurement portal's export layout (2026-10-25), to
 * test Projects → Import tender and the price comparison without the company's real files (those
 * stay out of git). Three fictional contractors; their bids are one zip, as the portal exports:
 *   - Al Wadi: complete and clean, mid price.
 *   - Al Reem: cheapest, but 2 unpriced lines, a changed quantity and no bid bond.
 *   - Coastline: most expensive, one line where quantity × rate ≠ amount, an added line, and the
 *     same licence uploaded twice.
 * The estimate (AED 310,000) is in the internal approval. Nothing here hints at a winner.
 *
 *   npx tsx scripts/test-inputs/build-works-tender.ts
 */
import fs from "node:fs";
import path from "node:path";
import ExcelJS from "exceljs";
import JSZip from "jszip";
import { closeBrowser, htmlToPdf } from "./lib/pdf";

const OUT = path.join(process.cwd(), "test-inputs", "works-tender");
const TENDER = "مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية";
const ROOT = path.join(OUT, TENDER);

interface Line {
  section: string;
  description: string;
  qty: number;
  unit: string;
}

const LINES: Line[] = [
  {
    section: "Demolition Works",
    description: "Demolition of existing wall tiles and disposal of debris off site.",
    qty: 220,
    unit: "sqm",
  },
  {
    section: "Demolition Works",
    description: "Removal of existing washroom fixtures (WC, wash basin, accessories).",
    qty: 6,
    unit: "item",
  },
  {
    section: "Demolition Works",
    description: "Demolition of existing false ceiling in the customer hall.",
    qty: 140,
    unit: "sqm",
  },
  {
    section: "Finishing Works",
    description: "Supply and fixing of 60x60 cm porcelain floor tiles with adhesive and grout.",
    qty: 310,
    unit: "sqm",
  },
  {
    section: "Finishing Works",
    description: "Supply and fixing of 1200x600 mm porcelain wall tiles in washrooms.",
    qty: 180,
    unit: "sqm",
  },
  {
    section: "Finishing Works",
    description: "Supply and application of cementitious waterproofing in wet areas.",
    qty: 95,
    unit: "sqm",
  },
  {
    section: "Finishing Works",
    description: "Supply and installation of moisture-resistant gypsum false ceiling.",
    qty: 140,
    unit: "sqm",
  },
  {
    section: "Finishing Works",
    description: "Two coats of emulsion paint on internal walls after one coat of primer.",
    qty: 860,
    unit: "sqm",
  },
  {
    section: "Doors & Joinery",
    description: "Supply and installation of solid wood doors 90x220 cm with ironmongery.",
    qty: 8,
    unit: "no",
  },
  {
    section: "Doors & Joinery",
    description: "Supply and installation of washroom vanity counters with quartz top.",
    qty: 4,
    unit: "no",
  },
  {
    section: "MEP Works",
    description: "Supply and installation of wall-hung WC with concealed cistern.",
    qty: 6,
    unit: "no",
  },
  {
    section: "MEP Works",
    description: "Supply and installation of LED panel lights 60x60 cm, 40 W.",
    qty: 48,
    unit: "no",
  },
  {
    section: "MEP Works",
    description: "Replacement of split air-conditioning units 2 tons, including piping.",
    qty: 5,
    unit: "no",
  },
  {
    section: "MEP Works",
    description: "Cleaning of air ducts and grilles of the ground and first floors.",
    qty: 1,
    unit: "LS",
  },
];

interface Bid {
  folder: string;
  name: string;
  rates: (number | null)[];
  qty?: Record<number, number>;
  amountOverride?: Record<number, number>;
  extra?: { description: string; qty: number; unit: string; rate: number };
  bond: boolean;
  duplicateLicence?: boolean;
  days: number;
}

const BIDS: Bid[] = [
  {
    folder: "Al_Wadi_Building_Co-310522",
    name: "Al Wadi Building Contracting LLC",
    rates: [38, 950, 42, 165, 175, 85, 120, 18, 2850, 4200, 3600, 380, 7400, 26000],
    bond: true,
    days: 85,
  },
  {
    folder: "الريم_للمقاولات_العام-288417",
    name: "شركة الريم للمقاولات العامة ذ.م.م",
    rates: [30, 700, 35, 140, 150, null, 98, 14, 2400, null, 3100, 320, 6900, 21000],
    qty: { 7: 760 },
    bond: false,
    days: 90,
  },
  {
    folder: "Coastline_Engineerin-405119",
    name: "Coastline Engineering & Maintenance LLC",
    rates: [55, 1400, 60, 230, 240, 120, 165, 26, 3900, 5600, 4800, 520, 9800, 38000],
    amountOverride: { 4: 432000 }, // 180 × 240 = 43,200 written as 432,000
    extra: {
      description: "Temporary site office and storage for the duration of the works.",
      qty: 1,
      unit: "LS",
      rate: 18000,
    },
    bond: true,
    duplicateLicence: true,
    days: 75,
  },
];

const css = `body{font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#1b2533;margin:0}
h1{font-size:17px;margin:0 0 8px}h2{font-size:13px;margin:14px 0 6px}table{width:100%;border-collapse:collapse;margin-top:6px}
th,td{border:1px solid #9aa5b1;padding:4px 6px;text-align:start;vertical-align:top}th{background:#eef1f5}.num{text-align:end}p{line-height:1.6}`;
const page = (body: string, rtl = true) =>
  `<!doctype html><html lang="${rtl ? "ar" : "en"}" dir="${rtl ? "rtl" : "ltr"}"><head><meta charset="utf-8"><style>${css}</style></head><body>${body}</body></html>`;
const fmt = (n: number) => n.toLocaleString("en-US", { maximumFractionDigits: 2 });
const pdfOpts = { headerLeft: "دائرة الأشغال العامة (تجريبي)", headerRight: TENDER };

async function boqWorkbook(bid: Bid | null): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("BOQ");
  ws.addRow([TENDER]);
  ws.addRow(["Bill Of Quantity ( جدول الكميات )"]);
  ws.addRow(["S.No.", "Description", "Qty.", "Unit", "Unit Price", "Amount"]);
  let section = "";
  let no = 0;
  let total = 0;
  LINES.forEach((l, i) => {
    if (l.section !== section) {
      section = l.section;
      no = 0;
      ws.addRow(["", section]);
    }
    no++;
    const qty = bid?.qty?.[i] ?? l.qty;
    const rate = bid ? bid.rates[i] : null;
    const amount =
      rate === null ? null : (bid?.amountOverride?.[i] ?? Math.round(rate * qty * 100) / 100);
    if (amount !== null) total += amount;
    ws.addRow([no, l.description, qty, l.unit, rate ?? "", amount ?? ""]);
  });
  if (bid?.extra) {
    ws.addRow(["", "Additional items proposed by the bidder"]);
    const amount = bid.extra.rate * bid.extra.qty;
    total += amount;
    ws.addRow([1, bid.extra.description, bid.extra.qty, bid.extra.unit, bid.extra.rate, amount]);
  }
  if (bid) {
    ws.addRow(["", "Total Amount (AED)", "", "", "", total]);
    ws.addRow(["", "VAT (5%)", "", "", "", Math.round(total * 5) / 100]);
    ws.addRow(["", "Total Amount with VAT (AED)", "", "", "", Math.round(total * 105) / 100]);
  } else {
    ws.addRow(["", "Total Amount (AED)"]);
    ws.addRow(["", "VAT (5%)"]);
    ws.addRow(["", "Total Amount with VAT (AED)"]);
  }
  ws.addRow(["", "NOTE: PROJECT DURATION (90 DAYS)"]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

function boqHtml(bid: Bid | null): string {
  const rows = LINES.map((l, i) => {
    const qty = bid?.qty?.[i] ?? l.qty;
    const rate = bid ? bid.rates[i] : null;
    const amount = rate === null ? null : (bid?.amountOverride?.[i] ?? rate * qty);
    return `<tr><td>${i + 1}</td><td>${l.description}</td><td class="num">${qty}</td><td>${l.unit}</td><td class="num">${rate === null ? "" : fmt(rate)}</td><td class="num">${amount === null ? "" : fmt(amount)}</td></tr>`;
  }).join("");
  return page(
    `<h1>جدول الكميات — ${TENDER}</h1>${bid ? `<p>مقدّم العطاء: ${bid.name}</p>` : ""}<table dir="ltr"><tr><th>S.No.</th><th>Description</th><th>Qty.</th><th>Unit</th><th>Unit Price</th><th>Amount</th></tr>${rows}</table>${bid ? "<p>الختم والتوقيع: ____________</p>" : ""}`,
  );
}

const declarationHtml = page(`<h1>إقرار بمستندات العطاء</h1>
<p>رقم المناقصة: WT-2026-017 &nbsp; عنوان المناقصة: ${TENDER}</p>
<h2>أولاً: مستندات العطاء الأساسية</h2>
<table><tr><th>م</th><th>المستند</th><th>الغرض من المستند</th><th>التقديم</th></tr>
<tr><td>1</td><td>جدول الكميات</td><td>لتسعير كافة البنود والختم والتوقيع على جميع الصفحات</td><td>إلزامي</td></tr>
<tr><td>2</td><td>إقرار بمستندات العطاء</td><td>للتأكيد على استلام المستندات بالختم والتوقيع</td><td>إلزامي</td></tr>
<tr><td>3</td><td>التأمين الابتدائي للعطاء</td><td>ضمان بنكي أصلي بنسبة 5% من قيمة العطاء من أحد البنوك المعتمدة بالدولة</td><td>إلزامي</td></tr>
<tr><td>4</td><td>رخصة تجارية سارية المفعول</td><td>لإثبات أهلية الشركة</td><td>إلزامي</td></tr>
<tr><td>5</td><td>البرنامج الزمني</td><td>إنجاز الأعمال خلال مدة المشروع (90 يوماً)</td><td>إلزامي</td></tr></table>
<p>أقر أنا الموقع أدناه بأنني استلمت واطلعت على كافة المستندات المذكورة أعلاه، وأنني قمت بزيارة الموقع وأخذت ذلك بالاعتبار ضمن العطاء المقدم.</p>`);

const approvalHtml = page(`<h1>استمارة توجيه — الاعتماد المالي</h1>
<p>المرجع: ت/2026/4410 &nbsp; التاريخ: 2026/09/14</p>
<p>استكمالاً لأعمال الصيانة المطلوبة في مبنى مركز خدمات المتعاملين، قام فريق العمل بحصر البنود ودراسة وحدات الأسعار، وتبين أن التكلفة التقديرية للأعمال كالتالي:</p>
<table><tr><th>البند</th><th>التكلفة التقديرية</th></tr><tr><td>أعمال الصيانة والتشطيبات (المرحلة الأولى)</td><td>310,000 درهم</td></tr></table>
<p>الاعتماد المالي: 310,000 درهم</p>`);

const licenceHtml = (b: Bid) =>
  page(
    `<h1>رخصة تجارية</h1><p>اسم الشركة: ${b.name}</p><p>النشاط: مقاولات المباني وأعمال الصيانة العامة</p><p>تاريخ الانتهاء: 31/12/2027</p>`,
  );
const bondHtml = (b: Bid, total: number) =>
  page(
    `<h1>خطاب ضمان بنكي — التأمين الابتدائي للعطاء</h1><p>المستفيد: دائرة الأشغال العامة (تجريبي)</p><p>نضمن نحن بنك الإمارات التجريبي شركة ${b.name} بمبلغ ${fmt(Math.round(total * 0.05))} درهم، ويعادل 5% من قيمة العطاء، وذلك لمدة 120 يوماً من تاريخ الإغلاق.</p>`,
  );
const programmeHtml = (b: Bid) =>
  page(
    `<h1>Work Programme — ${b.name}</h1><table><tr><th>Activity</th><th>Start (day)</th><th>Finish (day)</th></tr>
<tr><td>Mobilisation and demolition</td><td>1</td><td>12</td></tr><tr><td>Finishing works</td><td>10</td><td>${b.days - 20}</td></tr>
<tr><td>MEP works</td><td>15</td><td>${b.days - 10}</td></tr><tr><td>Testing, snagging and handover</td><td>${b.days - 10}</td><td>${b.days}</td></tr></table>
<p>Total duration: ${b.days} days from site handover.</p>`,
    false,
  );

const bidTotal = (b: Bid) =>
  LINES.reduce((s, l, i) => {
    const rate = b.rates[i];
    return rate === null ? s : s + (b.amountOverride?.[i] ?? rate * (b.qty?.[i] ?? l.qty));
  }, 0) + (b.extra ? b.extra.rate * b.extra.qty : 0);

async function pdf(html: string, file: string) {
  await htmlToPdf(html, file, pdfOpts);
}

(async () => {
  fs.rmSync(OUT, { recursive: true, force: true });
  const ext = path.join(ROOT, "مستندات الطرح", "الخارجية");
  const int = path.join(ROOT, "مستندات الطرح", "الداخلية");
  fs.mkdirSync(ext, { recursive: true });
  fs.writeFileSync(path.join(ext, "جدول كميات المناقصة.xlsx"), await boqWorkbook(null));
  await pdf(boqHtml(null), path.join(ext, "جدول كميات المناقصة.pdf"));
  await pdf(declarationHtml, path.join(ext, "إقرار بمستندات العطاء.pdf"));
  await pdf(approvalHtml, path.join(int, "الإعتماد المالي.pdf"));

  // The bids, as one zip like the portal's export.
  const tmp = path.join(OUT, ".tmp");
  const zip = new JSZip();
  for (const b of BIDS) {
    const base = `bids_wt_2026_017/${b.folder}`;
    const put = async (rel: string, html: string) => {
      const file = path.join(tmp, b.folder, path.basename(rel));
      await pdf(html, file);
      zip.file(`${base}/${rel}`, fs.readFileSync(file));
    };
    zip.file(`${base}/supplier.txt`, b.name);
    zip.file(`${base}/BOQ/005-جدول_الكميات(Excel).xlsx`, await boqWorkbook(b));
    await put("جدول_الكميات/004-جدول_الكميات.pdf", boqHtml(b));
    if (b.bond) await put("الكفالة_المصرفية/001-التأمين_الابتدائي.pdf", bondHtml(b, bidTotal(b)));
    await put("_/002-رخصة_تجارية.pdf", licenceHtml(b));
    await put("_/003-البرنامج_الزمني.pdf", programmeHtml(b));
    if (b.duplicateLicence)
      zip.file(
        `${base}/General_Attachments/رخصة.pdf`,
        fs.readFileSync(path.join(tmp, b.folder, "002-رخصة_تجارية.pdf")),
      );
  }
  const bidsDir = path.join(ROOT, "عطاءات الشركات في محضر الفتح");
  fs.mkdirSync(bidsDir, { recursive: true });
  fs.writeFileSync(
    path.join(bidsDir, "bids_wt_2026_017.zip"),
    await zip.generateAsync({ type: "nodebuffer", compression: "DEFLATE" }),
  );
  fs.rmSync(tmp, { recursive: true, force: true });
  await closeBrowser();
  console.log(`✔ ${path.relative(process.cwd(), ROOT)}`);
  for (const b of BIDS) console.log(`  ${b.name}: AED ${fmt(bidTotal(b))} before VAT`);
})();
