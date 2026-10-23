"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useBreadcrumbContext, type Crumb } from "./breadcrumbs";
import { CustomerChip } from "./customer-chip";
import { pageTitleFor } from "./nav";
import { RunPill } from "./run-pill";
import { ThemeToggle } from "./theme-toggle";

/** Static trail from the URL: "/standards" → Standards; "/projects/new" → Projects › New project. */
function staticCrumbs(pathname: string): Crumb[] {
  const section = `/${pathname.split("/")[1] ?? ""}`;
  const sectionTitle = pageTitleFor(section);
  const title = pageTitleFor(pathname);
  return sectionTitle === title
    ? [{ label: title }]
    : [{ label: sectionTitle, href: section }, { label: title }];
}

function LiveTrail() {
  const pathname = usePathname();
  const { crumbs } = useBreadcrumbContext();
  return <Trail trail={crumbs ?? staticCrumbs(pathname)} />;
}

function Trail({ trail }: { trail: Crumb[] }) {
  return (
    <ol className="flex min-w-0 items-center gap-1.5 text-sm">
      {trail.map((c, i) => {
        const last = i === trail.length - 1;
        return (
          <li
            key={`${i}-${c.label}`}
            className={last ? "min-w-0 truncate" : "flex shrink-0 items-center gap-1.5"}
          >
            {last || !c.href ? (
              <span
                className="px-1 font-medium text-ink"
                aria-current={last ? "page" : undefined}
                dir="auto"
              >
                {c.label}
              </span>
            ) : (
              <>
                <Link
                  href={c.href}
                  className="rounded-md px-1 text-ink-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
                >
                  {c.label}
                </Link>
                <ChevronRight aria-hidden className="size-3.5 text-ink-faint" />
              </>
            )}
          </li>
        );
      })}
    </ol>
  );
}

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md sm:px-6 lg:px-10">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Clipped: on a phone the trail ran under the run pill. */}
      <nav aria-label="Breadcrumb" className="min-w-0 flex-1 overflow-hidden">
        <Suspense fallback={<Trail trail={[]} />}>
          <LiveTrail />
        </Suspense>
      </nav>

      <RunPill />

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <span aria-hidden className="mx-1.5 h-6 w-px bg-border" />
        <CustomerChip />
      </div>
    </header>
  );
}
