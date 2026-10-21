"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Bot,
  FlaskConical,
  KeyRound,
  Monitor,
  Moon,
  Palette,
  Scale,
  Sun,
  UserRound,
  Wrench,
} from "lucide-react";
import { cn } from "cn";
import { useTheme } from "@/components/theme-provider";
import { useSidebarCollapsed } from "@/hooks/use-client-store";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import { Pill } from "@/components/ui/status-pill";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { KeyValueList } from "@/components/data/key-value-list";
import { useSettings, useUpdateSettings } from "@/hooks/use-settings";
import type { Theme } from "@/lib/domain";
import { setSidebarCollapsed } from "@/lib/theme";

const SECTIONS = [
  { id: "profile", label: "Profile", icon: UserRound },
  { id: "appearance", label: "Appearance", icon: Palette },
  { id: "ai", label: "AI & runtime", icon: Bot },
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
        description="Personalise your workspace and see how the AI is configured."
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
          <Section
            id="scoring"
            title="Scoring"
            description="Weights per requirement priority and credit for partial compliance (PRD FR-9.4)."
          >
            <PhaseNote
              phase={2}
              text="Editable weights (Mandatory 3 · Important 2 · Desirable 1) and partial credit (50%) with a live example score."
            />
          </Section>
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

function Section({
  id,
  title,
  description,
  children,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={`settings-${id}`}
      aria-labelledby={`settings-${id}-title`}
      className="scroll-mt-24 rounded-xl border border-border bg-surface shadow-xs"
    >
      <div className="flex flex-col gap-1 border-b border-border/70 px-6 py-5">
        <h2
          id={`settings-${id}-title`}
          className="font-heading text-base font-semibold tracking-tight text-ink"
        >
          {title}
        </h2>
        {description && <p className="text-[13px] text-ink-muted">{description}</p>}
      </div>
      <div className="px-6 py-6">{children}</div>
    </section>
  );
}

function PhaseNote({ phase, text }: { phase: number; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-surface-muted/70 px-4 py-3 text-[13px] text-ink-2">
      <Pill tone="neutral" size="sm">
        Phase {phase}
      </Pill>
      <span className="leading-relaxed">{text}</span>
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

function AiSection() {
  const { data } = useSettings();
  if (!data) {
    return (
      <Section id="ai" title="AI & runtime">
        <Skeleton className="h-32 w-full" />
      </Section>
    );
  }
  const { aiMode, apiKeyConfigured, maxUploadMb } = data.runtime;
  return (
    <Section
      id="ai"
      title="AI & runtime"
      description="Read-only in Phase 1. Model choice and report language become editable in Phase 2."
    >
      <KeyValueList
        items={[
          {
            label: "AI mode",
            value:
              aiMode === "mock" ? (
                <Pill tone="info" icon={FlaskConical}>
                  Mock (fixtures, $0)
                </Pill>
              ) : (
                <Pill tone="brand" icon={Bot}>
                  Live (Anthropic API)
                </Pill>
              ),
          },
          {
            label: "API key",
            value: apiKeyConfigured ? (
              <Pill tone="ok" icon={KeyRound}>
                Configured on the server
              </Pill>
            ) : (
              <Pill tone="partial" icon={KeyRound}>
                Missing: add ANTHROPIC_API_KEY to .env
              </Pill>
            ),
          },
          {
            label: "Default model",
            value: data.aiModel === "claude-opus-5-5" ? "Claude Opus 5.5" : "Claude Sonnet 5.5",
          },
          { label: "Report language", value: data.reportLanguage === "en" ? "English" : "Arabic" },
          { label: "Max upload size", value: `${maxUploadMb} MB per file` },
          { label: "Parallel AI steps", value: String(data.concurrency) },
        ]}
      />
    </Section>
  );
}
