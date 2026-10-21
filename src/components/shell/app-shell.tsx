"use client";

import { useCallback, useEffect, useState } from "react";
import { useSidebarCollapsed } from "@/hooks/use-client-store";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";
import { setSidebarCollapsed } from "@/lib/theme";
import { ProfileDialog } from "./profile-dialog";
import { ShellContext } from "./shell-context";
import { Sidebar, SidebarContent } from "./sidebar";
import { TitleSync } from "./title-sync";
import { Topbar } from "./topbar";

/**
 * App frame (RDD §9.2 layout): sidebar on the frame colour, main content in an inset,
 * rounded panel that owns its own scroll on desktop.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { data: settings } = useSettings();
  const collapsed = useSidebarCollapsed();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // <html data-sidebar> (set pre-paint by the boot script) is the source of truth.
  const toggle = useCallback(() => {
    setSidebarCollapsed(document.documentElement.dataset.sidebar !== "collapsed");
  }, []);

  // Keyboard: Ctrl/⌘ + B toggles the sidebar (shown in the UI kit shortcuts).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "b" && !e.altKey) {
        e.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle]);

  // The content panel scrolls itself on desktop, so reset it on navigation.
  // (The mobile drawer closes itself via SidebarContent's onNavigate.)
  useEffect(() => {
    document.getElementById("app-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);

  const showWelcome = settings ? !settings.onboarded : false;

  return (
    <ShellContext.Provider value={{ openProfile: () => setProfileOpen(true) }}>
      <TitleSync />
      <a
        href="#main"
        className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-medium text-ink shadow-md focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="flex min-h-dvh bg-frame">
        <Sidebar collapsed={collapsed} onToggle={toggle} />

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetContent side="left" className="w-[280px] bg-frame p-0">
            <SheetTitle className="sr-only">Navigation</SheetTitle>
            <div className="flex h-full flex-col pb-4">
              <SidebarContent onNavigate={() => setMobileOpen(false)} />
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col lg:py-2 lg:pe-2">
          <div
            id="app-scroll"
            className="flex min-h-dvh flex-1 flex-col bg-background lg:h-[calc(100dvh-1rem)] lg:min-h-0 lg:overflow-y-auto lg:rounded-2xl lg:border lg:border-border lg:shadow-xs"
          >
            <Topbar onOpenMenu={() => setMobileOpen(true)} />
            <main
              id="main"
              tabIndex={-1}
              className="flex-1 px-4 py-8 outline-none sm:px-6 lg:px-10 lg:py-10"
            >
              <div className="mx-auto w-full max-w-[1280px]">{children}</div>
            </main>
          </div>
        </div>
      </div>

      {settings && (
        <ProfileDialog
          mode={showWelcome ? "welcome" : "edit"}
          open={showWelcome || profileOpen}
          onOpenChange={setProfileOpen}
          settings={settings}
        />
      )}
    </ShellContext.Provider>
  );
}
