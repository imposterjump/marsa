"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Bell, Download, Eye, Filter, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";
import { cn } from "cn";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dropzone, type UploadFn } from "@/components/ui/dropzone";
import { EmptyState } from "@/components/ui/empty-state";
import { Field } from "@/components/ui/field";
import { FileIcon } from "@/components/ui/file-icon";
import { InitialsAvatar } from "@/components/ui/initials-avatar";
import { Input } from "@/components/ui/input";
import { Kbd } from "@/components/ui/kbd";
import { PageHeader } from "@/components/ui/page-header";
import { SegmentedControl } from "@/components/ui/segmented-control";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { FindingStatusPill, Pill, ProjectStatusPill, RiskPill } from "@/components/ui/status-pill";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { DataTable, type Column } from "@/components/data/data-table";
import { KeyValueList } from "@/components/data/key-value-list";
import { ProgressRing } from "@/components/data/progress-ring";
import { StackedStatusBar } from "@/components/data/stacked-status-bar";
import { StatTile } from "@/components/data/stat-tile";
import { CountUp } from "@/components/motion/count-up";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { MaskedText } from "@/components/motion/masked-text";
import { Reveal } from "@/components/motion/reveal";
import { ScrambleText } from "@/components/motion/scramble-text";
import { Stagger, StaggerItem } from "@/components/motion/stagger";
import { DocumentsArt, ProjectsArt, StandardsArt } from "@/components/illustrations";
import {
  FINDING_STATUSES,
  PROJECT_STATUSES,
  RISK_SEVERITIES,
  type RiskSeverity,
} from "@/lib/domain";
import { RUN_PHASE_LABEL } from "@/lib/labels";
import { useSettings } from "@/hooks/use-settings";
import { APP_NAME } from "@/lib/brand";

const SECTIONS = [
  ["colors", "Colours"],
  ["type", "Typography"],
  ["buttons", "Buttons"],
  ["forms", "Form controls"],
  ["status", "Status & badges"],
  ["overlays", "Overlays & feedback"],
  ["data", "Data display"],
  ["table", "Data table"],
  ["dropzone", "Dropzone"],
  ["motion", "Motion"],
  ["empty", "Empty states"],
] as const;

export function UiKit() {
  const { data: settings } = useSettings();
  return (
    <div className="flex flex-col gap-12">
      <PageHeader
        eyebrow="Design system · Harbor"
        title="UI kit"
        description={`Every ${APP_NAME} building block in all its states, in light and dark. Use the theme switch in the header to compare.`}
      />
      <nav aria-label="UI kit sections" className="flex flex-wrap gap-2">
        {SECTIONS.map(([id, label]) => (
          <a
            key={id}
            href={`#kit-${id}`}
            className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-ink-2 transition-colors hover:border-brand/50 hover:text-ink focus-visible:ring-3 focus-visible:ring-ring/25 focus-visible:outline-none"
          >
            {label}
          </a>
        ))}
      </nav>
      <ColorsSection />
      <TypeSection />
      <ButtonsSection />
      <FormsSection />
      <StatusSection />
      <OverlaysSection />
      <DataSection />
      <TableSection />
      <DropzoneSection maxSizeMb={settings?.runtime.maxUploadMb ?? 50} />
      <MotionSection />
      <EmptySection />
    </div>
  );
}

function KitSection({
  id,
  title,
  children,
  note,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  note?: string;
}) {
  return (
    <section
      id={`kit-${id}`}
      aria-labelledby={`kit-${id}-t`}
      className="flex scroll-mt-24 flex-col gap-5"
    >
      <div className="flex flex-col gap-1 border-b border-border pb-3">
        <h2
          id={`kit-${id}-t`}
          className="font-heading text-xl font-semibold tracking-tight text-ink"
        >
          {title}
        </h2>
        {note && <p className="text-[13px] text-ink-muted">{note}</p>}
      </div>
      {children}
    </section>
  );
}

function Panel({
  title,
  children,
  className,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-xl border border-border bg-surface p-6 shadow-xs",
        className,
      )}
    >
      {title && (
        <h3 className="text-xs font-semibold tracking-[0.06em] text-ink-muted uppercase">
          {title}
        </h3>
      )}
      {children}
    </div>
  );
}

