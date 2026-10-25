/**
 * A bid's total in a few characters (2026-10-26, user: under each vendor's name the AI's sentence
 * "480200 before VAT; VAT 24010; 504210 including VAT" has no room and "looks goofy"). The AI
 * copies the total as the bid states it, often with VAT and a breakdown; under a name we show
 * one amount: the one before VAT when the text says which it is, otherwise the first total.
 * The full text stays in the comparison table and on hover. Pure: shared by the UI and tests.
 */

export interface ShortPrice {
  /** "AED 480,200" (currency when known, Western digits, thousands separators). */
  amount: string;
  /** The amount is the one the text calls "before VAT" (or excluding VAT). */
  beforeVat: boolean;
}

const BEFORE_VAT =
  /^[^;\d]{0,12}?(?:before|excl(?:uding|\.)?|exclusive of|without|net of|pre-?)\s*(?:the\s*)?VAT|^[^;\d]{0,12}?(?:قبل|بدون|غير شامل(?:ة)?)\s*(?:ال)?ضريبة/i;
/** A number right after "VAT" (or "VAT (5%)") is the tax itself, not a total. */
const VAT_BEFORE =
  /(?:VAT|ضريبة القيمة المضافة|الضريبة)\s*(?:\(\s*\d+(?:\.\d+)?\s*%\s*\))?\s*:?\s*$/i;
const CURRENCY = /\b(AED|USD|EUR|GBP|SAR|QAR|KWD|OMR|BHD)\b|(dirhams?|dhs|درهم|دولار|ريال)/i;
const CURRENCY_WORD: Record<string, string> = {
  dirham: "AED",
  dirhams: "AED",
  dhs: "AED",
  درهم: "AED",
  دولار: "USD",
  ريال: "SAR",
};

/** "AED" from the currency field when it names one, else from the text; "" when neither does. */
function currencyOf(text: string, field?: string | null): string {
  const m = (field ? CURRENCY.exec(field) : null) ?? CURRENCY.exec(text);
  if (!m) return "";
  return m[1] ? m[1].toUpperCase() : (CURRENCY_WORD[m[2].toLowerCase()] ?? "");
}
const AMOUNT = /\d{1,3}(?:[,٬]\d{3})+(?:\.\d+)?|\d{3,}(?:\.\d+)?/g;

function format(raw: string): string {
  const [whole, decimals] = raw.replace(/[,٬]/g, "").split(".");
  const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return decimals && /[1-9]/.test(decimals) ? `${grouped}.${decimals}` : grouped;
}

export function shortPrice(
  text: string | null | undefined,
  currency?: string | null,
): ShortPrice | null {
  if (!text) return null;
  const amounts: { raw: string; after: string; before: string }[] = [];
  for (const m of text.matchAll(AMOUNT)) {
    const end = m.index + m[0].length;
    const after = text.slice(end, end + 40);
    if (/^\s*%/.test(after)) continue; // a rate, not an amount
    amounts.push({ raw: m[0], after, before: text.slice(Math.max(0, m.index - 30), m.index) });
  }
  const totals = amounts.filter((a) => !VAT_BEFORE.test(a.before));
  if (!totals.length) return null;
  const pre = totals.find((a) => BEFORE_VAT.test(a.after));
  const pick = pre ?? totals[0];
  const code = currencyOf(text, currency);
  const amount = format(pick.raw);
  return { amount: code ? `${code} ${amount}` : amount, beforeVat: Boolean(pre) };
}
