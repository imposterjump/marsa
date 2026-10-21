import { cn } from "cn";

export function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
  return (
    <kbd
      data-slot="kbd"
      className={cn(
        "inline-flex h-5 min-w-5 items-center justify-center rounded-[5px] border border-border-strong/80 bg-surface px-1.5",
        "font-mono text-[11px] font-medium text-ink-2 shadow-[0_1px_0_var(--border-strong)]",
        className,
      )}
      {...props}
    />
  );
}