/* ─────────────────────────────── Colours ─────────────────────────────── */
const SWATCHES: { group: string; tokens: string[] }[] = [
  {
    group: "Surfaces",
    tokens: [
      "frame",
      "background",
      "surface",
      "surface-muted",
      "sunken",
      "border",
      "border-strong",
    ],
  },
  { group: "Ink", tokens: ["ink", "ink-2", "ink-muted", "ink-faint", "navy"] },
  { group: "Brand", tokens: ["brand", "brand-hover", "brand-soft", "brand-ink"] },
  {
    group: "Compliance",
    tokens: [
      "ok",
      "ok-soft",
      "partial",
      "partial-soft",
      "fail",
      "fail-soft",
      "missing",
      "missing-soft",
    ],
  },
  { group: "Risk", tokens: ["risk-low", "risk-moderate", "risk-high", "risk-critical"] },
];

function ColorsSection() {
  return (
    <KitSection
      id="colors"
      title="Colours"
      note="Semantic tokens only; components never use raw hex. Contrast verified by scripts/contrast-check.ts."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {SWATCHES.map(({ group, tokens }) => (
          <Panel key={group} title={group}>
            <div className="grid grid-cols-2 gap-3">
              {tokens.map((t) => (
                <div key={t} className="flex items-center gap-3">
                  <span
                    className="size-9 shrink-0 rounded-lg border border-border shadow-xs"
                    style={{ background: `var(--${t})` }}
                  />
                  <code className="font-mono text-xs text-ink-2">{t}</code>
                </div>
              ))}
            </div>
          </Panel>
        ))}
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Typography ─────────────────────────────── */
function TypeSection() {
  return (
    <KitSection
      id="type"
      title="Typography"
      note="Plus Jakarta Sans for display, Inter for UI (14/22 body), JetBrains Mono for references."
    >
      <Panel>
        <div className="flex flex-col gap-5">
          <p className="font-heading text-display font-semibold text-ink">Display 40/48</p>
          <p className="font-heading text-[30px] leading-[38px] font-semibold tracking-tight text-ink">
            Heading 1 · 30/38
          </p>
          <p className="font-heading text-2xl font-semibold tracking-tight text-ink">
            Heading 2 · 24/32
          </p>
          <p className="font-heading text-xl font-semibold tracking-tight text-ink">
            Heading 3 · 20/28
          </p>
          <p className="text-base font-semibold text-ink">Heading 4 · 16/24 semibold</p>
          <p className="max-w-2xl text-base leading-relaxed text-ink-2">
            Body large 16/26: the vendor proposes a 27-inch operator display at 1920×1080. The RFP
            requires a minimum of 2560×1440, so the size is compliant but the resolution is below
            spec.
          </p>
          <p className="max-w-2xl text-ink-2">
            Body 14/22: every finding is backed by a quote, a document and a page, so a committee
            can verify it in seconds. Muted copy uses{" "}
            <span className="text-ink-muted">ink-muted</span>.
          </p>
          <p className="text-xs text-ink-muted">Caption 12/16 · Submitted 14 Nov 2026, 11:42</p>
          <p className="text-2xs font-semibold tracking-[0.08em] text-ink-muted uppercase">
            Overline 11/16
          </p>
          <p className="font-mono text-xs text-ink-2">PRJ-2026-014 · REQ-047 · NGPA/T/2026/014</p>
          <p className="text-ink" dir="rtl" lang="ar">
            نص عربي للتحقق من الخط: تقييم العروض الفنية والتجارية للموانئ والجمارك
          </p>
        </div>
      </Panel>
    </KitSection>
  );
}

/* ─────────────────────────────── Buttons ─────────────────────────────── */
function ButtonsSection() {
  const [loading, setLoading] = useState(false);
  return (
    <KitSection
      id="buttons"
      title="Buttons"
      note="One primary action per view. Hover lifts colour, press scales to 98%."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Variants">
          <div className="flex flex-wrap items-center gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="soft">
              <Sparkles /> Soft
            </Button>
            <Button variant="destructive">
              <Trash2 /> Delete
            </Button>
            <Button variant="destructive-soft">Remove</Button>
            <Button variant="link">Link</Button>
          </div>
        </Panel>
        <Panel title="Sizes">
          <div className="flex flex-wrap items-center gap-3">
            <Button size="xs">Extra small</Button>
            <Button size="sm">Small</Button>
            <Button>Default</Button>
            <Button size="lg">Large</Button>
            <Button size="xl">
              <Sparkles /> Analyse & process
            </Button>
          </div>
        </Panel>
        <Panel title="States">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              loading={loading}
              onClick={() => {
                setLoading(true);
                setTimeout(() => setLoading(false), 1800);
              }}
            >
              <Download /> Click to load
            </Button>
            <Button disabled>Disabled</Button>
            <Button variant="secondary" disabled>
              Disabled
            </Button>
          </div>
        </Panel>
        <Panel title="Icon buttons">
          <div className="flex flex-wrap items-center gap-3">
            {(["icon-xs", "icon-sm", "icon", "icon-lg"] as const).map((s) => (
              <Tooltip key={s}>
                <TooltipTrigger asChild>
                  <Button size={s} variant="secondary" aria-label={`Notifications (${s})`}>
                    <Bell />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{s}</TooltipContent>
              </Tooltip>
            ))}
            <Button size="icon" aria-label="Add">
              <Plus />
            </Button>
            <Button size="icon" variant="ghost" aria-label="Preview">
              <Eye />
            </Button>
          </div>
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Forms ─────────────────────────────── */
function FormsSection() {
  const [seg, setSeg] = useState<"all" | "non" | "partial" | "missing" | "ok">("all");
  const [agree, setAgree] = useState(true);
  const [notify, setNotify] = useState(false);
  return (
    <KitSection
      id="forms"
      title="Form controls"
      note="40 px fields, 8 px radius, teal focus ring, inline errors with icon."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Text">
          <div className="grid gap-5">
            <Field label="Project name" hint="Shown to vendors in the tender notice.">
              <Input placeholder="e.g. Drive-through cargo X-ray inspection systems" />
            </Field>
            <Field label="Reference" error="This reference is already used by another project.">
              <Input defaultValue="NGPA/T/2026/014" />
            </Field>
            <Field label="Submission deadline" optional>
              <Input type="date" defaultValue="2026-12-14" />
            </Field>
            <Field label="Disabled">
              <Input disabled value="Read-only value" readOnly />
            </Field>
          </div>
        </Panel>
        <Panel title="Choice">
          <div className="grid gap-5">
            <Field label="Key requirements / notes" optional>
              <Textarea placeholder="Quantities, specs, constraints the vendors must respect…" />
            </Field>
            <Field label="Category">
              <Select defaultValue="equipment">
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="equipment">Equipment</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="services">Services</SelectItem>
                  <SelectItem value="works">Works</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <label className="flex items-center gap-3 text-ink">
              <Checkbox checked={agree} onCheckedChange={(v) => setAgree(v === true)} />
              Apply all active standards to this project
            </label>
            <label className="flex items-center justify-between gap-3 text-ink">
              Email me when the analysis finishes
              <Switch checked={notify} onCheckedChange={setNotify} />
            </label>
            <SegmentedControl
              aria-label="Findings filter"
              value={seg}
              onValueChange={setSeg}
              options={[
                { value: "all", label: "All", count: 48 },
                { value: "non", label: "Non-compliant", count: 5 },
                { value: "partial", label: "Partial", count: 7 },
                { value: "missing", label: "Not addressed", count: 3 },
                { value: "ok", label: "Compliant", count: 33 },
              ]}
              size="sm"
            />
          </div>
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Status ─────────────────────────────── */
function StatusSection() {
  return (
    <KitSection
      id="status"
      title="Status & badges"
      note="Status is never colour alone: icon + label on every pill."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Panel title="Compliance">
          <div className="flex flex-wrap gap-2">
            {FINDING_STATUSES.map((s) => (
              <FindingStatusPill key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            {FINDING_STATUSES.map((s) => (
              <FindingStatusPill key={s} status={s} size="sm" />
            ))}
          </div>
        </Panel>
        <Panel title="Risk">
          <div className="flex flex-wrap gap-2">
            {RISK_SEVERITIES.map((s) => (
              <RiskPill key={s} severity={s} />
            ))}
          </div>
        </Panel>
        <Panel title="Project">
          <div className="flex flex-wrap gap-2">
            {PROJECT_STATUSES.map((s) => (
              <ProjectStatusPill key={s} status={s} />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Pill tone="brand">Mandatory</Pill>
            <Pill tone="neutral">Desirable</Pill>
          </div>
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Overlays ─────────────────────────────── */
function OverlaysSection() {
  const [tab, setTab] = useState("commercial");
  return (
    <KitSection id="overlays" title="Overlays & feedback">
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Dialog · Sheet · Menu · Tooltip">
          <div className="flex flex-wrap gap-3">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="secondary">Open dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Re-run analysis?</DialogTitle>
                  <DialogDescription>
                    Two proposals changed since the last run. A new run evaluates all 4 proposals
                    (14 steps). The previous run stays in history.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="ghost">Cancel</Button>
                  <Button>
                    <Sparkles /> Start new run
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="secondary">Open sheet</Button>
              </SheetTrigger>
              <SheetContent>
                <SheetHeader>
                  <SheetTitle>Finding REQ-047</SheetTitle>
                  <SheetDescription>
                    Operator workstation displays: dual 27-inch, min 2560×1440.
                  </SheetDescription>
                </SheetHeader>
                <div className="px-4">
                  <FindingStatusPill status="partial" />
                </div>
              </SheetContent>
            </Sheet>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary">
                  <Filter /> Menu
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuLabel>Project</DropdownMenuLabel>
                <DropdownMenuItem>Edit details</DropdownMenuItem>
                <DropdownMenuItem>Archive</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive">Delete project</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>Tooltips explain icons and truncated text</TooltipContent>
            </Tooltip>
          </div>
        </Panel>
        <Panel title="Toasts">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="secondary"
              onClick={() =>
                toast.success("Project published", {
                  description: "Vendors can now submit proposals.",
                })
              }
            >
              Success
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.info("Analysis running", {
                  description: "Step 4 of 11 · Comparing Vendor A against B, C",
                })
              }
            >
              Info
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.warning("1 file skipped", {
                  description: "Legacy .doc can't be read by the AI.",
                })
              }
            >
              Warning
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.error("Upload failed", { description: "The connection was interrupted." })
              }
            >
              Error
            </Button>
            <Button
              variant="secondary"
              onClick={() =>
                toast.promise(new Promise((r) => setTimeout(r, 1600)), {
                  loading: "Saving standard…",
                  success: "Standard saved",
                  error: "Couldn't save",
                })
              }
            >
              Loading → success
            </Button>
          </div>
        </Panel>
        <Panel title="Tabs" className="lg:col-span-2">
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList variant="line" className="w-full justify-start border-b border-border">
              {["commercial", "technical", "compliance", "comparison", "risk"].map((t) => (
                <TabsTrigger key={t} value={t} className="capitalize">
                  {t}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value={tab} className="pt-4 text-ink-muted">
              Page-level tabs (line variant). Content for{" "}
              <strong className="text-ink">{tab}</strong>.
            </TabsContent>
          </Tabs>
          <Tabs defaultValue="grid">
            <TabsList>
              <TabsTrigger value="grid">Grid</TabsTrigger>
              <TabsTrigger value="list">List</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="flex items-center gap-2 text-[13px] text-ink-muted">
            Shortcuts: <Kbd>Ctrl</Kbd>+<Kbd>B</Kbd> toggle sidebar · <Kbd>←</Kbd>
            <Kbd>→</Kbd> pages (viewer, P5)
          </div>
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Data display ─────────────────────────────── */
function DataSection() {
  return (
    <KitSection
      id="data"
      title="Data display"
      note="Scores count up and rings draw when they first scroll into view."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <StatTile label="Active projects" value={3} hint="1 evaluating" />
        <StatTile label="Proposals received" value={11} hint="4 this week" />
        <StatTile label="Average compliance" value={81.4} decimals={1} suffix="%" hint="Last run" />
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Score rings (≥85 ok · ≥70 partial · <70 fail)">
          <div className="flex flex-wrap items-center gap-8">
            <ProgressRing value={92} label="Harborline Systems compliance" caption="compliant" />
            <ProgressRing
              value={78.5}
              decimals={1}
              label="Nile Gate compliance"
              caption="compliant"
            />
            <ProgressRing value={54} label="Atlas Port compliance" caption="compliant" />
            <ProgressRing value={66} size={56} thickness={6} showValue label="Small ring" />
          </div>
        </Panel>
        <Panel title="Findings breakdown">
          <StackedStatusBar
            counts={{ compliant: 33, partial: 7, non_compliant: 5, not_addressed: 3 }}
          />
          <StackedStatusBar
            counts={{ compliant: 41, partial: 4, non_compliant: 1, not_addressed: 2 }}
            legend={false}
          />
        </Panel>
        <Panel title="Commercial snapshot" className="lg:col-span-2">
          <KeyValueList
            columns={2}
            items={[
              { label: "Total price (CAPEX)", value: "USD 18,740,000" },
              { label: "5-year CMC", value: "USD 6,215,000" },
              { label: "Payment terms", value: "10 / 60 / 20 / 10" },
              { label: "Delivery", value: "8.5 months" },
              { label: "Warranty", value: "24 months from shipment", emphasis: true },
              { label: "Offer validity", value: "90 days", emphasis: true },
            ]}
          />
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Table ─────────────────────────────── */
interface Row {
  id: string;
  vendor: string;
  submitted: string;
  files: number;
  score: number;
  risk: RiskSeverity;
}
const ROWS: Row[] = [
  {
    id: "1",
    vendor: "Harborline Systems",
    submitted: "2026-11-28T09:12:00Z",
    files: 6,
    score: 92,
    risk: "low",
  },
  {
    id: "2",
    vendor: "Meridian Scan Technologies",
    submitted: "2026-12-01T15:40:00Z",
    files: 4,
    score: 71,
    risk: "critical",
  },
  {
    id: "3",
    vendor: "Nile Gate Solutions",
    submitted: "2026-12-03T11:05:00Z",
    files: 5,
    score: 78.5,
    risk: "moderate",
  },
  {
    id: "4",
    vendor: "Atlas Port Technologies",
    submitted: "2026-12-04T08:30:00Z",
    files: 3,
    score: 54,
    risk: "high",
  },
];

function TableSection() {
  const [loading, setLoading] = useState(false);
  const columns: Column<Row>[] = [
    {
      id: "vendor",
      header: "Vendor",
      sortValue: (r) => r.vendor,
      cell: (r) => (
        <span className="flex items-center gap-3">
          <InitialsAvatar name={r.vendor} size="sm" />
          <span className="font-medium">{r.vendor}</span>
        </span>
      ),
    },
    {
      id: "submitted",
      header: "Submitted",
      sortValue: (r) => r.submitted,
      cell: (r) => (
        <span className="text-ink-2 tabular-nums">
          {new Intl.DateTimeFormat("en-GB", {
            dateStyle: "medium",
            timeStyle: "short",
            timeZone: "UTC",
          }).format(new Date(r.submitted))}
        </span>
      ),
    },
    {
      id: "files",
      header: "Files",
      align: "end",
      sortValue: (r) => r.files,
      cell: (r) => <span className="tabular-nums">{r.files}</span>,
    },
    {
      id: "score",
      header: "Score",
      align: "end",
      sortValue: (r) => r.score,
      cell: (r) => <span className="font-semibold tabular-nums">{r.score}%</span>,
    },
    {
      id: "risk",
      header: "Risk",
      sortValue: (r) => RISK_SEVERITIES.indexOf(r.risk),
      cell: (r) => <RiskPill severity={r.risk} size="sm" />,
    },
    {
      id: "actions",
      header: <span className="sr-only">Actions</span>,
      align: "end",
      cell: (r) => (
        <Button size="sm" variant="secondary" onClick={() => toast(`Open ${r.vendor} (Phase 5)`)}>
          <Eye /> View
        </Button>
      ),
    },
  ];
  return (
    <KitSection
      id="table"
      title="Data table"
      note="Click headers to sort (keyboard: Tab + Enter). Spacing and hover instead of heavy borders."
    >
      <div className="flex justify-end">
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setLoading(true);
            setTimeout(() => setLoading(false), 1500);
          }}
        >
          <RotateCcw /> Show loading state
        </Button>
      </div>
      <DataTable
        caption="Vendor proposals (sample)"
        columns={columns}
        rows={ROWS}
        rowKey={(r) => r.id}
        loading={loading}
        initialSort={{ id: "submitted", dir: "asc" }}
      />
      <DataTable
        caption="Empty table"
        columns={columns.slice(0, 3)}
        rows={[]}
        rowKey={(r) => r.id}
        empty={<p className="p-8 text-center text-ink-muted">No proposals yet.</p>}
      />
    </KitSection>
  );
}

/* ─────────────────────────────── Dropzone ─────────────────────────────── */
/** Simulated upload: speed scales with file size; names containing "fail" error out at 60%. */
const simulateUpload: UploadFn = (file, onProgress) =>
  new Promise((resolve, reject) => {
    const total = Math.min(4000, 600 + file.size / 6000);
    const start = performance.now();
    const tick = () => {
      const p = Math.min(100, ((performance.now() - start) / total) * 100);
      if (/fail/i.test(file.name) && p >= 60)
        return reject(new Error("Network interrupted at 60%. Retry to resume."));
      onProgress(p);
      if (p < 100) requestAnimationFrame(tick);
      else resolve();
    };
    requestAnimationFrame(tick);
  });

function DropzoneSection({ maxSizeMb }: { maxSizeMb: number }) {
  return (
    <KitSection
      id="dropzone"
      title="Dropzone"
      note="Test with the files in test-inputs/phase-1 (see its README). Upload is simulated in Phase 1; real storage arrives in Phase 3."
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="With simulated upload">
          <Dropzone label="RFP documents" maxSizeMb={maxSizeMb} upload={simulateUpload} />
        </Panel>
        <Panel title="Select only (no upload)">
          <Dropzone label="Commercial proposal" maxSizeMb={maxSizeMb} maxFiles={5} />
        </Panel>
      </div>
      <Panel title="File type icons">
        <div className="flex flex-wrap gap-3">
          {[
            "RFP.pdf",
            "Contract.docx",
            "Annex-B.xlsx",
            "Brief.pptx",
            "Site-plan.png",
            "Notes.txt",
            "Bundle.zip",
            "Legacy.doc",
            "unknown.bin",
          ].map((n) => (
            <div
              key={n}
              className="flex items-center gap-2.5 rounded-lg border border-border p-2 pe-3"
            >
              <FileIcon name={n} />
              <span className="text-xs text-ink-2">{n}</span>
            </div>
          ))}
        </div>
      </Panel>
    </KitSection>
  );
}

/* ─────────────────────────────── Motion ─────────────────────────────── */
const PHASES = Object.values(RUN_PHASE_LABEL);

function MotionSection() {
  const [replay, setReplay] = useState(0);
  const [phase, setPhase] = useState(0);
  return (
    <KitSection
      id="motion"
      title="Motion"
      note="epic-design techniques adapted for app UI. All respect prefers-reduced-motion."
    >
      <div className="flex justify-end">
        <Button size="sm" variant="secondary" onClick={() => setReplay((r) => r + 1)}>
          <RotateCcw /> Replay animations
        </Button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="M1 · Masked line reveal">
          <MaskedText
            replayKey={replay}
            as="p"
            text={["Comparing Harborline Systems", "against Meridian, Nile Gate, Atlas"]}
            className="font-heading text-2xl leading-tight font-semibold tracking-tight text-ink"
          />
        </Panel>
        <Panel title="M4 · Scramble text (phase change)">
          <div className="flex items-center justify-between gap-4">
            <span className="font-heading text-2xl font-semibold text-brand">
              <ScrambleText text={PHASES[phase]} />
            </span>
            <Button
              size="sm"
              variant="secondary"
              onClick={() => setPhase((p) => (p + 1) % PHASES.length)}
            >
              Next phase
            </Button>
          </div>
        </Panel>
        <Panel title="M2 · Stagger grid">
          <Stagger key={replay} className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }, (_, i) => (
              <StaggerItem
                key={i}
                className="h-12 rounded-lg border border-border bg-surface-muted"
              />
            ))}
          </Stagger>
        </Panel>
        <Panel title="M5 · Count up">
          <div key={replay} className="flex items-baseline gap-6">
            <span className="font-heading text-4xl font-semibold text-ink">
              <CountUp value={87.5} decimals={1} suffix="%" />
            </span>
            <span className="text-ink-muted">
              <CountUp value={11} /> steps · <CountUp value={4} /> vendors
            </span>
          </div>
        </Panel>
        <Panel title="M3 · Depth backdrop (move your pointer)" className="lg:col-span-2">
          <div className="relative h-56 overflow-hidden rounded-xl border border-border bg-background">
            <DepthBackdrop />
            <div className="relative flex h-full flex-col justify-end p-6">
              <Reveal key={replay} immediate>
                <p className="font-heading text-xl font-semibold text-ink">
                  Layers: grid (d0) · glow (d1) · harbour art (d2)
                </p>
              </Reveal>
            </div>
          </div>
        </Panel>
      </div>
    </KitSection>
  );
}

/* ─────────────────────────────── Empty states ─────────────────────────────── */
function EmptySection() {
  return (
    <KitSection
      id="empty"
      title="Empty states"
      note="Illustration floats gently (M10). Always explains what's missing and what to do next."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <Card>
          <CardContent>
            <EmptyState
              art={<ProjectsArt />}
              title="No projects yet"
              description="Create a project to publish an RFP."
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <EmptyState
              art={<StandardsArt />}
              title="No standards yet"
              description="Add the rules every proposal must meet."
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <EmptyState
              art={<DocumentsArt />}
              title="No documents"
              description="This vendor hasn't uploaded a technical proposal."
            />
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Loading skeletons</CardTitle>
          <CardDescription>
            Shown for any wait over 300 ms, so the layout never jumps.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-5 w-1/3" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </KitSection>
  );
}
