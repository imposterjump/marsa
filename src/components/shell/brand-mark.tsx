/* eslint-disable @next/next/no-img-element -- static brand assets from public/brand */
import { useId } from "react";
import { cn } from "cn";

/**
 * Brand marks (RTA PoC Design System §01): the RTA lockup, never distorted or recoloured, and the
 * red triangle as the compact mark (collapsed sidebar, small dialogs). Decorative where the
 * product name is written next to it.
 */
export function TriangleMark({ size = 28, className }: { size?: number; className?: string }) {
  // Unique per instance: a gradient defined in a hidden copy (collapsed-rail mark) renders nothing.
  const id = useId();
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      aria-hidden
      className={cn("shrink-0", className)}
    >
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#ec1c24" />
          <stop offset="1" stopColor="#ff5a47" />
        </linearGradient>
      </defs>
      <path d="M29 4 3 16.5 29 28Z" fill={`url(#${id})`} />
    </svg>
  );
}

/** Kept for the profile / welcome dialog: the triangle mark on a light tile. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-[10px] bg-rail",
        className,
      )}
      style={{ width: size, height: size }}
    >
      <TriangleMark size={Math.round(size * 0.62)} />
    </span>
  );
}

/** Full RTA lockup: white on the deep-ink sidebar and dark bands, colour on light surfaces. */
export function RtaLogo({
  tone = "white",
  height = 40,
  className,
}: {
  tone?: "white" | "color";
  height?: number;
  className?: string;
}) {
  return (
    <img
      src={tone === "white" ? "/brand/rta-logo-white.png" : "/brand/rta-logo-color.png"}
      alt="RTA — Roads & Transport Authority"
      height={height}
      style={{ height, width: "auto" }}
      className={cn("block shrink-0 select-none", className)}
      draggable={false}
    />
  );
}

export function Wordmark({
  appName = "Marsa",
  tagline = true,
  onDark = false,
}: {
  appName?: string;
  tagline?: boolean;
  onDark?: boolean;
}) {
  return (
    <span className="flex min-w-0 flex-col leading-none">
      <span
        className={cn(
          "truncate font-heading text-[17px] font-semibold tracking-tight",
          onDark ? "text-rail-ink" : "text-ink",
        )}
      >
        {appName}
      </span>
      {tagline && (
        <span
          className={cn(
            "mt-1 truncate text-2xs font-medium tracking-wide",
            onDark ? "text-rail-muted" : "text-ink-muted",
          )}
        >
          Procurement Intelligence
        </span>
      )}
    </span>
  );
}
