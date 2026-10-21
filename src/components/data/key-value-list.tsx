import { cn } from "cn";

export interface KeyValueItem {
  label: string;
  value: React.ReactNode;
  /** Highlight a value the committee should notice (e.g. "excludes VAT"). */
  emphasis?: boolean;
}

export function KeyValueList({
  items,
  columns = 1,
  className,
}: {
  items: KeyValueItem[];
  columns?: 1 | 2;
  className?: string;
}) {
  return (
    <dl
      className={cn(
        "grid gap-x-8",
        columns === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1",
        className,
      )}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-baseline justify-between gap-4 border-b border-border/70 py-3 last:border-b-0"
        >
          <dt className="shrink-0 text-ink-muted">{item.label}</dt>
          <dd
            className={cn(
              "text-end font-medium text-ink",
              item.emphasis && "rounded-md bg-partial-soft px-1.5 text-partial",
            )}
          >
            {item.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}
