"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Reorder, useDragControls } from "motion/react";
import { toast } from "sonner";
import {
  ArrowDown,
  ArrowUp,
  ClipboardPaste,
  GripVertical,
  ListChecks,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { cn } from "cn";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriorityPill } from "@/components/ui/status-pill";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateRule,
  useDeleteRule,
  useReorderRules,
  useUpdateRule,
} from "@/hooks/use-standards";
import { ApiClientError } from "@/lib/api-client";
import type { RuleDto, StandardDetailDto } from "@/lib/api-types";
import { PRIORITIES, type Priority } from "@/lib/domain";
import { PRIORITY_LABEL } from "@/lib/labels";
import { nextRuleCode, RULE_TEXT_MAX } from "@/lib/rules-parse";
import { PasteRulesDialog } from "./paste-rules-dialog";

const CODE_RE = /^[A-Za-z][A-Za-z0-9._-]{0,23}$/;

function suggestCode(standard: StandardDetailDto): string {
  const codes = standard.rules.map((r) => r.code);
  const fromRule = codes[codes.length - 1]?.match(/^([A-Za-z]+)-\d+$/)?.[1];
  return nextRuleCode(fromRule ?? standard.code.split(/[-._]/)[0], codes);
}

export function RulesEditor({ standard }: { standard: StandardDetailDto }) {
  const reorder = useReorderRules(standard.id);
  // Delete/undo live here, not in the row: the row unmounts as soon as the optimistic delete
  // removes it, and TanStack skips per-call callbacks of unmounted components (HANDOFF G-33).
  const removeRule = useDeleteRule(standard.id);
  const restoreRule = useCreateRule(standard.id);
  const deleteWithUndo = (rule: RuleDto) => {
    removeRule
      .mutateAsync(rule.id)
      .then(() =>
        toast(`Rule ${rule.code} deleted`, {
          action: {
            label: "Undo",
            onClick: () => {
              restoreRule
                .mutateAsync({
                  code: rule.code,
                  text: rule.text,
                  priority: rule.priority,
                  sortOrder: rule.sortOrder,
                })
                .then(() => toast.success(`${rule.code} restored.`))
                .catch(() => toast.error(`Couldn't restore ${rule.code}.`));
            },
          },
        }),
      )
      .catch(() => toast.error("Couldn't delete the rule."));
  };
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  // ?rule=SEC-02 (links from analysis results): scroll to that rule and highlight it briefly.
  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("rule");
    const el = code ? document.getElementById(`rule-${code}`) : null;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    el.classList.add("marsa-pulse", "marsa-rule-hit");
    const t = setTimeout(() => el.classList.remove("marsa-pulse", "marsa-rule-hit"), 2600);
    return () => clearTimeout(t);
  }, [standard.rules.length]);

  const byId = useMemo(() => new Map(standard.rules.map((r) => [r.id, r])), [standard.rules]);
  const order = dragOrder ?? standard.rules.map((r) => r.id);
  const counts = PRIORITIES.map(
    (p) => [p, standard.rules.filter((r) => r.priority === p).length] as const,
  );

  const persistOrder = (ids: string[]) => {
    const current = standard.rules.map((r) => r.id);
    if (ids.join() !== current.join())
      reorder.mutate(ids, { onError: () => toast.error("Couldn't save the new order.") });
  };
  const move = (id: string, delta: -1 | 1) => {
    const ids = standard.rules.map((r) => r.id);
    const i = ids.indexOf(id);
    const j = i + delta;
    if (j < 0 || j >= ids.length) return;
    [ids[i], ids[j]] = [ids[j], ids[i]];
    persistOrder(ids);
  };

  return (
    <section
      aria-labelledby="rules-title"
      className="flex flex-col rounded-xl border border-border bg-surface shadow-xs"
    >
      <header className="flex flex-col gap-3 border-b border-border/70 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <h2
            id="rules-title"
            className="font-heading text-base font-semibold tracking-tight text-ink"
          >
            Rules
          </h2>
          <p className="text-[13px] text-ink-muted">
            {standard.rules.length === 0 ? (
              "No rules yet"
            ) : (
              <>
                {standard.rules.length} rules ·{" "}
                {counts
                  .filter(([, n]) => n > 0)
                  .map(([p, n]) => `${n} ${PRIORITY_LABEL[p].toLowerCase()}`)
                  .join(" · ")}
              </>
            )}
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={() => setPasteOpen(true)}>
          <ClipboardPaste /> Paste rules
        </Button>
      </header>

      {standard.rules.length === 0 ? (
        <EmptyState
          art={<ListChecks className="size-10 text-brand" strokeWidth={1.5} />}
          title="Add the first rule"
          description="Type a rule below, or paste many at once (one per line: CODE | text | priority)."
          actions={
            <Button variant="soft" onClick={() => setPasteOpen(true)}>
              <ClipboardPaste /> Paste rules
            </Button>
          }
        />
      ) : (
        <Reorder.Group
          axis="y"
          values={order}
          onReorder={setDragOrder}
          className="flex flex-col"
          aria-label="Rules (drag the handle or use Alt + arrow keys to reorder)"
        >
          {order.map((id, index) => {
            const rule = byId.get(id);
            if (!rule) return null;
            return (
              <RuleRow
                key={id}
                rule={rule}
                index={index}
                total={order.length}
                standardId={standard.id}
                editing={editingId === id}
                onEdit={() => setEditingId(id)}
                onDoneEditing={() => setEditingId(null)}
                onMove={(d) => move(id, d)}
                onDelete={() => deleteWithUndo(rule)}
                onDragEnd={() => {
                  if (dragOrder) persistOrder(dragOrder);
                  setDragOrder(null);
                }}
              />
            );
          })}
        </Reorder.Group>
      )}

      <AddRuleRow standard={standard} />
      <PasteRulesDialog open={pasteOpen} onOpenChange={setPasteOpen} standard={standard} />
    </section>
  );
}

