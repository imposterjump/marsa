"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerChip } from "./customer-chip";
import { pageTitleFor } from "./nav";
import { ThemeToggle } from "./theme-toggle";

export function Topbar({ onOpenMenu }: { onOpenMenu: () => void }) {
  const pathname = usePathname();
  const section = pathname.split("/")[1] ?? "";
  const title = pageTitleFor(pathname);
  const sectionTitle = pageTitleFor(`/${section}`);

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center gap-3 border-b border-border/70 bg-background/80 px-4 backdrop-blur-md sm:px-6 lg:rounded-t-2xl lg:px-8">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={onOpenMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="min-w-0 flex-1">
        <ol className="flex min-w-0 items-center gap-1.5 text-sm">
          {sectionTitle !== title ? (
            <>
              <li className="shrink-0">
                <Link
                  href={`/${section}`}
                  className="rounded-md px-1 text-ink-muted transition-colors hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
                >
                  {sectionTitle}
                </Link>
              </li>
              <ChevronRight aria-hidden className="size-3.5 shrink-0 text-ink-faint" />
              <li className="truncate font-medium text-ink" aria-current="page">
                {title}
              </li>
            </>
          ) : (
            <li className="truncate px-1 font-medium text-ink" aria-current="page">
              {title}
            </li>
          )}
        </ol>
      </nav>

      {/* Run-status pill slot (P7.3) */}
      <div id="run-pill-slot" className="hidden" />

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <span aria-hidden className="mx-1.5 h-6 w-px bg-border" />
        <CustomerChip />
      </div>
    </header>
  );
}
