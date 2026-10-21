"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import type { Theme } from "@/lib/domain";
import { applyTheme, THEME_STORAGE_KEY } from "@/lib/theme";

interface ThemeContextValue {
  /** The user's preference: light, dark or follow the OS. */
  theme: Theme;
  /** What is actually on screen right now. */
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_EVENT = "marsa:theme";

// The boot script writes data-theme / data-theme-pref on <html> before paint; those
// attributes are the external store React subscribes to.
const subscribe = (cb: () => void) => {
  window.addEventListener(THEME_EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(THEME_EVENT, cb);
    window.removeEventListener("storage", cb);
  };
};
const readPref = (): Theme => {
  const v = document.documentElement.dataset.themePref;
  return v === "light" || v === "dark" ? v : "system";
};
const readResolved = (): "light" | "dark" =>
  document.documentElement.dataset.theme === "dark" ? "dark" : "light";

export function ThemeProvider({ children }: { children: ReactNode }) {
  const theme = useSyncExternalStore(subscribe, readPref, () => "system" as Theme);
  const resolvedTheme = useSyncExternalStore(subscribe, readResolved, () => "light" as const);

  const setTheme = useCallback((next: Theme) => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      /* storage unavailable (private mode): theme still applies for this session */
    }
    applyTheme(next);
    window.dispatchEvent(new Event(THEME_EVENT));
  }, []);

  // Follow OS changes while the preference is "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      applyTheme("system");
      window.dispatchEvent(new Event(THEME_EVENT));
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>");
  return ctx;
}
