"use client";

import { Languages } from "lucide-react";
import { useLocale, useT } from "@/components/i18n-provider";
import { Button } from "@/components/ui/button";
import { SegmentedControl } from "@/components/ui/segmented-control";
import type { Locale } from "@/lib/i18n/core";

/**
 * Switches the screens' language. The AI's results follow: every analysis is written in English
 * and translated into Arabic by its last step (2026-10-25), so nothing else changes.
 */
export function useSwitchLanguage() {
  const { locale, setLocale } = useLocale();
  return {
    locale,
    switchTo: (next: Locale) => {
      if (next !== locale) setLocale(next); // instant (localStorage + <html lang dir>)
    },
  };
}

/** Top bar: one tap to the other language, named in that language. */
export function LanguageToggle() {
  const t = useT();
  const { locale, switchTo } = useSwitchLanguage();
  const next: Locale = locale === "ar" ? "en" : "ar";
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-1.5 px-2.5 font-medium"
      onClick={() => switchTo(next)}
      aria-label={next === "ar" ? t("Switch to Arabic") : t("Switch to English")}
      title={next === "ar" ? t("Switch to Arabic") : t("Switch to English")}
    >
      <Languages className="size-[18px]" aria-hidden />
      <span lang={next} className="hidden sm:inline">
        {next === "ar" ? "العربية" : "English" /* i18n-ignore */}
      </span>
      <span lang={next} className="sm:hidden">
        {next === "ar" ? "ع" : "EN"}
      </span>
    </Button>
  );
}

/** Settings → Appearance. */
export function LanguageSegmented() {
  const t = useT();
  const { locale, switchTo } = useSwitchLanguage();
  return (
    <SegmentedControl<Locale>
      aria-label={t("Language")}
      value={locale}
      onValueChange={switchTo}
      options={[
        // i18n-ignore: each language is named in itself
        { value: "en", label: <span lang="en">English</span> },
        { value: "ar", label: <span lang="ar">العربية</span> },
      ]}
    />
  );
}
