import { FolderKanban, Settings, ShieldCheck, type LucideIcon } from "lucide-react";
import { APP_NAME } from "@/lib/brand";
import { msg } from "@/lib/i18n/core";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short hint shown in the collapsed-rail tooltip. */
  hint: string;
}

/** PRD FR-1.2: exactly three sidebar items. */
export const NAV_ITEMS: NavItem[] = [
  {
    href: "/projects",
    label: msg("Projects"),
    icon: FolderKanban,
    hint: msg("Tenders, RFPs and proposals"),
  },
  {
    href: "/standards",
    label: msg("Standards"),
    icon: ShieldCheck,
    hint: msg("Your evaluation rules"),
  },
  {
    href: "/settings",
    label: msg("Settings"),
    icon: Settings,
    hint: msg("Profile, appearance and AI"),
  },
];

/** Page titles for the browser tab (PRD FR-1.3) and breadcrumbs; shown through t(). */
export const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/projects/new", title: msg("New project") },
  { prefix: "/projects", title: msg("Projects") },
  { prefix: "/analysis", title: msg("AI analysis") },
  { prefix: "/standards", title: msg("Standards") },
  { prefix: "/settings", title: msg("Settings") },
  { prefix: "/vendor-portal", title: msg("Vendor simulator") },
  { prefix: "/dev/ui", title: msg("UI kit") },
];

export function pageTitleFor(pathname: string): string {
  return (
    PAGE_TITLES.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`))?.title ??
    APP_NAME
  );
}

export function isActive(pathname: string, href: string): boolean {
  // The AI analysis results page belongs to a project (P8).
  if (href === "/projects" && pathname.startsWith("/analysis/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
