"use client";

import { useState, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { toast } from "sonner";
import { Monitor, Moon, Palette, Scale, Sparkles, Sun, UserRound, Wrench } from "lucide-react";
import { cn } from "cn";
import { currentT, useT } from "@/components/i18n-provider";
import { LanguageSegmented } from "@/components/shell/language-toggle";
import { useTheme } from "@/components/theme-provider";
import { useSidebarCollapsed } from "@/hooks/use-client-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { Theme } from "@/lib/domain";
import { msg } from "@/lib/i18n/core";
import { setSidebarCollapsed } from "@/lib/theme";
import { AiSection } from "./ai-section";
import { DemoSection } from "./demo-section";
import { ScoringSection } from "./scoring-section";
import { Section } from "./settings-section";

const SECTIONS = [
  { id: "profile", label: msg("Profile"), icon: UserRound },
  { id: "appearance", label: msg("Appearance"), icon: Palette },
  { id: "ai", label: msg("AI & runtime"), icon: Sparkles },
  { id: "scoring", label: msg("Scoring"), icon: Scale },
  { id: "demo", label: msg("Demo tools"), icon: Wrench },
] as const;

type SectionId = (typeof SECTIONS)[number]["id"];
const IDS = SECTIONS.map((x) => x.id) as readonly string[];

// Selected tab lives in the URL hash (#scoring or #settings-scoring) so links can deep-link a tab.
const subscribeHash = (cb: () => void) => {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
};
const readHashTab = (): SectionId => {
  const h = decodeURIComponent(window.location.hash.slice(1)).replace(/^settings-/, "");
  return (IDS.includes(h) ? h : "profile") as SectionId;
};
const selectTab = (id: SectionId) => {
  history.replaceState(null, "", `#${id}`);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
};

/**
 * Settings as tabs (user feedback, Phase 2): only the selected section is shown; switching fades
 * the current one out and the new one in. Vertical tab list on desktop, scrollable chips on mobile.
 */
export function SettingsView() {
  const t = useT();
  const active = useSyncExternalStore(subscribeHash, readHashTab, () => "profile" as SectionId);
  const current = SECTIONS.find((x) => x.id === active)!;

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title={t("Settings")}
        description={t(
          "Personalise your workspace, choose how the AI evaluates proposals, and tune the scoring.",
        )}
      />
      <TabsPrimitive.Root
        value={active}
        onValueChange={(v) => selectTab(v as SectionId)}
        orientation="vertical"
        className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] lg:gap-10"
      >
        <TabsPrimitive.List
          aria-label={t("Settings sections")}
          className="-mx-1 flex [scrollbar-width:none] gap-1 overflow-x-auto px-1 pb-1 lg:sticky lg:top-24 lg:mx-0 lg:flex-col lg:self-start lg:overflow-visible lg:px-0 lg:pb-0"
        >
          {SECTIONS.map(({ id, label, icon: Icon }) => (
            <TabsPrimitive.Trigger
              key={id}
              value={id}
              className={cn(
                "group/tab relative flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-3 text-sm whitespace-nowrap outline-none",
                "transition-colors duration-150 focus-visible:ring-3 focus-visible:ring-ring/25",
                "text-ink-muted hover:bg-surface-muted hover:text-ink",
                "data-[state=active]:font-medium data-[state=active]:text-ink data-[state=active]:hover:bg-transparent",
              )}
            >
              {active === id && (
                <motion.span
                  layoutId="settings-tab"
                  className="absolute inset-0 rounded-lg border border-border bg-surface shadow-xs"
                  transition={{ type: "spring", stiffness: 420, damping: 36 }}
                />
              )}
              <Icon
                aria-hidden
                className="relative size-4 group-data-[state=active]/tab:text-brand"
              />
              <span className="relative">{t(label)}</span>
            </TabsPrimitive.Trigger>
          ))}
        </TabsPrimitive.List>

        <div className="max-w-3xl min-w-0">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <TabsPrimitive.Content value={current.id} forceMount className="outline-none">
                {current.id === "profile" && <ProfileSection />}
                {current.id === "appearance" && <AppearanceSection />}
                {current.id === "ai" && <AiSection />}
                {current.id === "scoring" && <ScoringSection />}
                {current.id === "demo" && <DemoSection />}
              </TabsPrimitive.Content>
            </motion.div>
          </AnimatePresence>
        </div>
      </TabsPrimitive.Root>
    </div>
  );
}

