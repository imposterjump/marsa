import { cn } from "cn";
import { FloatLoop } from "@/components/motion/float-loop";

interface EmptyStateProps {
  /** Illustration or icon (decorative). */
  art?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  size?: "md" | "lg";
}

export function EmptyState({
  art,
  title,
  description,
  actions,
  className,
  size = "md",
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        size === "lg" ? "gap-6 px-6 py-20" : "gap-5 px-6 py-14",
        className,
      )}
    >
      {art && (
        <FloatLoop>
          <div aria-hidden className="text-brand">
            {art}
          </div>
        </FloatLoop>
      )}
      <div className="flex max-w-md flex-col gap-2">
        <h3 className="font-heading text-lg font-semibold tracking-tight text-ink">{title}</h3>
        {description && <div className="leading-relaxed text-ink-muted">{description}</div>}
      </div>
      {actions && <div className="flex flex-wrap items-center justify-center gap-3">{actions}</div>}
    </div>
  );
}
