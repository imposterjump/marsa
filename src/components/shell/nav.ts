import { FolderKanban, Settings, ShieldCheck, type LucideIcon } from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Short hint shown in the collapsed-rail tooltip. */
  hint: string;
}

/** PRD FR-1.2: exactly three sidebar items. */
export const NAV_ITEMS: NavItem[] = [
  { href: "/projects", label: "Projects", icon: FolderKanban, hint: "Tenders, RFPs and proposals" },
  { href: "/standards", label: "Standards", icon: ShieldCheck, hint: "Your evaluation rules" },
  { href: "/settings", label: "Settings", icon: Settings, hint: "Profile, appearance and AI" },
];

/** Page titles for the browser tab (PRD FR-1.3) and breadcrumbs. */
export const PAGE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/projects/new", title: "New project" },
  { prefix: "/projects", title: "Projects" },
  { prefix: "/analysis", title: "AI analysis" },
  { prefix: "/standards", title: "Standards" },
  { prefix: "/settings", title: "Settings" },
  { prefix: "/vendor-portal", title: "Vendor simulator" },
  { prefix: "/dev/ui", title: "UI kit" },
];

export function pageTitleFor(pathname: string): string {
  return (
    PAGE_TITLES.find((p) => pathname === p.prefix || pathname.startsWith(`${p.prefix}/`))?.title ??
    "Marsa"
  );
}

export function isActive(pathname: string, href: string): boolean {
  // The AI analysis results page belongs to a project (P8).
  if (href === "/projects" && pathname.startsWith("/analysis/")) return true;
  return pathname === href || pathname.startsWith(`${href}/`);
}
