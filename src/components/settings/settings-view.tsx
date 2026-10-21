"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Monitor, Moon, Palette, Scale, Sparkles, Sun, UserRound, Wrench } from "lucide-react";
import { cn } from "cn";
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
import { setSidebarCollapsed } from "@/lib/theme";
import { AiSection } from "./ai-section";
import { ScoringSection } from "./scoring-section";
import { PhaseNote, Section } from "./settings-section";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "ai", label: "AI & runtime", icon: Sparkles },
  { id: "scoring", label: "Scoring", icon: Scale },
  { id: "demo", label: "Demo tools", icon: Wrench },
] as const;

export function SettingsView() {
  const [active, setActive] = useState<string>("profile");

  // Scroll-spy: highlight the section currently in view.
  useEffect(() => {
    const els = SECTIONS.map((s) => document.getElementById(`settings-${s.id}`)).filter(
      Boolean,
    ) as HTMLElement[];
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id.replace("settings-", ""));
      },
      { rootMargin: "-20% 0px -60% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="flex flex-col gap-10">
      <PageHeader
        title="Settings"
        description="Personalise your workspace, choose how the AI evaluates proposals, and tune the scoring."
      />
      <div className="grid gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-24 flex flex-col gap-1">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <li key={id}>
                <a
                  href={`#settings-${id}`}
                  aria-current={active === id ? "true" : undefined}
                  className={cn(
                    "flex h-9 items-center gap-2.5 rounded-lg px-3 text-sm transition-colors focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none",
                    active === id
                      ? "bg-surface font-medium text-ink shadow-xs"
                      : "text-ink-muted hover:bg-surface-muted hover:text-ink",
                  )}
                >
                  <Icon aria-hidden className={cn("size-4", active === id && "text-brand")} />
                  {label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <div className="flex max-w-3xl flex-col gap-6">
          <ProfileSection />
          <AppearanceSection />
          <AiSection />
          <ScoringSection />
          <Section
            id="demo"
            title="Demo tools"
            description="Vendor simulator, re-seed sample data, reset all data."
          >
            <PhaseNote
              phase={4}
              text="Open the vendor simulator, load the sample tender and reset the workspace."
            />
          </Section>
        </div>
      </div>
    </div>
  );
}

function ProfileSection() {
  const { data } = useSettings();
  return (
    <Section
      id="profile"
      title="Profile"
      description="Shown in the header, the greeting and the browser tab. No account needed."
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
  const save = useUpdateSettings();
  const [name, setName] = useState(name0);
  const [org, setOrg] = useState(org0);
  const nameError = name.trim()
    ? name.trim().length > 80
      ? "Keep it under 80 characters."
      : null
    : "Please enter your name.";
  const orgError = org.trim().length > 120 ? "Keep it under 120 characters." : null;
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
        toast.success("Profile saved.");
      }}
    >
      <Field label="Your name" error={nameError}>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          dir="auto"
          autoComplete="name"
        />
      </Field>
      <Field label="Organization" optional error={orgError}>
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
          Reset
        </Button>
        <Button
          type="submit"
          disabled={!dirty || !!nameError || !!orgError}
          loading={save.isPending}
        >
          Save profile
        </Button>
      </div>
    </form>
  );
}

function AppearanceSection() {
  const { theme, setTheme } = useTheme();
  const save = useUpdateSettings();
  const collapsed = useSidebarCollapsed();

  return (
    <Section
      id="appearance"
      title="Appearance"
      description="Theme and layout preferences for this browser."
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">Theme</span>
            <span className="text-[13px] text-ink-muted">
              System follows your OS light/dark setting.
            </span>
          </div>
          <SegmentedControl<Theme>
            aria-label="Theme"
            value={theme}
            onValueChange={(v) => {
              setTheme(v);
              save.mutate({ theme: v });
            }}
            options={[
              { value: "light", label: "Light", icon: <Sun /> },
              { value: "dark", label: "Dark", icon: <Moon /> },
              { value: "system", label: "System", icon: <Monitor /> },
            ]}
          />
        </div>
        <div className="flex items-center justify-between gap-6 border-t border-border/70 pt-6">
          <label htmlFor="sidebar-collapsed" className="flex flex-col gap-0.5">
            <span className="font-medium text-ink">Compact sidebar</span>
            <span className="text-[13px] text-ink-muted">Show icons only. Shortcut: Ctrl + B.</span>
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
