"use client";

import {
  createContext,
  createElement,
  Fragment,
  isValidElement,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { Direction } from "radix-ui";
import { APP_NAME, APP_NAME_AR } from "@/lib/brand";
import { formatBytes } from "@/lib/files";
import { daysUntil, greeting } from "@/lib/format";
import { formatDuration } from "@/lib/plan";
import {
  dirOf,
  formatDateIn,
  formatDateTimeIn,
  formatWithIn,
  formatYmdIn,
  isLocale,
  LOCALE_COOKIE,
  LOCALE_STORAGE_KEY,
  lookup,
  pick,
  translate,
  translatePlural,
  translateText,
  type Locale,
  type Vars,
} from "@/lib/i18n/core";

/** Values for t(…): text and numbers, or React nodes for t.rich-style output. */
export type RichVars = Record<string, ReactNode>;

/**
 * The translator: t("Recommended vendor"), t("Rank {rank} of {n}", { rank, n }),
 * t.plural(n, "{n} vendor", "{n} vendors"). With a React node among the values the result is a
 * React node: t("{n} still to fix", { n: <b>{n}</b> }).
 */
export interface T {
  (key: string, vars?: Vars): string;
  (key: string, vars: RichVars): ReactNode;
  plural(n: number, one: string, other: string, vars?: Vars): string;
  plural(n: number, one: string, other: string, vars: RichVars): ReactNode;
  /** Text built elsewhere from an English template (a stored step label, a server error). */
  auto(text: string): string;
  locale: Locale;
  dir: "ltr" | "rtl";
  /** "25 Oct 2026" / "25 أكتوبر 2026" */
  date(iso: string): string;
  dateTime(iso: string): string;
  /** A YYYY-MM-DD date. */
  ymd(ymd: string): string;
  /** Any Intl.DateTimeFormat options. */
  format(date: Date, opts: Intl.DateTimeFormatOptions): string;
  bytes(n: number): string;
  /** "45 s", "3 min", "1 h 5 min" (seconds in). */
  duration(seconds: number): string;
  /** "Closes in 40 days", "Closed yesterday" … */
  deadline(ymd: string): string;
  /** "Good morning" … in the browser's local time. */
  greeting(): string;
  /** The product name users see: Mizan / ميزان. */
  appName: string;
}

const isRich = (vars?: Vars | RichVars) =>
  !!vars && Object.values(vars).some((v) => v != null && typeof v === "object");

/** Fills placeholders with React nodes: returns a fragment of text and nodes. */
function fillRich(text: string, vars: RichVars): ReactNode {
  const parts = text.split(/(\{\w+\})/);
  return createElement(
    Fragment,
    null,
    ...parts.map((part, i) => {
      const m = /^\{(\w+)\}$/.exec(part);
      const value = m && m[1] in vars ? vars[m[1]] : part;
      return createElement(
        Fragment,
        { key: i },
        isValidElement(value) ? value : String(value ?? ""),
      );
    }),
  );
}

const BYTE_UNITS_AR: Record<string, string> = { B: "بايت", KB: "ك.ب", MB: "م.ب", GB: "ج.ب" };

function makeT(locale: Locale): T {
  const t = ((key: string, vars?: Vars | RichVars) => {
    if (isRich(vars)) {
      const entry = lookup(locale, key);
      return fillRich(entry === undefined ? key : pick(locale, entry), vars as RichVars);
    }
    return translate(locale, key, vars as Vars | undefined);
  }) as T;
  t.plural = ((n: number, one: string, other: string, vars?: Vars | RichVars) => {
    if (isRich(vars)) {
      const entry = lookup(locale, other) ?? lookup(locale, one);
      const text = entry === undefined ? (n === 1 ? one : other) : pick(locale, entry, n);
      return fillRich(text, { n, ...vars });
    }
    return translatePlural(locale, n, one, other, vars as Vars | undefined);
  }) as T["plural"];
  t.auto = (text) => translateText(locale, text);
  t.locale = locale;
  t.dir = dirOf(locale);
  t.date = (iso) => formatDateIn(locale, iso);
  t.dateTime = (iso) => formatDateTimeIn(locale, iso);
  t.ymd = (ymd) => formatYmdIn(locale, ymd);
  t.format = (date, opts) => formatWithIn(locale, date, opts);
  t.bytes = (n) => {
    const s = formatBytes(n);
    return locale === "ar" ? s.replace(/[A-Z]+$/, (u) => BYTE_UNITS_AR[u] ?? u) : s;
  };
  t.duration = (seconds) => formatDuration(seconds, locale);
  t.deadline = (ymd) => {
    const n = daysUntil(ymd);
    if (n === 0) return translate(locale, "Closes today");
    if (n === 1) return translate(locale, "Closes tomorrow");
    if (n > 1) return translatePlural(locale, n, "Closes in {n} day", "Closes in {n} days");
    if (n === -1) return translate(locale, "Closed yesterday");
    return translatePlural(locale, -n, "Closed {n} day ago", "Closed {n} days ago");
  };
  t.greeting = () => translate(locale, greeting());
  t.appName = locale === "ar" ? APP_NAME_AR : APP_NAME;
  return t;
}

const TRANSLATORS: Record<Locale, T> = { en: makeT("en"), ar: makeT("ar") };

/** For code that runs on an event, outside render (a toast in a mutation callback). */
export const translatorFor = (locale: Locale): T => TRANSLATORS[locale];

// The boot script (src/lib/theme.ts) sets lang, dir and data-locale on <html> before paint; those
// attributes are the external store React subscribes to, as for the theme.
const LOCALE_EVENT = "marsa:locale";
const subscribe = (cb: () => void) => {
  window.addEventListener(LOCALE_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(LOCALE_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const readLocale = (): Locale => {
  const v = document.documentElement.dataset.locale;
  return isLocale(v) ? v : "en";
};

/** The current translator outside React render (event handlers, toasts after an await). */
export const currentT = (): T => TRANSLATORS[typeof document === "undefined" ? "en" : readLocale()];

export function applyLocale(locale: Locale) {
  const root = document.documentElement;
  root.lang = locale;
  root.dir = dirOf(locale);
  root.dataset.locale = locale;
}

const writeCookie = (locale: Locale) => {
  document.cookie = `${LOCALE_COOKIE}=${locale}; path=/; max-age=31536000; samesite=lax`; // i18n-ignore
};

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
}

const LocaleContext = createContext<LocaleContextValue>({ locale: "en", setLocale: () => {} });

export function LocaleProvider({ children }: { children: ReactNode }) {
  // The server renders English; after hydration React re-renders in the saved language. Until
  // then the boot script keeps the page hidden (data-locale-pending) so English never flashes.
  const locale = useSyncExternalStore(subscribe, readLocale, () => "en" as Locale);

  const setLocale = useCallback((next: Locale) => {
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      /* storage unavailable: the language still applies until the page reloads */
    }
    writeCookie(next); // the server reads it for error messages
    applyLocale(next);
    window.dispatchEvent(new Event(LOCALE_EVENT));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (locale !== readLocale()) return; // still the hydration pass
    delete root.dataset.localePending;
    if (!document.cookie.includes(`${LOCALE_COOKIE}=${locale}`)) writeCookie(locale);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      {/* Radix menus, tabs and sliders follow the reading direction. */}
      <Direction.Provider dir={dirOf(locale)}>{children}</Direction.Provider>
    </LocaleContext.Provider>
  );
}

export const useLocale = () => useContext(LocaleContext);

/** The translator for the language on screen. Stable per language. */
export function useT(): T {
  return TRANSLATORS[useContext(LocaleContext).locale];
}
