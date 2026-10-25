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
import { OUTPUT_FIELD, requirementsFor, type ChecklistOutput } from "./schemas";
import type {
  AnalysisDigest,
  AnalysisStepInput,
  RunContext,
  SourceDoc,
  StepInput,
  VendorContext,
} from "./types";
import {
  analyzeTask,
  answerIn,
  checklistTask,
  compareTask,
  reportTask,
  riskTask,
  standardsTask,
  summaryTask,
} from "./prompts";
import { APP_NAME } from "../../lib/brand";

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

export function buildContent(input: AnalysisStepInput): Block[] {
  const blocks = stepBlocks(input);
  const task = blocks.at(-1) as { type: "text"; text: string };
  return [...blocks.slice(0, -1), text(`${task.text}\n\n${answerIn(OUTPUT_FIELD[input.phase])}`)];
}

/** [A] + [B] with breakpoint ①: the tender as every step (and the bid generator) sees it. */
export function tenderBlocks(ctx: RunContext): Block[] {
  return cached([...rfpSection(ctx), ...standardsSection(ctx)]);
}

function stepBlocks(input: AnalysisStepInput): Block[] {
  const shared = input.phase === "summary" ? [] : tenderBlocks(input.ctx);
  switch (input.phase) {
    case "checklist": {
      const codes = input.ctx.standards.flatMap((s) => s.rules.map((r) => r.code));
      return [...shared, text(checklistTask(codes))];
    }
    // Standards and RFP checks of one vendor share ① ② ③: the second reads the first's cache.
    case "standards":
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...cached(vendorSection(input.vendor)),
        text(
          standardsTask(
            input.vendor.name,
            requirementsFor(input.checklist, "standards").map((r) => r.code),
          ),
        ),
      ];
    case "analyze":
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...cached(vendorSection(input.vendor)),
        text(
          analyzeTask(
            input.vendor.name,
            requirementsFor(input.checklist, "rfp").map((r) => r.code),
          ),
        ),
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
    // P8: the recommendation needs the scores and analyses only, not the tender documents.
    case "summary":
      return [
        ...checklistSection(input.checklist),
        ...analysesSection(`${APP_NAME}'s scores and the vendors' analyses`, {
          ranking: input.scores.map((s) => ({
            rank: s.rank,
            vendor: s.vendor,
            standardsCompliancePct: s.standardsPct,
            rfpCompliancePct: s.rfpPct,
            mandatoryRequirementsNotMet: s.mandatoryNotMet,
            riskScore: s.riskScore,
            riskLevel: s.riskLevel,
            overall: s.overall,
          })),
          analyses: input.analyses.map(digestForPrompt),
        }),
        text(summaryTask(input.recommended, input.missing)),
      ];
    // The report reads the bid itself and the tender, like the risk step, with the vendor's
    // evaluation as a reference. Its own output format: ① ② are shared between the vendors'
    // reports, ③ is each vendor's own.
    case "report": {
      const s = input.scores;
      return [
        ...shared,
        ...cached(checklistSection(input.checklist)),
        ...cached(vendorSection(input.vendor)),
        ...analysesSection(`Evaluation of ${input.vendor.name}`, {
          scores: {
            rank: s.rank,
            ofVendors: input.ranked,
            overall: s.overall,
            rfpCompliancePct: s.rfpPct,
            standardsCompliancePct: s.standardsPct,
            mandatoryRequirementsNotMet: s.mandatoryNotMet,
            riskScore: s.riskScore,
            riskLevel: s.riskLevel,
          },
          recommendedVendor: input.recommended,
          // Findings with their evidence, so the report can cite document and page.
          analysis: {
            ...digestForPrompt(input.analysis),
            findings: input.analysis.analysis.findings.map((f) => ({
              code: f.code,
              status: f.status,
              headline: f.headline,
              assessment: f.assessment,
              gap: f.gap,
              evidenceDocument: f.evidenceDocument,
              evidencePage: f.evidencePage,
            })),
          },
          riskRegister: input.risks,
          otherBidPrices: input.otherPrices,
        }),
        text(reportTask(input.vendor.name, input.recommended)),
      ];
    }
  }
}

/** Documents a step sends natively (they need Files API ids before the call). */
export function nativeDocsFor(input: StepInput): SourceDoc[] {
  if (input.phase === "summary" || input.phase === "translate") return [];
  const docs = [...input.ctx.rfpDocs, ...input.ctx.standards.flatMap((s) => s.docs)];
  if (
    input.phase === "standards" ||
    input.phase === "analyze" ||
    input.phase === "risk" ||
    input.phase === "report"
  )
    docs.push(...input.vendor.docs);
  return docs.filter((d) => d.aiReadable && isNativeDoc(d));
}
