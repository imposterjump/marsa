import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "cn";
import { Slot } from "radix-ui";
import { Loader2Icon } from "lucide-react";

const buttonVariants = cva(
  [
    "group/button relative inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-transparent",
    "bg-clip-padding text-sm font-medium whitespace-nowrap select-none outline-none",
    "transition-[background-color,border-color,color,box-shadow,transform] duration-150 ease-out-quint",
    "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring/60",
    "active:not-aria-[haspopup]:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        /** Main call to action — one per view: the RTA gradient with a soft red bloom. */
        default:
          "bg-brand bg-rta font-semibold text-on-brand shadow-[0_6px_16px_-6px_rgb(236_28_36/0.55)] hover:shadow-[0_10px_24px_-8px_rgb(236_28_36/0.6)] hover:brightness-[1.04] active:bg-brand-hover active:bg-none [&_svg]:text-on-brand/90",
        /** Neutral action on a surface. */
        secondary:
          "border-border-strong/80 bg-surface text-ink shadow-xs hover:border-border-strong hover:bg-surface-muted",
        /** Secondary brand action (RTA "Export data"): red outline. */
        brand:
          "border-brand/45 bg-surface text-brand-ink hover:border-brand hover:bg-brand-soft aria-expanded:bg-brand-soft",
        outline:
          "border-border-strong bg-transparent text-ink hover:bg-surface-muted aria-expanded:bg-surface-muted",
        ghost:
          "text-ink-2 hover:bg-surface-muted hover:text-ink aria-expanded:bg-surface-muted aria-expanded:text-ink",
        /** Tinted brand action (e.g. "Simulate vendor submissions"). */
        soft: "bg-brand-soft text-brand-ink hover:bg-brand-soft/70",
        destructive:
          "bg-fail text-white shadow-xs hover:bg-fail/90 focus-visible:ring-fail/25 dark:text-ink",
        "destructive-soft": "bg-fail-soft text-fail hover:bg-fail-soft/70",
        link: "h-auto! rounded-sm px-0! text-brand underline-offset-4 hover:underline",
      },
      size: {
        xs: "h-7 gap-1.5 rounded-md px-2.5 text-xs [&_svg:not([class*='size-'])]:size-3.5",
        sm: "h-8 gap-1.5 rounded-md px-3 text-[13px] [&_svg:not([class*='size-'])]:size-3.5",
        default: "h-9 rounded-[10px] px-4",
        lg: "h-10 rounded-[10px] px-5",
        xl: "h-12 gap-2.5 rounded-[12px] px-6 text-[15px]",
        icon: "size-9",
        "icon-xs": "size-7 rounded-md [&_svg:not([class*='size-'])]:size-3.5",
        "icon-sm": "size-8 rounded-md",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

type ButtonProps = React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
    /** Shows a spinner, keeps the width stable and disables the button. */
    loading?: boolean;
  };

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      data-loading={loading || undefined}
      aria-busy={loading || undefined}
      disabled={asChild ? undefined : disabled || loading}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      {asChild ? (
        children
      ) : (
        <>
          {loading && (
            <span className="absolute inset-0 flex items-center justify-center">
              <Loader2Icon className="animate-spin" aria-hidden />
            </span>
          )}
          <span className={cn("inline-flex items-center gap-[inherit]", loading && "invisible")}>
            {children}
          </span>
        </>
      )}
    </Comp>
  );
}

export { Button, buttonVariants, type ButtonProps };
