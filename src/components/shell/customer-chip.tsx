"use client";

import Link from "next/link";
import { ChevronDown, Settings, UserPen } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useSettings } from "@/hooks/use-settings";
import { useShell } from "./shell-context";

/** PRD FR-1.3: the customer's name and organization in the header. */
export function CustomerChip() {
  const t = useT();
  const { data } = useSettings();
  const { openProfile } = useShell();

  if (!data) return <Skeleton className="h-10 w-40 rounded-lg" />;
  // "Guest" is stored when the welcome is skipped: shown in the reader's language.
  const name = !data.customerName || data.customerName === "Guest" ? t("Guest") : data.customerName;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="group/chip flex h-10 max-w-64 items-center gap-2.5 rounded-lg ps-1 pe-2 transition-colors outline-none hover:bg-surface-muted focus-visible:ring-3 focus-visible:ring-ring/25 aria-expanded:bg-surface-muted"
          aria-label={
            data.organization
              ? t("Account: {name}, {organization}", { name, organization: data.organization })
              : t("Account: {name}", { name })
          }
        >
          <InitialsAvatar name={name} size="sm" tint={0} />
          <span className="hidden min-w-0 flex-col text-start leading-tight sm:flex">
            <span className="truncate text-[13px] font-semibold text-ink" dir="auto">
              {name}
            </span>
            {data.organization && (
              <span className="truncate text-2xs text-ink-muted" dir="auto">
                {data.organization}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden
            className="size-3.5 shrink-0 text-ink-faint transition-transform group-aria-expanded/chip:rotate-180"
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="flex flex-col gap-0.5 py-2">
          <span className="truncate text-sm font-semibold text-ink" dir="auto">
            {name}
          </span>
          <span className="truncate text-xs font-normal text-ink-muted" dir="auto">
            {data.organization || t("No organization set")}
          </span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={openProfile} className="gap-2.5">
          <UserPen className="size-4 text-ink-muted" aria-hidden /> {t("Edit profile")}
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="gap-2.5">
          <Link href="/settings">
            <Settings className="size-4 text-ink-muted" aria-hidden /> {t("Settings")}
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
