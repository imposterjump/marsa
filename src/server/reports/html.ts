/**
 * The consultant report as print HTML (2026-10-25): A4, two pages, the RTA look (ink text, the red
 * gradient rule, light cards), English or Arabic (right to left). Pure: the caller passes the
 * fonts and the emblem as data URIs, so tests can render it without the app. Every text from the
 * model is escaped.
 *
 * Layout: header (emblem, title, tender, vendor, verdict, the four score rings) → executive
 * summary → technical and commercial proposal (rating, assessment, strengths beside weaknesses)
 * → technical vs commercial balance → key concerns → the consultant's recommendation (opinion,
 * conditions, negotiation points, clarifications) → method note.
 */
import type { AspectRating, ReportLanguage, ReportVerdict, RiskSeverity } from "../../lib/domain";
import { APP_NAME, APP_NAME_AR } from "../../lib/brand";
import type { ReportOutput } from "../ai/schemas";

export interface ReportView {
  language: ReportLanguage;
  project: { code: string; name: string };
  vendor: { name: string; country: string | null };
  /** ISO time the report was written. */
  generatedAt: string;
  /** "Claude Haiku 5.5", or "the demo engine" for mock runs. */
  author: string;
  scores: {
    overall: number;
    rfpPct: number;
    standardsPct: number | null;
    riskScore: number;
    riskLevel: RiskSeverity;
    rank: number;
    ranked: number;
  };
  report: ReportOutput;
}

export interface ReportAssets {
  /** data: URIs (woff2) and the emblem (png). */
  latinFont: string | null;
  arabicFont: string | null;
  emblem: string | null;
}

const TEXT = {
  en: {
    title: "Vendor Evaluation Report",
    confidential: "Confidential · for the evaluation committee",
    tender: "Tender",
    date: "Report date",
    rank: (r: number, n: number) => `Rank ${r} of ${n}`,
    overall: "Overall",
    rfp: "RFP",
    standards: "Standards",
    risk: "Risk",
    summary: "Executive summary",
    technical: "Technical proposal",
    commercial: "Commercial proposal",
    strengths: "Strengths",
    weaknesses: "Weaknesses",
    balance: "Technical vs commercial balance",
    valueForMoney: "Value for money",
    concerns: "Key concerns for the client",
    recommendation: "Consultant's recommendation",
    conditions: "Conditions before award",
    negotiation: "Negotiation points",
    clarifications: "Clarifications to request",
    none: "None.",
    page: (p: string, t: string) => `Page ${p} of ${t}`,
    method: (author: string) =>
      `Prepared by ${APP_NAME} with ${author}, acting as a procurement consultant, from the RFP, the vendor's proposal and ${APP_NAME}'s evaluation. Scores are computed by ${APP_NAME}'s scoring rules. AI-generated: verify key facts against the source documents before deciding.`,
    verdict: {
      preferred_bidder: "Preferred bidder",
      acceptable_with_conditions: "Acceptable with conditions",
      not_recommended: "Not recommended",
    } satisfies Record<ReportVerdict, string>,
    rating: { strong: "Strong", adequate: "Adequate", weak: "Weak" } satisfies Record<
      AspectRating,
      string
    >,
    riskLevel: {
      low: "Low",
      moderate: "Moderate",
      high: "High",
      critical: "Critical",
    } satisfies Record<RiskSeverity, string>,
    locale: "en-GB",
  },
  ar: {
    title: "تقرير تقييم المورّد",
    confidential: "سرّي · للجنة التقييم",
    tender: "المناقصة",
    date: "تاريخ التقرير",
    rank: (r: number, n: number) => `الترتيب ${r} من ${n}`,
    overall: "الإجمالي",
    rfp: "طلب العروض",
    standards: "المعايير",
    risk: "المخاطر",
    summary: "الملخص التنفيذي",
    technical: "العرض الفني",
    commercial: "العرض التجاري",
    strengths: "نقاط القوة",
    weaknesses: "نقاط الضعف",
    balance: "التوازن بين الجانبين الفني والتجاري",
    valueForMoney: "القيمة مقابل التكلفة",
    concerns: "أبرز المخاوف للجهة المتعاقدة",
    recommendation: "توصية الاستشاري",
    conditions: "شروط قبل الترسية",
    negotiation: "نقاط التفاوض",
    clarifications: "استيضاحات مطلوبة من المورّد",
    none: "لا يوجد.",
    page: (p: string, t: string) => `صفحة ${p} من ${t}`,
    method: (author: string) =>
      `أعدّ ${APP_NAME_AR} هذا التقرير باستخدام ${author} بصفة استشاري مشتريات، استنادًا إلى طلب العروض وعرض المورّد وتقييم ${APP_NAME_AR}. الدرجات محسوبة وفق قواعد التقييم في ${APP_NAME_AR}. محتوى مولَّد بالذكاء الاصطناعي: تحقّق من الحقائق الأساسية في المستندات الأصلية قبل اتخاذ القرار.`,
    verdict: {
      preferred_bidder: "المورّد المفضّل",
      acceptable_with_conditions: "مقبول بشروط",
      not_recommended: "غير موصى به",
    } satisfies Record<ReportVerdict, string>,
    rating: { strong: "قوي", adequate: "مقبول", weak: "ضعيف" } satisfies Record<
      AspectRating,
      string
    >,
    riskLevel: {
      low: "منخفضة",
      moderate: "متوسطة",
      high: "عالية",
      critical: "حرجة",
    } satisfies Record<RiskSeverity, string>,
    locale: "ar",
  },
} as const;

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** Compliance bands of the app (green ≥ 70, blue ≥ 30, yellow below), print colours. */
const pctColor = (v: number) => (v >= 70 ? "#1fa97c" : v >= 30 ? "#3b7dd8" : "#f5a623");
const RISK_COLOR: Record<RiskSeverity, string> = {
  low: "#1fa97c",
  moderate: "#f5a623",
  high: "#f07630",
  critical: "#e5484d",
};
const VERDICT_TONE: Record<ReportVerdict, string> = {
  preferred_bidder: "ok",
  acceptable_with_conditions: "warn",
  not_recommended: "bad",
};
const RATING_TONE: Record<AspectRating, string> = { strong: "ok", adequate: "info", weak: "bad" };

