"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { useSettings } from "@/hooks/use-settings";
import { pageTitleFor } from "./nav";
import { APP_NAME } from "@/lib/brand";

/**
 * PRD FR-1.3 tab title: "{Page} · {App} — {Customer}".
 * The customer name lives in the DB (client-fetched), so the title is set here rather than via
 * metadata. On client navigations Next re-applies the static metadata title after our effect
 * (HANDOFF G-20), so we also watch <head> and re-assert the title whenever it drifts.
 */
export function TitleSync() {
  const pathname = usePathname();
  const { data } = useSettings();

  useEffect(() => {
    const app = APP_NAME;
    const page = pageTitleFor(pathname);
    const customer = data?.customerName?.trim();
    const desired = `${page === app ? page : `${page} · ${app}`}${customer ? ` — ${customer}` : ""}`;

    const apply = () => {
      if (document.title !== desired) document.title = desired;
    };
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.head, { subtree: true, childList: true, characterData: true });
    return () => observer.disconnect();
  }, [pathname, data?.customerName]);

  return null;
}
