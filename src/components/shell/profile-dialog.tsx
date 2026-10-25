"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { useT } from "@/components/i18n-provider";
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
  const t = useT();
  const save = useUpdateSettings();
  const greeting = useGreeting();
  const greet = greeting ? t(greeting) : t("Hello");
  const [name, setName] = useState(initialName);
  const [org, setOrg] = useState(initialOrg);
  const [touched, setTouched] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const trimmed = name.trim();
  const nameError = !trimmed
    ? t("Please enter your name.")
    : trimmed.length > NAME_MAX
      ? t("Keep it under {n} characters.", { n: NAME_MAX })
      : null;
  const orgError =
    org.trim().length > ORG_MAX ? t("Keep it under {n} characters.", { n: ORG_MAX }) : null;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched(true);
    if (nameError || orgError) return;
    try {
      await save.mutateAsync({ customerName: trimmed, organization: org.trim(), onboarded: true });
      toast.success(
        welcome
          ? t("Welcome aboard, {name}.", { name: firstName(trimmed) })
          : t("Profile updated."),
      );
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : t("Couldn't save. Try again."));
    }
  };

  const skip = async () => {
    // Stored as "Guest" (data); shown translated in the header.
    await save.mutateAsync({ customerName: "Guest", onboarded: true }); // i18n-ignore
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
              text={[t("Welcome to {app}", { app: t.appName })]}
              className="font-heading text-[26px] leading-tight font-semibold tracking-tight text-ink"
            />
            <p className="max-w-sm leading-relaxed text-ink-2">
              {t(
                "Evaluate vendor proposals against your RFP and standards, with evidence behind every finding.",
              )}
            </p>
          </div>
        </div>
      )}

      <div className="flex flex-col gap-5 px-7 py-6">
        <DialogHeader className={welcome ? "gap-1" : undefined}>
          <DialogTitle className={welcome ? "text-base" : undefined}>
            {welcome ? t("Tell us who you are") : t("Edit profile")}
          </DialogTitle>
          <DialogDescription>
            {welcome
              ? t(
                  "No account needed. Your name and organization personalise the workspace and the tab title.",
                )
              : t("Shown in the header, the greeting and the browser tab.")}
          </DialogDescription>
        </DialogHeader>
        <Field label={t("Your name")} error={touched ? nameError : null}>
          <Input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder={t("e.g. Layla Mansour")}
            autoComplete="name"
            dir="auto"
            maxLength={NAME_MAX + 20}
          />
        </Field>
        <Field
          label={t("Organization")}
          optional
          error={orgError}
          hint={
            trimmed
              ? t("{greeting}, {name}: that's how {app} will greet you.", {
                  greeting: greet,
                  name: firstName(trimmed),
                  app: t.appName,
                })
              : undefined
          }
        >
          <Input
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            placeholder={t("e.g. Northern Gulf Ports Authority")}
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
            {t("Skip for now")}
          </Button>
        ) : (
          <Button type="button" variant="ghost" onClick={onDone}>
            {t("Cancel")}
          </Button>
        )}
        <Button type="submit" loading={save.isPending}>
          {welcome ? (
            <>
              {t("Enter workspace")} <ArrowRight className="rtl:rotate-180" />
            </>
          ) : (
            t("Save changes")
          )}
        </Button>
      </DialogFooter>
    </form>
  );
}
