/** Shared look for text-entry controls (Input, Textarea, Select trigger) — Harbor spec. */
export const fieldBase =
  "w-full min-w-0 rounded-md border border-input bg-surface text-sm text-ink shadow-xs " +
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out-quint outline-none " +
  "placeholder:text-ink-faint hover:border-ink-faint/70 " +
  "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-3 focus-visible:ring-brand/15 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted disabled:shadow-none " +
  "aria-invalid:border-fail aria-invalid:ring-3 aria-invalid:ring-fail/15";
