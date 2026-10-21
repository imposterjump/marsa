"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSidebarCollapsed } from "@/hooks/use-client-store";
import { usePathname } from "next/navigation";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useSettings } from "@/hooks/use-settings";
import { setSidebarCollapsed } from "@/lib/theme";
import { ProfileDialog } from "./profile-dialog";
import { BreadcrumbProvider } from "./breadcrumbs";
import { ShellContext } from "./shell-context";
import { Sidebar, SidebarContent } from "./sidebar";
import { TitleSync } from "./title-sync";
import { Topbar } from "./topbar";

/**
 * App frame (RDD §9.2 layout): sidebar on the frame colour, main content in an inset,
 * rounded panel that owns its own scroll on desktop.
 */
/**
 * usePathname() suspends on routes with unknown dynamic params under cacheComponents (and the
 * build fails if nothing catches it), so every pathname reader in the shell sits in its own
 * small Suspense boundary (HANDOFF G-35).
 */
const hashTarget = () =>
  window.location.hash
    ? document.getElementById(decodeURIComponent(window.location.hash.slice(1)))
    : null;

function ScrollReset() {
  const pathname = usePathname();
  const first = useRef(true);
  // The content panel scrolls itself on desktop: reset it on client navigations, but not on the
  // first load. A #section in the URL is honoured either way (the panel, not the window, scrolls).
  useEffect(() => {
    const target = hashTarget();
    if (first.current) {
      first.current = false;
      target?.scrollIntoView();
      return;
    }
    if (target) target.scrollIntoView();
    else document.getElementById("app-scroll")?.scrollTo({ top: 0 });
  }, [pathname]);
  return null;
}

export function AppShell({ children }: { children: React.ReactNode }) {
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

  const showWelcome = settings ? !settings.onboarded : false;

  return (
    <ShellContext.Provider value={{ openProfile: () => setProfileOpen(true) }}>
      <BreadcrumbProvider>
        <Suspense fallback={null}>
          <TitleSync />
          <ScrollReset />
        </Suspense>
        <a
          href="#main"
          className="sr-only z-50 rounded-lg bg-surface px-4 py-2 font-medium text-ink shadow-md focus:not-sr-only focus:fixed focus:start-4 focus:top-4"
        >
          Skip to content
        </a>
        <div className="relative flex min-h-dvh bg-frame lg:h-dvh lg:overflow-hidden">
          <Sidebar collapsed={collapsed} onToggle={toggle} />

          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetContent side="left" className="w-[280px] bg-frame p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="flex h-full flex-col pb-4">
                <SidebarContent onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex min-w-0 flex-1 flex-col lg:min-h-0 lg:py-2 lg:pe-2">
            {/* relative: the panel is the containing block of absolutely positioned descendants
                (e.g. the hidden inputs Radix radio groups render inside forms). Otherwise they are
                placed against the page and make it taller than the window (HANDOFF G-70). */}
            <div
              id="app-scroll"
              className="relative flex min-h-dvh flex-1 flex-col bg-background lg:min-h-0 lg:overflow-y-auto lg:overscroll-none lg:rounded-2xl lg:border lg:border-border lg:shadow-xs"
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
      </BreadcrumbProvider>
    </ShellContext.Provider>
  );
}
