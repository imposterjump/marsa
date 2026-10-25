# English / Arabic UI

Users switch the language with the **ع / EN** button in the top bar or in **Settings → Appearance**.
The choice is saved in the browser (`localStorage` `marsa-locale`, plus a cookie of the same name the
server reads for error messages). Arabic turns the whole page right-to-left (`<html lang="ar" dir="rtl">`).
AI-written text (findings, summaries, reports) stays in the language it was written in. The run's
**Report language** setting (Settings → AI) chooses that language for new analyses.

## How it works

- **The English text is the key.** `t("Recommended vendor")` looks the text up in the Arabic
  dictionary (`ar/*.ts`, one file per area, merged in `ar/index.ts`) and falls back to the English.
- `src/lib/i18n/core.ts`: the plain functions (no React): `translate`, `translatePlural`,
  `translateText`, `msg`, and date formatting.
- `src/components/i18n-provider.tsx`: `LocaleProvider`, `useT()`, `useLocale()`, `currentT()`.
- The boot script (`src/lib/theme.ts`) sets `lang` / `dir` before paint. The server always renders
  English; the provider re-renders in Arabic right after hydration while the page stays hidden
  (`data-locale-pending`), so English never flashes.
- Server error messages: `withErrors` (`src/server/api.ts`) translates `ApiError` messages with the
  cookie's language, through the same dictionary (`translateText`).

## Writing UI text

```tsx
import { useT } from "@/components/i18n-provider";

const t = useT();                                   // at the top of the component or custom hook
<h2>{t("Recommended vendor")}</h2>
<Button aria-label={t("Collapse {name}", { name: v.name })} />
t("Rank {rank} of {n}", { rank: 1, n: vendors.length })
t.plural(n, "{n} vendor", "{n} vendors")            // Arabic picks zero/one/two/few/many/other
t("{n} still to fix", { n: <b>{count}</b> })        // a React node among the values → a React node
t.plural(count, "{n} risk", "{n} risks", { n: <b>{count}</b> })
t(FINDING_STATUS_LABEL[status])                     // label maps in src/lib/labels.ts are msg()-marked
t.auto(step.label)                                  // text the server built from an English template
t.date(iso) · t.dateTime(iso) · t.ymd("2026-11-30") · t.bytes(n) · t.deadline(ymd) · t.greeting()
t("{app} checks each vendor", { app: t.appName })   // Mizan / ميزان
```

- **Whole sentences only.** Never glue translated fragments together (`t("Rank") + " 1 " + t("of")`):
  Arabic word order differs. One key per sentence, with named placeholders.
- **Constants outside components:** wrap the English with `msg("Profile")` (from `@/lib/i18n/core`)
  where it is defined and call `t(label)` where it is shown.
- **Outside render** (a toast after an `await`, a helper with no hook): `currentT()`.
- Never call `t` at module scope; it must run in render (or `currentT()` at event time).
- Data is never translated: project and vendor names, codes, file names, AI output.
- A string that must stay English (a code, a sample) gets `// i18n-ignore` on its line or the line above.

## Adding the Arabic

Add `"English key": "النص العربي"` to the area file in `ar/` for the screen you are working on.
A key lives in **one** file only (generic words such as Cancel, Save, Close are in `ar/common.ts`).
Placeholders must match the key exactly: `"Rank {rank} of {n}": "الترتيب {rank} من {n}"`.
Plural entries are keyed by the English plural:

```ts
"{n} vendors": { zero: "لا موردين", one: "مورد واحد", two: "موردان", few: "{n} موردين", many: "{n} موردًا", other: "{n} مورد" },
```

Arabic plural forms: zero (0), one (1), two (2), few (3–10), many (11–99), other (100+). `one` and
`two` usually drop the number ("مورد واحد", "موردان").

## Checks

- `npx tsx scripts/i18n-scan.ts [files…]`: English left in the UI, and `t()` keys with no Arabic.
- `tests/unit/i18n.test.ts` (part of `npm run check`): every key has Arabic, placeholders match, no
  key is in two area files, the scan is clean, and step labels / server errors translate.

## Style

