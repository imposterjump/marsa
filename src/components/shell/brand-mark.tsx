/* eslint-disable @next/next/no-img-element -- static brand asset from public/brand */
import { cn } from "cn";
import { useT } from "@/components/i18n-provider";
import { APP_NAME, APP_TAGLINE } from "@/lib/brand";

/**
 * The brand mark (user, 2026-10-23: the Sharjah emblem replaces the RTA logo): the emblem as a
 * round badge, never distorted or recoloured. Large in the sidebar, small on the collapsed rail
 * and in dialogs. Decorative where the product name is written next to it.
 */
export function Emblem({
  size = 40,
  className,
  decorative = false,
}: {
  size?: number;
  className?: string;
  decorative?: boolean;
}) {
  const t = useT();
  return (
    <img
      src="/brand/sharjah-emblem.png"
      alt={decorative ? "" : t("Emblem of Sharjah")}
      aria-hidden={decorative || undefined}
      width={size}
      height={size}
      style={{ width: size, height: size }}
      className={cn("block shrink-0 rounded-full select-none", className)}
      draggable={false}
    />
  );
}

/** The emblem for the profile / welcome dialog. */
export function BrandMark({ size = 32, className }: { size?: number; className?: string }) {
  return <Emblem size={size} className={className} decorative />;
}

export function Wordmark({
  appName = APP_NAME,
  tagline = true,
  onDark = false,
}: {
  appName?: string;
  tagline?: boolean;
  onDark?: boolean;
}) {
  const t = useT();
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
          {t(APP_TAGLINE)}
        </span>
      )}
    </span>
  );
}
