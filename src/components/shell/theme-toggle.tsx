"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useT } from "@/components/i18n-provider";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useUpdateSettings } from "@/hooks/use-settings";
import type { Theme } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";

const OPTIONS: { value: Theme; label: string; icon: typeof Sun }[] = [
  { value: "light", label: msg("Light"), icon: Sun },
  { value: "dark", label: msg("Dark"), icon: Moon },
  { value: "system", label: msg("System"), icon: Monitor },
];

export function ThemeToggle() {
  const t = useT();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const save = useUpdateSettings();
  const Current = theme === "system" ? Monitor : resolvedTheme === "dark" ? Moon : Sun;

  const choose = (value: Theme) => {
    setTheme(value); // instant (localStorage + <html> class)
    save.mutate({ theme: value }); // persisted in settings too
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t("Theme: {theme}. Change theme", {
            theme: t(OPTIONS.find((o) => o.value === theme)?.label ?? theme),
          })}
        >
          <Current className="size-[18px]" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-44">
        <DropdownMenuLabel>{t("Appearance")}</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={theme} onValueChange={(v) => choose(v as Theme)}>
          {OPTIONS.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem key={value} value={value} className="gap-2.5">
              <Icon className="size-4 text-ink-muted" aria-hidden />
              {t(label)}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