function ProfileSection() {
  const t = useT();
  const { data } = useSettings();
  return (
    <Section
      id="profile"
      title={t("Profile")}
      description={t("Shown in the header, the greeting and the browser tab. No account needed.")}
    >
      {/* key: the form re-initialises from the server copy whenever it changes */}
      {!data ? (
        <Skeleton className="h-36 w-full" />
      ) : (
        <ProfileForm key={data.updatedAt} name0={data.customerName} org0={data.organization} />
      )}
    </Section>
  );
}

function ProfileForm({ name0, org0 }: { name0: string; org0: string }) {
  const t = useT();
  const save = useUpdateSettings();
  const [name, setName] = useState(name0);
  const [org, setOrg] = useState(org0);
  const nameError = name.trim()
    ? name.trim().length > 80
      ? t("Keep it under {n} characters.", { n: 80 })
      : null
    : t("Please enter your name.");
  const orgError = org.trim().length > 120 ? t("Keep it under {n} characters.", { n: 120 }) : null;
  const dirty = name.trim() !== name0 || org.trim() !== org0;

  return (
    <form
      className="grid gap-5 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        if (nameError || orgError) return;
        await save.mutateAsync({
          customerName: name.trim(),
          organization: org.trim(),
          onboarded: true,
        });
        toast.success(currentT()("Profile saved."));
      }}
    >
      <Field label={t("Your name")} error={nameError}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          dir="auto"
          autoComplete="name"
        />
      </Field>
      <Field label={t("Organization")} optional error={orgError}>
        <Input
          value={org}
          onChange={(e) => setOrg(e.target.value)}
          dir="auto"
          autoComplete="organization"
        />
      </Field>
      <div className="flex justify-end gap-3 sm:col-span-2">
        <Button
          type="button"
          variant="ghost"
          disabled={!dirty}
          onClick={() => {
            setName(name0);
            setOrg(org0);
          }}
        >
          {t("Reset")}
        </Button>
        <Button
          type="submit"
          disabled={!dirty || !!nameError || !!orgError}
          loading={save.isPending}
        >
          {t("Save profile")}
        </Button>
      </div>
    </form>
  );
}

function AppearanceSection() {
  const t = useT();
  const { theme, setTheme } = useTheme();
  const save = useUpdateSettings();
  const collapsed = useSidebarCollapsed();

  return (
    <Section
      id="appearance"
      title={t("Appearance")}
      description={t("Theme and layout preferences for this browser.")}
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{t("Language")}</span>
            <span className="text-[13px] text-ink-muted">
              {t("Screens in English or Arabic. Every analysis is available in both.")}
            </span>
          </div>
          <LanguageSegmented />
        </div>
        <div className="flex flex-col gap-3 border-t border-border/70 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{t("Theme")}</span>
            <span className="text-[13px] text-ink-muted">
              {t("System follows your OS light/dark setting.")}
            </span>
          </div>
          <SegmentedControl<Theme>
            aria-label={t("Theme")}
            value={theme}
            onValueChange={(v) => {
              setTheme(v);
              save.mutate({ theme: v });
            }}
            options={[
              { value: "light", label: t("Light"), icon: <Sun /> },
              { value: "dark", label: t("Dark"), icon: <Moon /> },
              { value: "system", label: t("System"), icon: <Monitor /> },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-border/70 pt-6">
          <label htmlFor="sidebar-collapsed" className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">{t("Compact sidebar")}</span>
            <span className="text-[13px] text-ink-muted">
              {t("Show icons only. Shortcut: Ctrl + B.")}
            </span>
          </label>
          <Switch
            id="sidebar-collapsed"
            checked={collapsed}
            onCheckedChange={(v) => {
              setSidebarCollapsed(v);
              save.mutate({ sidebarCollapsed: v });
            }}
          />
        </div>
      </div>
    </Section>
  );
}
