import { doc } from "../lib/pdf";
import { TENDER } from "./rfp";

/**
 * Short bilingual technical summary from a (fictional) bidder, file name in Arabic.
 * A faithful translation: both languages say the same thing. Tests Arabic file names + RTL text.
 */
export function arabicSummaryHtml(): string {
  const body = `
<div dir="rtl" lang="ar" style="font-family:'Segoe UI',Arial,sans-serif">
  <h1>ملخص العرض الفني</h1>
  <p class="small">المناقصة رقم ${TENDER.ref} · شركة بوابة النيل للحلول (عينة وهمية لأغراض الاختبار)</p>
  <h2>١. نطاق التوريد</h2>
  <p>نقترح توريد أربعة أنظمة فحص بالأشعة السينية عالية الطاقة ثنائية الطاقة، منها نظام قابل لإعادة التموضع، مع مركز مركزي لتحليل الصور في مركز بيانات الجمارك.</p>
  <h2>٢. الأداء الفني</h2>
  <table>
    <tr><th>البند</th><th>القيمة المقترحة</th></tr>
    <tr><td>اختراق الفولاذ</td><td>٢٩٠ مم (جميع المواقع)</td></tr>
    <tr><td>الإنتاجية</td><td>١٦٠ شاحنة في الساعة</td></tr>
    <tr><td>شاشات محطات العمل</td><td>شاشتان ٢٧ بوصة بدقة ١٩٢٠×١٠٨٠</td></tr>
    <tr><td>درجة حرارة التشغيل</td><td>من ٠ إلى ٤٥ درجة مئوية</td></tr>
  </table>
  <h2>٣. الضمان والدعم</h2>
  <p>فترة الضمان ٢٤ شهراً تبدأ من تاريخ الشحن من المصنع، وتشمل قطع الغيار باستثناء مصدر الأشعة السينية (المسرّع الخطي) الذي نعتبره من المواد الاستهلاكية.</p>
  <p>مركز خدمة محلي يضم ثلاثة مهندسين معتمدين.</p>
</div>
<div class="pb">
  <h1>Technical proposal summary (English translation)</h1>
  <p class="small">Tender ${TENDER.ref} · Nile Gate Solutions (SAMPLE / fictional)</p>
  <h2>1. Scope</h2>
  <p>Four dual-energy high-energy X-ray inspection systems including one relocatable unit, and a central image analysis centre at the Customs Data Center.</p>
  <h2>2. Technical performance</h2>
  <table>
    <tr><th>Item</th><th>Proposed value</th></tr>
    <tr><td>Steel penetration</td><td>290 mm (all sites)</td></tr>
    <tr><td>Throughput</td><td>160 trucks per hour</td></tr>
    <tr><td>Workstation monitors</td><td>Dual 27-inch, 1920×1080</td></tr>
    <tr><td>Operating temperature</td><td>0 to 45 °C</td></tr>
  </table>
  <h2>3. Warranty and support</h2>
  <p>Warranty period of 24 months starting from the date of shipment from the factory, including spare parts except the X-ray source (linear accelerator), which we consider a consumable.</p>
  <p>Local service centre with three certified engineers.</p>
</div>`;
  return doc(body, "Arabic summary");
}

/**
 * A "scanned" bidder clarification letter, delivered only as an image (no text layer).
 * A plausible real-world bidder letter qualifying its offer. Tests image-only documents.
 */
