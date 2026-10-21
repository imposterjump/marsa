import { cn } from "cn";
import { hashIndex, initials } from "@/lib/format";

/** Avatar tints — soft fill + strong text, readable in both themes. */
const TINTS = [
  "bg-brand-soft text-brand-ink",
  "bg-info-soft text-info",
  "bg-partial-soft text-partial",
  "bg-[color-mix(in_oklab,var(--chart-5)_16%,transparent)] text-[color-mix(in_oklab,var(--chart-5)_85%,var(--ink))]",
  "bg-[color-mix(in_oklab,var(--chart-2)_16%,transparent)] text-[color-mix(in_oklab,var(--chart-2)_85%,var(--ink))]",
  "bg-surface-muted text-ink-2",
] as const;

const SIZES = {
  xs: "size-6 text-2xs rounded-md",
  sm: "size-8 text-xs rounded-lg",
  md: "size-10 text-sm rounded-lg",
  lg: "size-12 text-base rounded-xl",
};

interface InitialsAvatarProps {
  name: string;
  size?: keyof typeof SIZES;
  /** Override the deterministic tint (0–5). */
  tint?: number;
  className?: string;
}

/** Deterministic, initials-based avatar for vendors and the customer profile. */
export function InitialsAvatar({ name, size = "md", tint, className }: InitialsAvatarProps) {
  const t = TINTS[tint ?? hashIndex(name, TINTS.length)];
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center font-semibold tracking-tight select-none",
        SIZES[size],
        t,
        className,
      )}
    >
      {initials(name)}
    </span>
  );
}
