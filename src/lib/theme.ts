import type { Theme } from "./domain";

export const THEME_STORAGE_KEY = "marsa-theme";
export const SIDEBAR_STORAGE_KEY = "marsa-sidebar";

/**
 * Runs synchronously in <head> before first paint (Next docs: preventing flash before
 * hydration). Applies the saved theme (`.dark` + data-theme) and sidebar state
 * (data-sidebar) so the server-rendered HTML never flashes. Inlined as a string — keep tiny.
 */
export const bootScript = `(function(){var e=document.documentElement;try{var t=localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme: dark)").matches);e.classList.toggle("dark",d);e.dataset.theme=d?"dark":"light";e.dataset.themePref=t;if(localStorage.getItem(${JSON.stringify(SIDEBAR_STORAGE_KEY)})==="collapsed")e.dataset.sidebar="collapsed"}catch(_){}})()`;

export function resolveTheme(pref: Theme): "light" | "dark" {
  if (pref !== "system") return pref;
  return typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

/** Apply a theme preference to <html> without animating every colour transition. */
export function applyTheme(pref: Theme): "light" | "dark" {
  const resolved = resolveTheme(pref);
  const root = document.documentElement;
  // Briefly disable transitions so the whole UI switches in one frame (no colour "wave").
  const style = document.createElement("style");
  style.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(style);
  root.classList.toggle("dark", resolved === "dark");
  root.dataset.theme = resolved;
  root.dataset.themePref = pref;
  void window.getComputedStyle(document.body).opacity; // force reflow
  requestAnimationFrame(() => style.remove());
  return resolved;
}

export function setSidebarCollapsed(collapsed: boolean) {
  const root = document.documentElement;
  if (collapsed) root.dataset.sidebar = "collapsed";
  else delete root.dataset.sidebar;
  try {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, collapsed ? "collapsed" : "expanded");
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new CustomEvent("marsa:sidebar", { detail: collapsed }));
}
