"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FlaskConical, KeyRound, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import { RtaLogo, TriangleMark, Wordmark } from "./brand-mark";
import { isActive, NAV_ITEMS } from "./nav";
import { AI_MODEL_LABEL } from "@/lib/labels";

/**
 * Desktop sidebar (≥ lg): the deep-ink rail of the RTA shell, the single standing dark element.
 * Width comes from --sidebar-w, toggled pre-paint via data-sidebar.
 */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      aria-label="Sidebar"
      className="sidebar-rail sticky top-0 hidden h-dvh shrink-0 flex-col bg-rail transition-[width] duration-200 ease-out-quint lg:flex"
      style={{ width: "var(--sidebar-w)" }}
    >
      <SidebarContent />
      <div className="px-3 pb-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={onToggle}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-expanded={!collapsed}
              className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-rail-muted transition-colors hover:bg-rail-raised hover:text-rail-ink focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none collapsed:justify-center collapsed:px-0"
            >
              {collapsed ? (
                <PanelLeftOpen className="size-[18px]" />
              ) : (
                <PanelLeftClose className="size-[18px]" />
              )}
              <span className="text-[13px] collapsed:hidden">Collapse</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="right" className={cn(!collapsed && "hidden")}>
            Expand sidebar
          </TooltipContent>
        </Tooltip>
      </div>
    </aside>
  );
}

/** Shared by the desktop rail and the mobile drawer. */
export function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const { data: settings } = useSettings();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-8 px-3 pt-6">
      <Link
        href="/projects"
        onClick={onNavigate}
        aria-label={`${settings?.appName ?? "Marsa"}: projects`}
        className="flex flex-col gap-4 rounded-lg px-2 py-1 focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:outline-none collapsed:items-center collapsed:px-0"
      >
        <RtaLogo tone="white" height={40} className="-ms-1 collapsed:hidden" />
        <TriangleMark size={30} className="hidden collapsed:block" />
        <span className="collapsed:hidden">
          <Wordmark appName={settings?.appName ?? "Marsa"} onDark />
        </span>
      </Link>

      <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
        <LiveNavLinks onNavigate={onNavigate} />
      </Suspense>

      <div className="mt-auto flex flex-col gap-3 pb-2">
        <AiModeChip />
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-sidebar-border px-3 py-1 text-[10px] font-bold tracking-[0.1em] text-rail-muted uppercase collapsed:hidden">
          <span aria-hidden className="size-1.5 rounded-full bg-rta" />
          PoC — Demo environment
        </span>
      </div>
    </div>
  );
}

function LiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

/** pathname = null while suspended (prerender of dynamic routes): no item is marked active. */
function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main navigation" className="flex flex-col gap-1">
      <span className="px-3 pb-2 text-2xs font-semibold tracking-[0.1em] text-rail-muted/70 uppercase collapsed:hidden">
        Workspace
      </span>
      {NAV_ITEMS.map((item) => {
        const active = pathname !== null && isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Tooltip key={item.href}>
            <TooltipTrigger asChild>
              <Link
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "group/nav relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium outline-none",
                  "transition-colors duration-150 focus-visible:ring-2 focus-visible:ring-ring/60",
                  "collapsed:justify-center collapsed:px-0",
                  active
                    ? "text-rail-ink"
                    : "text-rail-muted hover:bg-rail-raised hover:text-rail-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg bg-rail-raised"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  >
                    <span className="absolute inset-y-2 -start-3 w-[3px] rounded-e-full bg-rta collapsed:-start-3" />
                  </motion.span>
                )}
                <Icon
                  aria-hidden
                  className={cn(
                    "relative size-[18px] shrink-0 transition-colors",
                    active ? "text-[#ff5a47]" : "text-rail-muted group-hover/nav:text-rail-ink",
                  )}
                  strokeWidth={active ? 2.1 : 1.8}
                />
                <span className="relative collapsed:sr-only">{item.label}</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent
              side="right"
              className="hidden [[data-sidebar=collapsed]_&]:inline-flex"
            >
              <span className="font-medium">{item.label}</span>
              <span className="opacity-70">· {item.hint}</span>
            </TooltipContent>
          </Tooltip>
        );
      })}
    </nav>
  );
}

function AiModeChip() {
  const { data } = useSettings();
  if (!data) return <div className="h-14" />;
  const { aiMode, apiKeyConfigured } = data.runtime;
  const model = AI_MODEL_LABEL[data.aiModel] ?? data.aiModel;
  const state =
    aiMode === "mock"
      ? {
          icon: FlaskConical,
          title: "Demo AI",
          sub: "Mock mode · no credits used",
          tone: "text-[#7cb0f0]",
        }
      : apiKeyConfigured
        ? { icon: Sparkles, title: model, sub: "Live · Anthropic API", tone: "text-[#ff5a47]" }
        : {
            icon: KeyRound,
            title: "API key missing",
            sub: "Add ANTHROPIC_API_KEY to .env",
            tone: "text-[#f7b955]",
          };
  const Icon = state.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 rounded-[10px] border border-sidebar-border bg-rail-raised/60 px-3 py-2.5 collapsed:justify-center collapsed:border-transparent collapsed:bg-transparent collapsed:px-0">
          <Icon aria-hidden className={cn("size-4 shrink-0", state.tone)} />
          <span className="flex min-w-0 flex-col leading-tight collapsed:sr-only">
            <span className="truncate text-xs font-semibold text-rail-ink">{state.title}</span>
            <span className="truncate text-2xs text-rail-muted">{state.sub}</span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="hidden [[data-sidebar=collapsed]_&]:inline-flex">
        {state.title} · {state.sub}
      </TooltipContent>
    </Tooltip>
  );
}
