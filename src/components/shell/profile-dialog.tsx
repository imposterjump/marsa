"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { DepthBackdrop } from "@/components/motion/depth-backdrop";
import { MaskedText } from "@/components/motion/masked-text";
import { useGreeting } from "@/hooks/use-client-store";
import { useUpdateSettings } from "@/hooks/use-settings";
import { ApiClientError } from "@/lib/api-client";
import type { SettingsDto } from "@/lib/api-types";
import { firstName } from "@/lib/format";
import { BrandMark } from "./brand-mark";
import { APP_NAME } from "@/lib/brand";

const NAME_MAX = 80;
const ORG_MAX = 120;

/**
 * PRD FR-1.4 / REC-13: first-run welcome (no account) + "Edit profile" from the header.
 * Welcome mode can't be dismissed by clicking outside or Esc; "Skip for now" stores "Guest".
 */
export function ProfileDialog({
  mode,
  open,
  onOpenChange,
  settings,
}: {
  mode: "welcome" | "edit";
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: SettingsDto;
}) {
  const welcome = mode === "welcome";
  return (
    <Dialog open={open} onOpenChange={welcome ? undefined : onOpenChange}>
      <DialogContent
        showCloseButton={!welcome}
        onInteractOutside={welcome ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={welcome ? (e) => e.preventDefault() : undefined}
        className="overflow-hidden p-0 sm:max-w-[480px]"
      >
        {/* Keyed so every opening starts from the saved values. */}
        {open && (
          <ProfileForm
            key={`${mode}-${settings.updatedAt}`}
            welcome={welcome}
            initialName={welcome && settings.customerName === "Guest" ? "" : settings.customerName}
            initialOrg={settings.organization}
            onDone={() => onOpenChange(false)}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ProfileForm({
  welcome,
  initialName,
  initialOrg,
  onDone,
}: {
  welcome: boolean;
  initialName: string;
  initialOrg: string;
  onDone: () => void;
}) {
  const save = useUpdateSettings();
  const greet = useGreeting() ?? "Hello";
  const [name, setName] = useState(initialName);
  const [org, setOrg] = useState(initialOrg);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const trimmed = name.trim();
  const nameError = !trimmed
    ? "Please enter your name."
    : trimmed.length > NAME_MAX
      ? `Keep it under ${NAME_MAX} characters.`
      : null;
  const orgError = org.trim().length > ORG_MAX ? `Keep it under ${ORG_MAX} characters.` : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || orgError) return;
    try {
      await save.mutateAsync({ customerName: trimmed, organization: org.trim(), onboarded: true });
      toast.success(welcome ? `Welcome aboard, ${firstName(trimmed)}.` : "Profile updated.");
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Couldn't save. Try again.");
    }
  };

  const skip = async () => {
    await save.mutateAsync({ customerName: "Guest", onboarded: true });
    onDone();
  };

  return (
    <form onSubmit={submit} noValidate>
      {welcome && (
        <div className="relative overflow-hidden border-b border-border bg-background px-7 pt-7 pb-6">
          <DepthBackdrop />
          <div className="relative flex flex-col gap-4">
            <BrandMark size={40} />
            <MaskedText
              as="p"
              text={[`Welcome to ${APP_NAME}`]}
              className="font-heading text-[26px] leading-tight font-semibold tracking-tight text-ink"
            />
            <p className="max-w-sm leading-relaxed text-ink-2">
              Evaluate vendor proposals against your RFP and standards, with evidence behind every
              finding.
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 px-7 py-6">
        <DialogHeader className={welcome ? "gap-1" : undefined}>
          <DialogTitle className={welcome ? "text-base" : undefined}>
            {welcome ? "Tell us who you are" : "Edit profile"}
          </DialogTitle>
          <DialogDescription>
            {welcome
              ? "No account needed. Your name and organization personalise the workspace and the tab title."
              : "Shown in the header, the greeting and the browser tab."}
          </DialogDescription>
        </DialogHeader>
        <Field label="Your name" error={touched ? nameError : null}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="e.g. Layla Mansour"
            autoComplete="name"
            dir="auto"
            maxLength={NAME_MAX + 20}
          />
        </Field>
        <Field
          label="Organization"
          optional
          error={orgError}
          hint={
            trimmed
              ? `${greet}, ${firstName(trimmed)}: that's how ${APP_NAME} will greet you.`
              : undefined
          }
        >
          <Input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder="e.g. Northern Gulf Ports Authority"
            autoComplete="organization"
            dir="auto"
            maxLength={ORG_MAX + 20}
          />
        </Field>
        {serverError && <p className="text-xs text-fail">{serverError}</p>}
      </div>

      <DialogFooter className="m-0 rounded-none px-7 sm:justify-between">
        {welcome ? (
          <Button type="button" variant="ghost" onClick={skip} disabled={save.isPending}>
            Skip for now
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={save.isPending}>
          {welcome ? (
            <>
              Enter workspace <ArrowRight />
            </>
          ) : (
            "Save changes"
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