export function scannedLetterHtml(): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  body{margin:0;background:#c9c6bf;display:flex;align-items:center;justify-content:center;height:100vh}
  .paper{width:780px;height:1060px;background:#f4f1e8;transform:rotate(-1.3deg);box-shadow:0 2px 14px rgba(0,0,0,.35);
    padding:70px 78px;font-family:"Times New Roman",Georgia,serif;color:#2b2b2b;position:relative;
    filter:contrast(1.08) grayscale(.25);
    background-image:radial-gradient(rgba(0,0,0,.035) 1px,transparent 1px);background-size:3px 3px}
  .hd{display:flex;justify-content:space-between;border-bottom:2px solid #444;padding-bottom:10px;margin-bottom:28px}
  .hd b{font-size:22px;letter-spacing:1px}
  p{font-size:17px;line-height:1.55;margin:0 0 14px;text-align:justify}
  .stamp{position:absolute;right:90px;top:250px;width:170px;height:170px;border:4px double #7a1f1f;border-radius:50%;
    color:#7a1f1f;display:flex;flex-direction:column;align-items:center;justify-content:center;transform:rotate(14deg);opacity:.75;font-family:Arial;font-weight:700}
  .sig{margin-top:40px;font-family:"Brush Script MT",cursive;font-size:34px;color:#1d3a6e}
  .fold{position:absolute;left:0;right:0;top:50%;height:1px;background:rgba(0,0,0,.08)}
  </style></head><body><div class="paper">
  <div class="fold"></div>
  <div class="hd"><b>ATLAS PORT TECHNOLOGIES</b><span style="font-size:13px">Ref. APT/NGPA/014/C-07<br>3 December 2026</span></div>
  <p>To: The Chair, Tender Committee<br>Northern Gulf Ports Authority</p>
  <p><b>Subject: Tender ${TENDER.ref} — clarification to our bid submission</b></p>
  <p>Dear Sir or Madam,</p>
  <p>Further to our bid submitted on 2 December 2026, we would like to clarify the following points, which form part of our offer:</p>
  <p>1. Due to volatility in component prices, the validity of our offer is ninety (90) days from the bid closing date. Any extension will be subject to price review.</p>
  <p>2. Our price schedule assumes that the Employer will provide a customs duty exemption certificate for the imported equipment.</p>
  <p>3. The liability of Atlas Port Technologies under the contract shall be limited to fifteen percent (15%) of the contract price.</p>
  <p>4. Training for maintenance engineers will be delivered at our regional training centre (5 days).</p>
  <p>We remain at your disposal for any further information.</p>
  <p>Yours faithfully,</p>
  <div class="sig">K. Haddad</div>
  <p style="font-size:14px">Karim Haddad, Bid Manager — SAMPLE / fictional letter for software testing</p>
  <div class="stamp"><span style="font-size:13px">NGPA TENDER OFFICE</span><span style="font-size:22px">RECEIVED</span><span style="font-size:13px">03 DEC 2026</span></div>
  </div></body></html>`;
}

export const LEGACY_RTF = String.raw`{\rtf1\ansi\deff0{\fonttbl{\f0 Times New Roman;}}
\f0\fs24 {\b Technical note (legacy Word format)}\par
Tender NGPA/T/2026/014 - SAMPLE / fictional.\par
This file is saved in a legacy .doc container to test that Marsa stores it but warns that it cannot be previewed or read by the AI.\par
}`;

export const BULK_QUESTIONS = [
  "Is a site visit possible after 6 October 2026?",
  "Can the bid security be issued by a foreign bank?",
  "Please confirm the number of workstations.",
  "Is cab scanning mandatory?",
  "May we propose a single-energy system at T2?",
  "What is the available power at the T2 plot?",
  "Can the image platform be hosted in our regional cloud?",
  "Is DICOS export mandatory or desirable?",
  "Which Active Directory version is in use?",
  "Are civil works part of the evaluated price?",
  "Can warranty start at delivery if PAC is delayed?",
  "Is the relocatable unit subject to T1 penetration targets?",
  "What is the expected number of scans per day at T1 Gate A?",
  "Can training be delivered in English only?",
  "Is a performance bond from an insurance company acceptable?",
  "What are the availability penalty tiers?",
  "Is the 98% availability per scanner or per fleet?",
  "Can we use one-time online licence activation?",
  "Are Hijri dates mandatory?",
  "Who provides the network link to the CDC?",
  "Can we submit the compliance matrix in PDF instead of Excel?",
];
