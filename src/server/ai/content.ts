/**
 * User-turn content for each step (RDD §5.2, §7.3, P6.3). Order and cache breakpoints:
 *
 *   [A] RFP documents + project notes          ┐
 *   [B] standards: rules as text + documents   ┘ ① shared by every step
 *   [C] evaluation checklist (JSON)              ② every step after the checklist
 *   [D] this vendor's documents                  ③ analyze + risk of the same vendor
 *   [E] analyses / scores (compare, risk, summary)
 *   [F] the step's task text (uncached, last)
 *
 * PDFs and images go to Claude natively through Files API ids; DOCX/XLSX/text documents are sent
 * as plain-text document blocks built from the text extracted at upload. Every byte before a
 * breakpoint must be identical between steps, so nothing here may depend on time or step order.
 */
import type Anthropic from "@anthropic-ai/sdk";
import { OUTPUT_FIELD, type ChecklistOutput } from "./schemas";
import type { AnalysisDigest, RunContext, SourceDoc, StepInput, VendorContext } from "./types";
import {
  analyzeTask,
  answerIn,
  checklistTask,
  compareTask,
  riskTask,
  summaryTask,
} from "./prompts";

export type Block = Anthropic.Beta.BetaContentBlockParam;

const IMAGE_EXTS = new Set(["png", "jpg", "jpeg", "gif", "webp"]);
export const isNativeDoc = (d: Pick<SourceDoc, "ext">) => d.ext === "pdf" || IMAGE_EXTS.has(d.ext);

const text = (t: string): Block => ({ type: "text", text: t });

/** Put a cache breakpoint on the last block of a section (max 4 per request; we use 3). */
function cached(blocks: Block[]): Block[] {
  const last = blocks.at(-1);
  if (!last) return blocks;
  return [...blocks.slice(0, -1), { ...last, cache_control: { type: "ephemeral" } } as Block];
}

export function docBlocks(doc: SourceDoc): Block[] {
  if (!doc.aiReadable) {
    return [
      text(`[${doc.title}: this file type can't be read, so it is not part of the evaluation.]`),
    ];
  }
  if (isNativeDoc(doc)) {
    if (!doc.fileId) throw new Error(`Document ${doc.id} has no Files API id (upload it first).`);
    if (doc.ext === "pdf") {
      return [
        { type: "document", source: { type: "file", file_id: doc.fileId }, title: doc.title },
      ];
    }
    return [
      text(`Image: ${doc.title}`),
      { type: "image", source: { type: "file", file_id: doc.fileId } },
    ];
  }
  if (doc.textContent) {
    return [
      {
        type: "document",
        source: { type: "text", media_type: "text/plain", data: doc.textContent },
        title: doc.title,
      },
    ];
  }
  return [text(`[${doc.title}: no readable text was found in this file.]`)];
}

function rfpSection(ctx: RunContext): Block[] {
  const p = ctx.project;
  const head = [
    `# Section A: RFP documents`,
    `Tender ${p.code}: ${p.name}`,
    p.category ? `Category: ${p.category}` : "",
    p.deadline ? `Submission deadline: ${p.deadline}` : "",
    p.description ? `Description: ${p.description}` : "",
    p.notes ? `Customer's evaluation notes (sourceType "notes"):\n${p.notes}` : "",
    `Documents (${ctx.rfpDocs.length}): ${ctx.rfpDocs.map((d) => d.title).join("; ")}`,
  ].filter(Boolean);
  return [text(head.join("\n")), ...ctx.rfpDocs.flatMap(docBlocks)];
}

function standardsSection(ctx: RunContext): Block[] {
  if (!ctx.standards.length) {
    return [text("# Section B: Standards\nNo standards are applied to this tender.")];
  }
  const out: Block[] = [
    text(`# Section B: Standards applied to this tender (${ctx.standards.length})`),
  ];
  for (const s of ctx.standards) {
    const rules = s.rules.map((r) => `- ${r.code} [${r.priority}] ${r.text}`).join("\n");
    out.push(
      text(
        `## Standard ${s.code}: ${s.title} (${s.category})\nRules:\n${rules || "(no rules listed)"}` +
          (s.docs.length ? `\nReference documents: ${s.docs.map((d) => d.title).join("; ")}` : ""),
      ),
      ...s.docs.flatMap(docBlocks),
    );
  }
  return out;
}

