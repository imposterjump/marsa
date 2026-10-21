import { cn } from "cn";
import { CountUp } from "@/components/motion/count-up";

interface StatTileProps {
  label: string;
  value: number;
  suffix?: string;
  decimals?: number;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}

/** Compact KPI tile: label, large number (counts up), short context line. */
export function StatTile({ label, value, suffix, decimals, hint, icon, className }: StatTileProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border border-border bg-surface/80 p-5 shadow-xs backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium text-ink-muted">{label}</span>
        {icon && (
          <span aria-hidden className="text-ink-faint [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <span className="font-heading text-[28px] leading-none font-semibold tracking-tight text-ink">
        <CountUp value={value} suffix={suffix} decimals={decimals} />
      </span>
      {hint && <span className="text-xs text-ink-muted">{hint}</span>}
    </div>
  );
}
