import { cn } from "cn";

interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Small label above the title (e.g. a project reference). */
  eyebrow?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function PageHeader({ title, description, eyebrow, actions, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between sm:gap-8",
        className,
      )}
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        {eyebrow && (
          <div className="text-2xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
            {eyebrow}
          </div>
        )}
        <h1 className="font-heading text-[28px] leading-tight font-semibold tracking-tight text-balance text-ink">
          {title}
        </h1>
        {description && (
          <p className="max-w-2xl leading-relaxed text-pretty text-ink-muted">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </header>
  );
}
