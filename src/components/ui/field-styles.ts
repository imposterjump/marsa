/** Shared look for text-entry controls (Input, Textarea, Select trigger): RTA inputs, radius 10. */
export const fieldBase =
  "w-full min-w-0 rounded-[10px] border border-input bg-surface text-sm text-ink shadow-xs " +
  "transition-[border-color,box-shadow,background-color] duration-150 ease-out-quint outline-none " +
  "placeholder:text-ink-faint hover:border-ink-faint/70 " +
  "focus-visible:outline-none focus-visible:border-brand/70 focus-visible:ring-3 focus-visible:ring-brand/12 " +
  "disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-ink-muted disabled:shadow-none " +
  "aria-invalid:border-fail aria-invalid:ring-3 aria-invalid:ring-fail/15";
