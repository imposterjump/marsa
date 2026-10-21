import { Pill } from "@/components/ui/status-pill";

export function Section({
  id,
  title,
  description,
  aside,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  /** Right side of the section header (e.g. a "Saved" indicator). */
  aside?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`settings-${id}`}
      aria-labelledby={`settings-${id}-title`}
      className="scroll-mt-24 rounded-xl border border-border bg-surface shadow-xs"
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 px-6 py-5">
        <div className="flex flex-col gap-1">
          <h2
            id={`settings-${id}-title`}
            className="font-heading text-base font-semibold tracking-tight text-ink"
          >
            {title}
          </h2>
          {description && <p className="text-[13px] text-ink-muted">{description}</p>}
        </div>
        {aside}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

export function PhaseNote({ phase, text }: { phase: number; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-muted/70 px-4 py-3 text-[13px] text-ink-2">
      <Pill tone="neutral" size="sm">
        Phase {phase}
      </Pill>
      <span className="leading-relaxed">{text}</span>
    </div>
  );
}

/** Small inline save status for auto-saving sections. */
export function SaveStatus({ pending, saved }: { pending: boolean; saved: boolean }) {
  if (!pending && !saved) return null;
  return (
    <span className="shrink-0 text-xs text-ink-muted" aria-live="polite">
      {pending ? "Saving…" : "Saved ✓"}
    </span>
  );
}
