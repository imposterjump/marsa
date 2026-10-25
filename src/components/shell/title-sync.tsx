"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useT } from "@/components/i18n-provider";
import { useSettings } from "@/hooks/use-settings";
import { pageTitleFor } from "./nav";

/**
 * PRD FR-1.3 tab title: "{Page} · {App} — {Customer}".
 * The customer name lives in the DB (client-fetched), so the title is set here rather than via
 * metadata. On client navigations Next re-applies the static metadata title after our effect
 * (HANDOFF G-20), so we also watch <head> and re-assert the title whenever it drifts.
 */
export function TitleSync() {
  const pathname = usePathname();
  const { data } = useSettings();
  const t = useT();

  useEffect(() => {
    const app = t.appName;
    const page = t(pageTitleFor(pathname));
    const stored = data?.customerName?.trim();
    const customer = stored === "Guest" ? t("Guest") : stored;
    const desired = `${page === app ? page : `${page} · ${app}`}${customer ? ` — ${customer}` : ""}`;

    const apply = () => {
      if (document.title !== desired) document.title = desired;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, data?.customerName, t]);

  return null;
}