function RuleRow({
  rule,
  index,
  total,
  standardId,
  editing,
  onEdit,
  onDoneEditing,
  onMove,
  onDelete,
  onDragEnd,
}: {
  rule: RuleDto;
  index: number;
  total: number;
  standardId: string;
  editing: boolean;
  onEdit: () => void;
  onDoneEditing: () => void;
  onMove: (delta: -1 | 1) => void;
  onDelete: () => void;
  onDragEnd: () => void;
}) {
  const controls = useDragControls();
  const update = useUpdateRule(standardId);
  const del = onDelete;

  return (
    <Reorder.Item
      value={rule.id}
      dragListener={false}
      dragControls={controls}
      onDragEnd={onDragEnd}
      id={`rule-${rule.code}`}
      className="group/rule relative scroll-mt-24 border-b border-border/70 bg-surface transition-colors duration-700 last:border-b-0"
      whileDrag={{ scale: 1.01, boxShadow: "var(--elev-lg)", zIndex: 5 }}
    >
      {editing ? (
        <RuleEditForm rule={rule} standardId={standardId} onDone={onDoneEditing} />
      ) : (
        <div
          role="group"
          tabIndex={0}
          onKeyDown={(e) => {
            const actions: Record<string, () => void> = {
              ArrowUp: () => e.altKey && onMove(-1),
              ArrowDown: () => e.altKey && onMove(1),
              Enter: onEdit,
              Delete: del,
            };
            if (e.key in actions && (e.altKey || !e.key.startsWith("Arrow"))) {
              e.preventDefault();
              actions[e.key]();
            }
          }}
          aria-label={`Rule ${rule.code}, ${PRIORITY_LABEL[rule.priority]}: ${rule.text}. Enter to edit, Alt+arrows to move, Delete to remove.`}
          className="flex items-start gap-3 px-4 py-3.5 transition-colors outline-none hover:bg-surface-muted/40 focus-visible:bg-brand-soft/30 sm:px-6"
        >
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onPointerDown={(e) => controls.start(e)}
            className="-ms-1.5 mt-0.5 cursor-grab touch-none rounded-sm p-0.5 text-ink-faint opacity-60 transition-opacity group-hover/rule:opacity-100 active:cursor-grabbing"
          >
            <GripVertical className="size-4" />
          </button>
          <span className="mt-0.5 w-14 shrink-0 font-mono text-xs font-medium text-ink-2 sm:w-20">
            {rule.code}
          </span>
          <button
            type="button"
            onClick={onEdit}
            className="min-w-0 flex-1 cursor-text rounded-sm text-start leading-relaxed text-ink outline-none"
            tabIndex={-1}
            dir="auto"
          >
            {rule.text}
          </button>
          <Select
            value={rule.priority}
            onValueChange={(v) => update.mutate({ id: rule.id, priority: v as Priority })}
          >
            <SelectTrigger
              size="sm"
              aria-label={`Priority of ${rule.code}`}
              className="h-7 w-auto shrink-0 border-transparent bg-transparent px-1 shadow-none hover:border-border"
            >
              <SelectValue>
                <span className="sm:hidden">
                  <PriorityPill priority={rule.priority} size="sm" short />
                </span>
                <span className="hidden sm:inline-flex">
                  <PriorityPill priority={rule.priority} size="sm" />
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent align="end">
              {PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {PRIORITY_LABEL[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-xs"
                className="text-ink-muted"
                aria-label={`Actions for rule ${rule.code}`}
              >
                <MoreHorizontal />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={onEdit} className="gap-2.5">
                <Pencil className="size-4 text-ink-muted" /> Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onMove(-1)}
                disabled={index === 0}
                className="gap-2.5"
              >
                <ArrowUp className="size-4 text-ink-muted" /> Move up
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => onMove(1)}
                disabled={index === total - 1}
                className="gap-2.5"
              >
                <ArrowDown className="size-4 text-ink-muted" /> Move down
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive" onSelect={del} className="gap-2.5">
                <Trash2 className="size-4" /> Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </Reorder.Item>
  );
}

function RuleEditForm({
  rule,
  standardId,
  onDone,
}: {
  rule: RuleDto;
  standardId: string;
  onDone: () => void;
}) {
  const update = useUpdateRule(standardId);
  const [code, setCode] = useState(rule.code);
  const [text, setText] = useState(rule.text);
  const [priority, setPriority] = useState<Priority>(rule.priority);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    const c = code.trim().toUpperCase();
    if (!CODE_RE.test(c))
      return setError("Code: letters, digits, - . _ (max 24), starting with a letter.");
    if (!text.trim()) return setError("Rule text is required.");
    try {
      await update.mutateAsync({ id: rule.id, code: c, text: text.trim(), priority });
      onDone();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't save the rule.");
    }
  };

  return (
    <div
      className="flex flex-col gap-3 bg-brand-soft/20 px-4 py-4 sm:px-6"
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          onDone();
        } else if (e.key === "Enter" && !e.shiftKey) {
          e.preventDefault();
          void save();
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row">
        <Input
          aria-label="Rule code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-9 font-mono sm:w-32"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger size="sm" className="h-9 sm:w-40" aria-label="Priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Textarea
        aria-label="Rule text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        autoFocus
        rows={3}
        maxLength={RULE_TEXT_MAX}
        dir="auto"
      />
      {error && <p className="text-xs text-fail">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-ink-muted">
          Enter to save · Shift+Enter for a new line · Esc to cancel
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="ghost" onClick={onDone}>
            Cancel
          </Button>
          <Button size="sm" onClick={save} loading={update.isPending}>
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddRuleRow({ standard }: { standard: StandardDetailDto }) {
  const create = useCreateRule(standard.id);
  const [code, setCode] = useState("");
  const [text, setText] = useState("");
  const [priority, setPriority] = useState<Priority>("important");
  const [error, setError] = useState<string | null>(null);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const suggested = suggestCode(standard);

  const add = async () => {
    const c = code.trim().toUpperCase();
    if (c && !CODE_RE.test(c))
      return setError("Code: letters, digits, - . _ (max 24), starting with a letter.");
    if (!text.trim()) return setError("Write the rule text first.");
    try {
      const rule = await create.mutateAsync({ code: c || null, text: text.trim(), priority });
      setCode("");
      setText("");
      setError(null);
      toast.success(`Rule ${rule.code} added.`);
      textRef.current?.focus();
    } catch (err) {
      setError(err instanceof ApiClientError ? err.message : "Couldn't add the rule.");
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-b-xl border-t border-border/70 bg-surface-muted/40 px-4 py-4 sm:px-6",
      )}
      onKeyDown={(e) => {
        if (e.key === "Enter" && !e.shiftKey && (e.target as HTMLElement).tagName === "TEXTAREA") {
          e.preventDefault();
          void add();
        }
      }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <Input
          aria-label="New rule code (optional)"
          placeholder={suggested}
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          className="h-10 font-mono sm:w-32"
        />
        <Textarea
          ref={textRef}
          aria-label="New rule text"
          placeholder="Write a rule the proposals must meet…"
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            setError(null);
          }}
          rows={1}
          className="min-h-10 flex-1 py-2"
          maxLength={RULE_TEXT_MAX}
          dir="auto"
        />
        <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
          <SelectTrigger className="sm:w-36" aria-label="New rule priority">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PRIORITIES.map((p) => (
              <SelectItem key={p} value={p}>
                {PRIORITY_LABEL[p]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={add} loading={create.isPending} className="h-10">
          <Plus /> Add rule
        </Button>
      </div>
      {error ? (
        <p className="text-xs text-fail">{error}</p>
      ) : (
        <p className="text-xs text-ink-muted">
          Leave the code empty to use <span className="font-mono">{suggested}</span>. Press Enter to
          add.
        </p>
      )}
    </div>
  );
}
