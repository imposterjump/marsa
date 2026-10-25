"use client";

import { useState } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "./button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./dialog";
import { Input } from "./input";
import { useT } from "@/components/i18n-provider";

interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: React.ReactNode;
  confirmLabel: string;
  onConfirm: () => Promise<unknown> | void;
  /** Require typing this exact text before the destructive button enables (e.g. a code). */
  typeToConfirm?: string;
  destructive?: boolean;
}

/** Confirmation for irreversible actions. Keyed by `open` so the typed text resets each time. */
export function ConfirmDialog(props: ConfirmDialogProps) {
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent>{props.open && <ConfirmBody {...props} />}</DialogContent>
    </Dialog>
  );
}

function ConfirmBody({
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  typeToConfirm,
  destructive = true,
}: ConfirmDialogProps) {
  const t = useT();
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const ready = !typeToConfirm || typed.trim().toUpperCase() === typeToConfirm.toUpperCase();

  return (
    <>
      <DialogHeader>
        <div className="flex items-start gap-3">
          {destructive && (
            <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-fail-soft text-fail">
              <TriangleAlert className="size-[18px]" aria-hidden />
            </span>
          )}
          <div className="flex flex-col gap-1.5">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </div>
        </div>
      </DialogHeader>
      {typeToConfirm && (
        <label className="flex flex-col gap-2 text-[13px] text-ink-2">
          <span>
            {t("Type {word} to confirm", {
              word: <strong className="font-mono text-ink">{typeToConfirm}</strong>,
            })}
          </span>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} autoFocus />
        </label>
      )}
      <DialogFooter>
        <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={busy}>
          {t("Cancel")}
        </Button>
        <Button
          variant={destructive ? "destructive" : "default"}
          disabled={!ready}
          loading={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onConfirm();
              onOpenChange(false);
            } finally {
              setBusy(false);
            }
          }}
        >
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}
