"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CircleAlert, ClipboardPaste } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PriorityPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import { useBulkCreateRules } from "@/hooks/use-standards";
import { ApiClientError } from "@/lib/api-client";
import type { StandardDetailDto } from "@/lib/api-types";
import { parseRules } from "@/lib/rules-parse";

const EXAMPLE = `SEC-01 | All customs data is stored and processed in-country. | mandatory
SEC-02 | Multi-factor authentication for administrators. | M
Backups are encrypted and kept on a second site. | important`;

export function PasteRulesDialog({
  open,
  onOpenChange,
  standard,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  standard: StandardDetailDto;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent scrollable className="sm:max-w-3xl">
        {open && <PasteBody standard={standard} onDone={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}

function PasteBody({ standard, onDone }: { standard: StandardDetailDto; onDone: () => void }) {
  const bulk = useBulkCreateRules(standard.id);
  const [text, setText] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const { rules, errors } = useMemo(() => {
    const parsed = parseRules(text);
    const existing = new Set(standard.rules.map((r) => r.code.toUpperCase()));
    const clash = parsed.rules.filter((r) => r.code && existing.has(r.code.toUpperCase()));
    return {
      rules: parsed.rules.filter((r) => !clash.includes(r)),
      errors: [
        ...parsed.errors,
        ...clash.map((r) => ({
          line: r.line,
          raw: r.text,
          message: `Code ${r.code} already exists in this standard.`,
        })),
      ].sort((a, b) => a.line - b.line),
    };
  }, [text, standard.rules]);

  const submit = async () => {
    try {
      await bulk.mutateAsync(
        rules.map(({ code, text: t, priority }) => ({ code, text: t, priority })),
      );
      toast.success(
        `${rules.length} rule${rules.length === 1 ? "" : "s"} added to ${standard.code}.`,
      );
      onDone();
    } catch (err) {
      setServerError(err instanceof ApiClientError ? err.message : "Couldn't add the rules.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Paste rules</DialogTitle>
        <DialogDescription>
          One rule per line:{" "}
          <code className="font-mono text-ink-2">CODE | rule text | priority</code>. Priority is
          mandatory, important or desirable (or M / I / D). The code is optional and generated if
          empty. Rows copied from Excel or Word tables (tab-separated) work too.
        </DialogDescription>
      </DialogHeader>
      <DialogBody>
        <Textarea
          aria-label="Rules to paste"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setServerError(null);
          }}
          placeholder={EXAMPLE}
          rows={8}
          autoFocus
          className="font-mono text-[13px] leading-relaxed"
        />

        {(rules.length > 0 || errors.length > 0) && (
          <div className="flex flex-col rounded-lg border border-border">
            {errors.length > 0 && (
              <ul
                className="flex flex-col gap-1.5 border-b border-border bg-fail-soft/40 px-4 py-3"
                aria-label="Lines with problems"
              >
                {errors.map((e) => (
                  <li
                    key={`${e.line}-${e.message}`}
                    className="flex items-start gap-2 text-xs text-fail"
                  >
                    <CircleAlert className="mt-px size-3.5 shrink-0" aria-hidden />
                    <span>
                      <strong>Line {e.line}:</strong> {e.message}
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {rules.length > 0 && (
              <table className="w-full text-[13px]">
                <caption className="sr-only">Preview of rules to add</caption>
                <thead>
                  <tr className="text-start text-xs text-ink-muted">
                    <th className="px-4 py-2 text-start font-medium">Code</th>
                    <th className="px-2 py-2 text-start font-medium">Rule</th>
                    <th className="px-4 py-2 text-end font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((r) => (
                    <tr key={r.line} className="border-t border-border/70 align-top">
                      <td className="px-4 py-2 font-mono text-xs whitespace-nowrap text-ink-2">
                        {r.code ?? <span className="text-ink-faint">auto</span>}
                      </td>
                      <td className="px-2 py-2 text-ink" dir="auto">
                        {r.text}
                      </td>
                      <td className="px-4 py-2 text-end">
                        <PriorityPill priority={r.priority} size="sm" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
        {serverError && <p className="text-xs text-fail">{serverError}</p>}
      </DialogBody>

      <DialogFooter>
        <span className="me-auto self-center text-xs text-ink-muted">
          {rules.length} ready{errors.length ? ` · ${errors.length} to fix` : ""}
        </span>
        <Button variant="ghost" onClick={onDone}>
          Cancel
        </Button>
        <Button
          onClick={submit}
          disabled={rules.length === 0 || errors.length > 0}
          loading={bulk.isPending}
        >
          <ClipboardPaste /> Add {rules.length || ""} rule{rules.length === 1 ? "" : "s"}
        </Button>
      </DialogFooter>
    </>
  );
}