Modern Standard Arabic, formal and short, as on UAE government screens. Western digits (0–9) and
`%`. Arabic punctuation: `،` and `؟`. Quotes: « ». Keep codes and names in Latin script: RFP codes,
standard codes (ISO 27001), file types (PDF, DOCX, XLSX), model names (Claude Haiku 5.5), SLA.
Address the user formally and neutrally; prefer verbal nouns for buttons ("حفظ", "تنزيل").

## Glossary (use these words everywhere)

| English | Arabic |
| --- | --- |
| Mizan (the product) | ميزان |
| Procurement Intelligence | ذكاء المشتريات |
| Project / projects | المشروع / المشاريع |
| Tender | المناقصة |
| RFP (the client's request) | طلب العروض |
| RFP compliance | الامتثال لطلب العروض |
| Standard / standards | المعيار / المعايير |
| Standards compliance | الامتثال للمعايير |
| Rule / rules (of a standard) | القاعدة / القواعد |
| Requirement | المتطلب / المتطلبات |
| Checklist | قائمة التحقق |
| Vendor / vendors | المورّد / الموردون (الموردين) |
| Proposal / proposals | العرض / العروض |
| Commercial / technical (proposal) | تجاري / فني (العرض التجاري / العرض الفني) |
| Bid / bidder | العطاء / مقدّم العطاء |
| Preferred bidder | مقدّم العطاء المفضّل |
| Acceptable with conditions | مقبول بشروط |
| Not recommended | غير موصى به |
| Section (of a proposal) | القسم / الأقسام |
| Compliant / Partially compliant / Non-compliant / Not addressed | مطابق / مطابق جزئيًا / غير مطابق / لم يُتناول |
| Mandatory / Important / Desirable | إلزامي / مهم / مرغوب |
| Risk / risks | الخطر / المخاطر |
| Risk register | سجل المخاطر |
| Risk score | درجة المخاطر |
| Low / Moderate / High / Critical risk | خطر منخفض / متوسط / مرتفع / حرج |
| Severity | الخطورة |
| Mitigation | التخفيف (إجراءات التخفيف) |
| Evidence / source | الدليل / المصدر |
| Score / overall score | الدرجة / الدرجة الإجمالية |
| Rank | الترتيب |
| Recommendation / recommended vendor | التوصية / المورّد الموصى به |
| Comparison / compare | المقارنة / قارن |
| AI analysis | التحليل بالذكاء الاصطناعي |
| Run AI analysis | تشغيل التحليل بالذكاء الاصطناعي |
| Analysis (one run) | التحليل |
| Evaluation | التقييم |
| Overview | نظرة عامة |
| Report / consultant report | التقرير / تقرير الاستشاري |
| AI quality | جودة الذكاء الاصطناعي |
| Agent / orchestrator | الوكيل / المنسّق |
| Step / phase | الخطوة / المرحلة |
| Queued / Running / Done / Failed / Skipped / Cancelled | في الانتظار / قيد التشغيل / تم / فشل / تم التخطي / أُلغي |
| Draft / Open for proposals / Evaluating / Evaluated / Archived | مسودة / مفتوح لتلقي العروض / قيد التقييم / تم التقييم / مؤرشف |
| Deadline / submission deadline | الموعد النهائي / الموعد النهائي لتقديم العروض |
| Document / file | المستند / الملف |
| Upload / download / view / preview | رفع / تنزيل / عرض / معاينة |
| Strengths / weaknesses | نقاط القوة / نقاط الضعف |
| Concerns / conditions | المخاوف / الشروط |
| Negotiation points / clarifications | نقاط التفاوض / الاستيضاحات |
| Confidence (AI's own) | ثقة الذكاء الاصطناعي |
| Point list / by section / risk list | قائمة النقاط / حسب القسم / قائمة المخاطر |
| Settings / profile / appearance | الإعدادات / الملف الشخصي / المظهر |
| Light / dark / system (theme) | فاتح / داكن / حسب النظام |
| Demo AI / mock mode / live | ذكاء اصطناعي تجريبي / الوضع التجريبي / مباشر |
| Vendor simulator | محاكي الموردين |
| Sample (data) | نموذجي (بيانات نموذجية) |
| Customer / organisation | العميل / الجهة |
| Model (AI) | النموذج |
