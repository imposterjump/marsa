"use client";

import Link from "next/link";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { FlaskConical, KeyRound, PanelLeftClose, PanelLeftOpen, Sparkles } from "lucide-react";
import { cn } from "cn";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useSettings } from "@/hooks/use-settings";
import { BrandMark, Wordmark } from "./brand-mark";
import { isActive, NAV_ITEMS } from "./nav";

/** Desktop sidebar (≥ lg). Width comes from --sidebar-w, toggled pre-paint via data-sidebar. */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  return (
    <aside
      aria-label="Sidebar"
      className="sidebar-rail sticky top-0 hidden h-dvh shrink-0 flex-col transition-[width] duration-200 ease-out-quint lg:flex"
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
              className="flex h-9 w-full items-center gap-3 rounded-lg px-3 text-ink-muted transition-colors hover:bg-sidebar-accent hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none collapsed:justify-center collapsed:px-0"
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
    <div className="flex min-h-0 flex-1 flex-col gap-8 px-3 pt-5">
      <Link
        href="/projects"
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-lg px-2 py-1 focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none collapsed:justify-center collapsed:px-0"
      >
        <BrandMark size={34} />
        <span className="collapsed:hidden">
          <Wordmark appName={settings?.appName ?? "Marsa"} />
        </span>
      </Link>

      <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
        <LiveNavLinks onNavigate={onNavigate} />
      </Suspense>

      <div className="mt-auto flex flex-col gap-3 pb-2">
        <AiModeChip />
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
      <span className="px-3 pb-2 text-2xs font-semibold tracking-[0.08em] text-ink-faint uppercase collapsed:hidden">
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
                  "transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/25",
                  "collapsed:justify-center collapsed:px-0",
                  active ? "text-ink" : "text-ink-2 hover:bg-sidebar-accent hover:text-ink",
                )}
              >
                {active && (
                  <motion.span
                    layoutId="nav-active"
                    className="absolute inset-0 rounded-lg border border-border bg-surface shadow-xs"
                    transition={{ type: "spring", stiffness: 420, damping: 36 }}
                  >
                    <span className="absolute inset-y-2.5 -start-3 w-[3px] rounded-e-full bg-brand collapsed:-start-3" />
                  </motion.span>
                )}
                <Icon
                  aria-hidden
                  className={cn(
                    "relative size-[18px] shrink-0 transition-colors",
                    active ? "text-brand" : "text-ink-muted group-hover/nav:text-ink-2",
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
  const model = data.aiModel === "claude-opus-5-5" ? "Claude Opus 5.5" : "Claude Sonnet 5.5";
  const state =
    aiMode === "mock"
      ? {
          icon: FlaskConical,
          title: "Demo AI",
          sub: "Mock mode · no credits used",
          tone: "text-info",
        }
      : apiKeyConfigured
        ? { icon: Sparkles, title: model, sub: "Live · Anthropic API", tone: "text-brand" }
        : {
            icon: KeyRound,
            title: "API key missing",
            sub: "Add ANTHROPIC_API_KEY to .env",
            tone: "text-partial",
          };
  const Icon = state.icon;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="flex items-center gap-3 rounded-lg border border-border/70 bg-surface/60 px-3 py-2.5 collapsed:justify-center collapsed:border-transparent collapsed:bg-transparent collapsed:px-0">
          <Icon aria-hidden className={cn("size-4 shrink-0", state.tone)} />
          <span className="flex min-w-0 flex-col leading-tight collapsed:sr-only">
            <span className="truncate text-xs font-semibold text-ink">{state.title}</span>
            <span className="truncate text-2xs text-ink-muted">{state.sub}</span>
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="right" className="hidden [[data-sidebar=collapsed]_&]:inline-flex">
        {state.title} · {state.sub}
      </TooltipContent>
    </Tooltip>
  );
}
