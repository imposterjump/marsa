"use client";

import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const Toaster = ({ ...props }: ToasterProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <Sonner
      theme={resolvedTheme}
      // Top-centre (HANDOFF G-43): bottom-right toasts covered primary actions (wizard Continue,
      // the paste dialog's "Add N rules"), and sonner pauses a hovered toast so it never left.
      // Dialog and step footers sit at the bottom; nothing actionable lives at the top centre.
      position="top-center"
      gap={10}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4 text-ok" />,
        info: <InfoIcon className="size-4 text-info" />,
        warning: <TriangleAlertIcon className="size-4 text-partial" />,
        error: <OctagonXIcon className="size-4 text-fail" />,
        loading: <Loader2Icon className="size-4 animate-spin text-brand" />,
      }}
      style={
        {
          "--normal-bg": "var(--surface)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--border)",
          "--border-radius": "12px",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast !shadow-lg !px-4 !py-3.5 !gap-3",
          description: "!text-ink-muted",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