/** Canonical checklist text: built from persisted rows, so every step sends identical bytes. */
export function checklistSection(checklist: ChecklistOutput): Block[] {
  return [
    text(
      `# Section C: Evaluation checklist (${checklist.requirements.length} requirements)\n` +
        JSON.stringify(checklist),
    ),
  ];
}

function vendorSection(v: VendorContext): Block[] {
  return [
    text(
      `# Section D: Proposal from ${v.name}\nDocuments (${v.docs.length}): ${v.docs.map((d) => d.title).join("; ")}`,
    ),
    ...v.docs.flatMap(docBlocks),
  ];
}

/** Compact analysis for later steps: computed scores + findings without the long prose. */
export function digestForPrompt(a: AnalysisDigest) {
  return {
    vendor: a.vendor,
    complianceScorePct: a.scorePct,
    mandatoryFailures: a.mandatoryFailures,
    statusCounts: a.counts,
    categoryScores: a.categoryScores,
    summary: a.analysis.summary,
    strengths: a.analysis.strengths,
    weaknesses: a.analysis.weaknesses,
    commercial: a.analysis.commercial,
    findings: a.analysis.findings.map((f) => ({
      code: f.code,
      status: f.status,
      assessment: f.assessment,
      gap: f.gap,
    })),
  };
}

function analysesSection(title: string, payload: unknown): Block[] {
  return [text(`# Section E: ${title}\n${JSON.stringify(payload)}`)];
}

export function buildContent(input: StepInput): Block[] {
  const blocks = stepBlocks(input);
  const task = blocks.at(-1) as { type: "text"; text: string };
  return [...blocks.slice(0, -1), text(`${task.text}\n\n${answerIn(OUTPUT_FIELD[input.phase])}`)];
}

/** [A] + [B] with breakpoint ①: the tender as every step (and the bid generator) sees it. */
export function tenderBlocks(ctx: RunContext): Block[] {
  return cached([...rfpSection(ctx), ...standardsSection(ctx)]);
}

function stepBlocks(input: StepInput): Block[] {
  const shared = tenderBlocks(input.ctx);
  switch (input.phase) {
    case "checklist": {
      const codes = input.ctx.standards.flatMap((s) => s.rules.map((r) => r.code));
      return [...shared, text(checklistTask(codes))];
    }
    case "analyze":
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...cached(vendorSection(input.vendor)),
        text(analyzeTask(input.vendor.name, input.checklist.requirements.length)),
      ];
    case "compare": {
      const others = input.analyses.filter((a) => a.proposalId !== input.vendor.proposalId);
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...analysesSection("Analyses of all proposals", input.analyses.map(digestForPrompt)),
        text(
          compareTask(
            input.vendor.name,
            others.map((a) => a.vendor),
          ),
        ),
      ];
    }
    case "risk":
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...cached(vendorSection(input.vendor)),
        ...analysesSection(`Analysis of ${input.vendor.name}`, digestForPrompt(input.analysis)),
        text(riskTask(input.vendor.name)),
      ];
    case "summary":
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...analysesSection("Analyses, comparisons and risk registers", {
          analyses: input.analyses.map(digestForPrompt),
          comparisons: input.comparisons,
          risks: input.risks,
        }),
        text(
          summaryTask(
            input.analyses.map((a) => a.vendor),
            input.missing,
          ),
        ),
      ];
  }
}

/** Documents a step sends natively (they need Files API ids before the call). */
export function nativeDocsFor(input: StepInput): SourceDoc[] {
  const docs = [...input.ctx.rfpDocs, ...input.ctx.standards.flatMap((s) => s.docs)];
  if (input.phase === "analyze" || input.phase === "risk") docs.push(...input.vendor.docs);
  return docs.filter((d) => d.aiReadable && isNativeDoc(d));
}
