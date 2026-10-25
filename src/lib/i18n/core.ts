/**
 * English / Arabic UI (2026-10-25). The English text is the key: translate("ar", "Recommended
 * vendor") looks it up in the Arabic dictionary (src/lib/i18n/ar/) and falls back to the English.
 * Placeholders are named: "Rank {rank} of {n}". Plurals use the English plural as the key and the
 * Arabic entry gives the forms Intl.PluralRules("ar") picks from (zero, one, two, few, many, other).
 * Isomorphic: the client uses it through useT() (src/components/i18n-provider.tsx), the server for
 * error messages. Conventions and the glossary: src/lib/i18n/README.md.
 */
import { AR } from "./ar";

export const LOCALES = ["en", "ar"] as const;
export type Locale = (typeof LOCALES)[number];
export const LOCALE_STORAGE_KEY = "marsa-locale";
export const LOCALE_COOKIE = "marsa-locale";

export const isLocale = (v: unknown): v is Locale => v === "en" || v === "ar";
export const dirOf = (locale: Locale): "ltr" | "rtl" => (locale === "ar" ? "rtl" : "ltr");

export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & { other: string };
export type Entry = string | PluralForms;
export type Dictionary = Record<string, Entry>;
export type Vars = Record<string, string | number>;

const DICTIONARIES: Record<Locale, Dictionary> = { en: {}, ar: AR };

/**
 * Marks English text for translation where it is defined (a constant, a label map); the code that
 * shows it calls t(text). Returns the text unchanged.
 */
export const msg = <S extends string>(text: S): S => text;

export function lookup(locale: Locale, key: string): Entry | undefined {
  return locale === "en" ? undefined : DICTIONARIES[locale][key];
}

export function fill(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

const pluralRules = new Map<Locale, Intl.PluralRules>();
function pluralForm(locale: Locale, n: number): Intl.LDMLPluralRule {
  let r = pluralRules.get(locale);
  if (!r) pluralRules.set(locale, (r = new Intl.PluralRules(locale)));
  return r.select(n);
}

/** The text of an entry for a count (a plain string has one form). */
export function pick(locale: Locale, entry: Entry, n?: number): string {
  if (typeof entry === "string") return entry;
  if (n == null) return entry.other;
  return entry[pluralForm(locale, n)] ?? entry.other;
}

export function translate(locale: Locale, key: string, vars?: Vars): string {
  const entry = lookup(locale, key);
  return fill(entry === undefined ? key : pick(locale, entry), vars);
}

/** "{n} vendor" / "{n} vendors": the Arabic entry is keyed by the English plural. */
export function translatePlural(
  locale: Locale,
  n: number,
  one: string,
  other: string,
  vars?: Vars,
): string {
  const all = { n, ...vars };
  const entry = lookup(locale, other) ?? lookup(locale, one);
  if (entry === undefined) return fill(n === 1 ? one : other, all);
  return fill(pick(locale, entry, n), all);
}

// ─── Text made elsewhere (step labels, server errors) ────────────────────────────────────────────

interface Template {
  key: string;
  prefix: string;
  re: RegExp;
  names: string[];
}
const templates = new Map<Locale, Template[]>();

function templatesFor(locale: Locale): Template[] {
  let list = templates.get(locale);
  if (list) return list;
  list = [];
  for (const key of Object.keys(DICTIONARIES[locale])) {
    if (!key.includes("{")) continue;
    const names: string[] = [];
    const pattern = key
      .split(/(\{\w+\})/)
      .map((part) => {
        const m = /^\{(\w+)\}$/.exec(part);
        if (!m) return part.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        names.push(m[1]);
        return "(.+?)";
      })
      .join("");
    list.push({ key, prefix: key.split("{")[0], re: new RegExp(`^${pattern}$`, "s"), names });
  }
  // Longer (more specific) templates first.
  list.sort((a, b) => b.key.length - a.key.length);
  templates.set(locale, list);
  return list;
}

/**
 * Translates text that was built elsewhere from an English template, e.g. a step label stored in
 * the database ("Assessing risks for Gulf Systems") or a server error. Matches the dictionary's
 * templates; the values it captures are translated too when they are dictionary words.
 */
export function translateText(locale: Locale, text: string): string {
  if (locale === "en" || !text) return text;
  const exact = lookup(locale, text);
  if (exact !== undefined) return pick(locale, exact);
  for (const t of templatesFor(locale)) {
    if (!text.startsWith(t.prefix)) continue;
    const m = t.re.exec(text);
    if (!m) continue;
    const vars: Vars = {};
    t.names.forEach((name, i) => {
      const v = m[i + 1];
      vars[name] = /^\d+$/.test(v) ? Number(v) : translateText(locale, v);
    });
    const entry = lookup(locale, t.key)!;
    const n = typeof vars.n === "number" ? vars.n : undefined;
    return fill(pick(locale, entry, n), vars);
  }
  return text;
}

// ─── Formatting ──────────────────────────────────────────────────────────────────────────────────

/** Arabic dates with Western digits, as on RTA screens: "25 أكتوبر 2026". */
export const intlLocale = (locale: Locale) => (locale === "ar" ? "ar-AE-u-nu-latn" : "en-GB");

const formatters = new Map<string, Intl.DateTimeFormat>();
function dateFormat(locale: Locale, opts: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const id = `${locale}:${JSON.stringify(opts)}`;
  let f = formatters.get(id);
  if (!f) formatters.set(id, (f = new Intl.DateTimeFormat(intlLocale(locale), opts)));
  return f;
}

const DAY_OPTS: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };

export const formatDateIn = (locale: Locale, iso: string) =>
  dateFormat(locale, DAY_OPTS).format(new Date(iso));

export const formatDateTimeIn = (locale: Locale, iso: string) =>
  dateFormat(locale, { ...DAY_OPTS, hour: "2-digit", minute: "2-digit" }).format(new Date(iso));

/** A YYYY-MM-DD date without timezone shifts: "30 Nov 2026". */
export function formatYmdIn(locale: Locale, ymd: string): string {
  const [y, m, d] = ymd.split("-").map(Number);
  return dateFormat(locale, { ...DAY_OPTS, timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}

/** Any Intl.DateTimeFormat options, e.g. { hour: "2-digit", minute: "2-digit" }. */
export const formatWithIn = (locale: Locale, date: Date, opts: Intl.DateTimeFormatOptions) =>
  dateFormat(locale, opts).format(date);
