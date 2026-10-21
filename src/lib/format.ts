/** Display formatting helpers. Dates are stored as ISO strings (UTC). */

const dateFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
});
const dateTimeFmt = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const formatDate = (iso: string) => dateFmt.format(new Date(iso));
export const formatDateTime = (iso: string) => dateTimeFmt.format(new Date(iso));

export function formatPercent(value: number, decimals = 0): string {
  return `${value.toFixed(decimals)}%`;
}

/** "Layla Mansour" → "LM"; "أحمد حسن" → "أح"; "Port Authority" → "PA". */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const firstName = (name: string) => name.trim().split(/\s+/)[0] ?? "";

/** Time-of-day greeting in the browser's local time. */
export function greeting(date = new Date()): string {
  const h = date.getHours();
  if (h < 5) return "Good evening";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/** Stable hash → index, used for deterministic avatar tints. */
export function hashIndex(input: string, modulo: number): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) h = (h * 31 + input.charCodeAt(i)) | 0;
  return Math.abs(h) % modulo;
}

const DAY = 86_400_000;

/** Whole days from today (local) to a YYYY-MM-DD date; negative when past. */
export function daysUntil(dateYmd: string, today = new Date()): number {
  const [y, m, d] = dateYmd.split("-").map(Number);
  const target = Date.UTC(y, m - 1, d);
  const base = Date.UTC(today.getFullYear(), today.getMonth(), today.getDate());
  return Math.round((target - base) / DAY);
}

/** "Closes today" · "Closes tomorrow" · "Closes in 40 days" · "Closed 3 days ago". */
export function deadlineLabel(dateYmd: string, today = new Date()): string {
  const n = daysUntil(dateYmd, today);
  if (n === 0) return "Closes today";
  if (n === 1) return "Closes tomorrow";
  if (n > 1) return `Closes in ${n} days`;
  if (n === -1) return "Closed yesterday";
  return `Closed ${-n} days ago`;
}

/** Format a YYYY-MM-DD date without timezone shifts: "30 Nov 2026". */
export function formatYmd(dateYmd: string): string {
  const [y, m, d] = dateYmd.split("-").map(Number);
  return new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(
    new Date(Date.UTC(y, m - 1, d)),
  );
}
