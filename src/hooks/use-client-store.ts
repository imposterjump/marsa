"use client";

import { useSyncExternalStore } from "react";
import { greeting } from "@/lib/format";

/**
 * Client-only values read through useSyncExternalStore: the server snapshot is used for
 * SSR + hydration, then React re-renders with the browser value — no hydration mismatch and
 * no setState-in-effect (react-hooks/set-state-in-effect).
 */

const subscribeEvent = (event: string) => (cb: () => void) => {
  window.addEventListener(event, cb);
  return () => window.removeEventListener(event, cb);
};

const noopSubscribe = () => () => {};
const subscribeSidebar = subscribeEvent("marsa:sidebar");

/** Desktop sidebar collapsed? Source of truth: <html data-sidebar>, changed via "marsa:sidebar". */
export function useSidebarCollapsed(): boolean {
  return useSyncExternalStore(
    subscribeSidebar,
    () => document.documentElement.dataset.sidebar === "collapsed",
    () => false,
  );
}

/** Time-of-day greeting in the viewer's local time; null during SSR/hydration. */
export function useGreeting(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => greeting(),
    () => null,
  );
}

const longDate = new Intl.DateTimeFormat("en-GB", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
});

/** Today's date (local), e.g. "Wednesday, 21 October 2026"; null during SSR/hydration. */
export function useToday(): string | null {
  return useSyncExternalStore(
    noopSubscribe,
    () => longDate.format(new Date()),
    () => null,
  );
}