function ring(value: number | null, color: string, size: number, text: string, label: string) {
  const stroke = size > 56 ? 6 : 4.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = value === null ? 0 : Math.max(0, Math.min(100, value));
  const mid = size / 2;
  return `<div class="ring${size > 56 ? " ring-lg" : ""}">
  <div class="ring-disc" style="width:${size}px;height:${size}px">
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true">
      <circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="#e8ecf2" stroke-width="${stroke}"/>
      ${v > 0 ? `<circle cx="${mid}" cy="${mid}" r="${r}" fill="none" stroke="${color}" stroke-width="${stroke}" stroke-dasharray="${((c * v) / 100).toFixed(2)} ${c.toFixed(2)}" transform="rotate(-90 ${mid} ${mid})"/>` : ""}
    </svg>
    <span class="ring-val">${esc(text)}</span>
  </div>
  <span class="ring-label">${esc(label)}</span>
</div>`;
}

const fmt = (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(1));

function points(
  list: ReportOutput["technical"]["strengths"],
  kind: "plus" | "minus",
  none: string,
) {
  if (!list.length) return `<p class="muted">${esc(none)}</p>`;
  return `<ul class="points ${kind}">${list
    .map(
      (p) =>
        `<li><span class="mark" aria-hidden="true">${kind === "plus" ? "✓" : "✕"}</span><span dir="auto">${esc(p.point)}${p.reference ? ` <span class="ref">${esc(p.reference)}</span>` : ""}</span></li>`,
    )
    .join("")}</ul>`;
}

function aspect(title: string, a: ReportOutput["technical"], t: (typeof TEXT)[ReportLanguage]) {
  return `<section class="block">
  <h2>${esc(title)} <span class="chip ${RATING_TONE[a.rating]}">${esc(t.rating[a.rating])}</span></h2>
  <p dir="auto">${esc(a.assessment)}</p>
  <div class="cols2">
    <div><h3>${esc(t.strengths)}</h3>${points(a.strengths, "plus", t.none)}</div>
    <div><h3>${esc(t.weaknesses)}</h3>${points(a.weaknesses, "minus", t.none)}</div>
  </div>
</section>`;
}

const numbered = (list: string[], none: string) =>
  list.length
    ? `<ol class="actions">${list.map((x) => `<li dir="auto">${esc(x)}</li>`).join("")}</ol>`
    : `<p class="muted">${esc(none)}</p>`;

