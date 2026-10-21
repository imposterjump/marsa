import { useId } from "react";
import { cn } from "cn";

/** Marsa logomark: a harbour arch over water, navy → teal. Decorative (the wordmark carries the name). */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0 drop-shadow-[0_1px_1px_rgb(11_27_43/0.15)]", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#13304d" />
          <stop offset="1" stopColor="#0e7c7b" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill={`url(#${id})`} />
      <path
        d="M8.5 19.5c2-6.2 5-9 7.5-9s5.5 2.8 7.5 9"
        fill="none"
        stroke="#fff"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M16 10.6v8.9" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
      <path
        d="M7.5 23.2c1.4-1.1 2.8-1.1 4.2 0s2.8 1.1 4.2 0 2.8-1.1 4.2 0 2.8 1.1 4.2 0"
        fill="none"
        stroke="#fff"
        strokeWidth="1.6"
        strokeLinecap="round"
        opacity="0.85"
      />
    </svg>
  );
}

export function Wordmark({
  appName = "Marsa",
  tagline = true,
}: {
  appName?: string;
  tagline?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span className="truncate font-heading text-[17px] font-bold tracking-tight text-ink">
        {appName}
      </span>
      {tagline && (
        <span className="mt-1 truncate text-2xs font-medium tracking-wide text-ink-muted">
          Procurement Intelligence
        </span>
      )}
    </span>
  );
}