export function reportHtml(view: ReportView, assets: ReportAssets): string {
  const t = TEXT[view.language];
  const rtl = view.language === "ar";
  const { report: r, scores: s } = view;
  const date = new Date(view.generatedAt).toLocaleDateString(t.locale, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const fonts = [
    assets.latinFont &&
      `@font-face{font-family:"Hanken Grotesk";src:url(${assets.latinFont}) format("woff2");font-weight:100 900;}`,
    assets.arabicFont &&
      `@font-face{font-family:"Noto Sans Arabic";src:url(${assets.arabicFont}) format("woff2");font-weight:100 900;}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `<!doctype html>
<html lang="${view.language}" dir="${rtl ? "rtl" : "ltr"}">
<head>
<meta charset="utf-8">
<title>${esc(`${t.title} · ${view.vendor.name}`)}</title>
<style>
${fonts}
@page { size: A4; }
* { box-sizing: border-box; }
html { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
body { margin: 0; font-family: "Hanken Grotesk", "Noto Sans Arabic", "Segoe UI", Arial, sans-serif; color: #171b21; font-size: 8.9pt; line-height: 1.45; }
p { margin: 0 0 5pt; }
.muted { color: #5d6673; }
.top { display: flex; align-items: center; justify-content: space-between; gap: 12pt; padding-bottom: 6pt; }
.brand { display: flex; align-items: center; gap: 8pt; }
.brand img { width: 30px; height: 30px; object-fit: contain; }
.brand b { font-size: 10pt; letter-spacing: .02em; }
.brand span { display: block; font-size: 7.4pt; color: #5d6673; letter-spacing: .08em; text-transform: uppercase; font-weight: 700; }
.conf { font-size: 7pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #c4161c; }
.rule { height: 3px; border-radius: 2px; background: linear-gradient(${rtl ? "270deg" : "90deg"}, #ec1c24, #ff5a47 55%, #ff8a5c); margin-bottom: 10pt; }
.hero { display: flex; align-items: center; justify-content: space-between; gap: 14pt; margin-bottom: 9pt; }
.hero .meta { min-width: 0; }
.caps { font-size: 7pt; font-weight: 700; letter-spacing: .09em; text-transform: uppercase; color: #8a94a6; }
h1 { font-size: 19pt; line-height: 1.15; margin: 3pt 0 4pt; font-weight: 650; letter-spacing: -.01em; }
.sub { font-size: 8pt; color: #5d6673; margin-bottom: 6pt; }
.badge { display: inline-block; padding: 3pt 9pt; border-radius: 999px; font-size: 8pt; font-weight: 700; }
.rings { display: flex; align-items: flex-end; gap: 9pt; flex-shrink: 0; }
.ring { display: flex; flex-direction: column; align-items: center; gap: 3pt; }
.ring-disc { position: relative; }
.ring-disc svg { display: block; }
.ring-val { position: absolute; inset: 0; display: flex; align-items: center; justify-content: center; font-weight: 650; font-size: 8.5pt; font-variant-numeric: tabular-nums; }
.ring-lg .ring-val { font-size: 13pt; font-weight: 300; }
.ring-label { font-size: 6.6pt; font-weight: 700; letter-spacing: .07em; text-transform: uppercase; color: #5d6673; }
.headline { font-size: 11pt; font-weight: 600; line-height: 1.35; margin: 0 0 9pt; padding: 7pt 10pt; border-${rtl ? "right" : "left"}: 3px solid #ec1c24; background: #fdf3f2; border-radius: 3pt; }
h2 { font-size: 10.6pt; margin: 0 0 4pt; display: flex; align-items: center; gap: 6pt; font-weight: 650; }
h2::after { content: ""; flex: 1; height: 1px; background: #e8ecf2; }
h3 { font-size: 7.2pt; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #5d6673; margin: 2pt 0 3pt; }
.block { margin-bottom: 9pt; }
/* A heading never ends a page; the short sections (balance, concerns, advice) stay whole. */
h2 { break-after: avoid; }
.keep { break-inside: avoid; }
.chip { font-size: 7pt; font-weight: 700; padding: 1.5pt 6pt; border-radius: 999px; letter-spacing: .02em; }
.ok { background: #e3f5ee; color: #0f7553; }
.warn { background: #fcf1de; color: #9a5b00; }
.bad { background: #fbe9e7; color: #c42b31; }
.info { background: #e8f0fb; color: #2763b5; }
.cols2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10pt; }
.cols3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10pt; }
.points { list-style: none; margin: 0; padding: 0; }
.points li { display: flex; gap: 5pt; margin-bottom: 3.5pt; break-inside: avoid; }
.points .mark { flex: 0 0 auto; width: 11pt; height: 11pt; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; font-size: 6.5pt; font-weight: 700; margin-top: 1pt; }
.plus .mark { background: #e3f5ee; color: #0f7553; }
.minus .mark { background: #fbe9e7; color: #c42b31; }
.ref { color: #8a94a6; font-size: 7.2pt; white-space: nowrap; }
.card { border: 1px solid #e8ecf2; border-radius: 6pt; padding: 8pt 10pt; background: #fafbfd; break-inside: avoid; }
.pair { display: flex; gap: 6pt; margin-bottom: 5pt; flex-wrap: wrap; }
.concerns { margin: 0; padding-${rtl ? "right" : "left"}: 14pt; }
.concerns li { margin-bottom: 4pt; break-inside: avoid; }
.concerns b { font-weight: 650; }
.advice { border: 1px solid #f3c9c4; background: #fdf3f2; border-radius: 6pt; padding: 9pt 11pt; break-inside: avoid; }
.advice > p { font-size: 9.2pt; margin-bottom: 7pt; }
.actions { margin: 0; padding-${rtl ? "right" : "left"}: 13pt; }
.actions li { margin-bottom: 3pt; break-inside: avoid; }
.method { margin-top: 8pt; font-size: 7pt; color: #8a94a6; line-height: 1.4; }
</style>
</head>
<body>
<header>
  <div class="top">
    <div class="brand">
      ${assets.emblem ? `<img src="${assets.emblem}" alt="">` : ""}
      <div><b>${esc(view.language === "ar" ? APP_NAME_AR : APP_NAME)}</b><span>${esc(t.title)}</span></div>
    </div>
    <div class="conf">${esc(t.confidential)}</div>
  </div>
  <div class="rule"></div>
  <div class="hero">
    <div class="meta">
      <div class="caps">${esc(t.tender)} ${esc(view.project.code)} · ${esc(view.project.name)}</div>
      <h1 dir="auto">${esc(view.vendor.name)}</h1>
      <div class="sub">${esc([view.vendor.country, t.rank(s.rank, s.ranked), `${t.date}: ${date}`].filter(Boolean).join(" · "))}</div>
      <span class="badge ${VERDICT_TONE[r.verdict]}">${esc(t.verdict[r.verdict])}</span>
    </div>
    <div class="rings">
      ${ring(s.overall, pctColor(s.overall), 70, fmt(s.overall), t.overall)}
      ${ring(s.rfpPct, pctColor(s.rfpPct), 46, `${fmt(s.rfpPct)}%`, t.rfp)}
      ${s.standardsPct === null ? "" : ring(s.standardsPct, pctColor(s.standardsPct), 46, `${fmt(s.standardsPct)}%`, t.standards)}
      ${ring(s.riskScore, RISK_COLOR[s.riskLevel], 46, String(s.riskScore), `${t.risk} · ${t.riskLevel[s.riskLevel]}`)}
    </div>
  </div>
</header>

<p class="headline" dir="auto">${esc(r.headline)}</p>

<section class="block">
  <h2>${esc(t.summary)}</h2>
  <p dir="auto">${esc(r.executiveSummary)}</p>
</section>

${aspect(t.technical, r.technical, t)}
${aspect(t.commercial, r.commercial, t)}

<section class="block keep">
  <h2>${esc(t.balance)}</h2>
  <div class="card">
    <div class="pair">
      <span class="chip ${RATING_TONE[r.technical.rating]}">${esc(t.technical)}: ${esc(t.rating[r.technical.rating])}</span>
      <span class="chip ${RATING_TONE[r.commercial.rating]}">${esc(t.commercial)}: ${esc(t.rating[r.commercial.rating])}</span>
    </div>
    <p dir="auto">${esc(r.balance.assessment)}</p>
    <p dir="auto"><b>${esc(t.valueForMoney)}:</b> ${esc(r.balance.valueForMoney)}</p>
  </div>
</section>

<section class="block keep">
  <h2>${esc(t.concerns)}</h2>
  ${
    r.concerns.length
      ? `<ol class="concerns">${r.concerns.map((c) => `<li dir="auto"><b>${esc(c.title)}.</b> ${esc(c.detail)}</li>`).join("")}</ol>`
      : `<p class="muted">${esc(t.none)}</p>`
  }
</section>

<section class="block keep">
  <h2>${esc(t.recommendation)}</h2>
  <div class="advice">
    <p dir="auto">${esc(r.recommendation.opinion)}</p>
    <div class="cols3">
      <div><h3>${esc(t.conditions)}</h3>${numbered(r.recommendation.conditions, t.none)}</div>
      <div><h3>${esc(t.negotiation)}</h3>${numbered(r.recommendation.negotiationPoints, t.none)}</div>
      <div><h3>${esc(t.clarifications)}</h3>${numbered(r.recommendation.clarifications, t.none)}</div>
    </div>
  </div>
</section>

<p class="method">${esc(t.method(view.author))}</p>
</body>
</html>`;
}

/** Chromium footer: tender and vendor on one side, the page count on the other (system font). */
export function reportFooter(view: ReportView): string {
  const t = TEXT[view.language];
  const label = esc(
    `${view.language === "ar" ? APP_NAME_AR : APP_NAME} · ${view.project.code} · ${view.vendor.name}`,
  );
  const page = t.page('<span class="pageNumber"></span>', '<span class="totalPages"></span>');
  return `<div dir="${view.language === "ar" ? "rtl" : "ltr"}" style="width:100%;padding:0 14mm;font-family:'Segoe UI',Arial,sans-serif;font-size:7px;color:#8a94a6;display:flex;justify-content:space-between;"><span>${label}</span><span>${page}</span></div>`;
}
