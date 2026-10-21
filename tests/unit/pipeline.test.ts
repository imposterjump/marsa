/**
 * P6.2–P6.6 unit tests: output schemas → JSON schema, validation + enum normalisation, the
 * standard-rule safety net, content blocks and cache breakpoints, prompts, planner, ETA, cost,
 * risk severity, and the store's pure helpers.
 */
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { buildContent, docBlocks, nativeDocsFor, type Block } from "@/server/ai/content";
import { keywords, seeded, splitSentences } from "@/server/ai/mock";
import { analyzeTask, checklistTask, systemPrompt } from "@/server/ai/prompts";
import { AiError, normalizeEnums, parseStepOutput } from "@/server/ai/result";
import {
  AnalysisSchema,
  ChecklistSchema,
  RiskSchema,
  OUTPUT_FIELD,
  STEP_SCHEMAS,
  OUTPUT_SCHEMA,
  fromWire,
  type AnalysisOutput,
  ensureStandardRules,
  normalizeChecklist,
  normalizeRisks,
  type ChecklistOutput,
} from "@/server/ai/schemas";
import type { AnalysisDigest, RunContext, SourceDoc } from "@/server/ai/types";
import {
  alignFindings,
  matchEvidenceDoc,
  matchVendor,
  outcomeOf,
  type StepRow,
} from "@/server/runs/store";
import { costFromUsage, etaSeconds, joinNames, planSteps } from "@/lib/plan";
import { maxSeverity, riskSeverity } from "@/lib/scoring";

const doc = (over: Partial<SourceDoc>): SourceDoc => ({
  id: "doc_1",
  title: "RFP: main.pdf",
  name: "main.pdf",
  kind: "rfp",
  ext: "pdf",
  mimeType: "application/pdf",
  storagePath: "x",
  pageCount: 10,
  textContent: null,
  aiReadable: true,
  fileId: "file_1",
  ...over,
});

const ctx: RunContext = {
  project: {
    code: "PRJ-1",
    name: "Scanners",
    description: "",
    notes: "Prefer local support.",
    category: "General",
    deadline: null,
  },
  rfpDocs: [
    doc({}),
    doc({
      id: "doc_2",
      title: "RFP: annex.xlsx",
      name: "annex.xlsx",
      ext: "xlsx",
      fileId: null,
      textContent: "| a | b |",
    }),
  ],
  standards: [
    {
      id: "std_1",
      code: "STD-1",
      title: "Security",
      category: "IT & security",
      rules: [
        { code: "SEC-01", text: "Data stays in country.", priority: "mandatory" },
        { code: "SEC-02", text: "MFA for admins.", priority: "important" },
      ],
      docs: [
        doc({
          id: "doc_3",
          title: "Standard STD-1: std.pdf",
          name: "std.pdf",
          kind: "standard",
          fileId: "file_3",
        }),
      ],
    },
  ],
  vendors: [
    {
      proposalId: "prp_a",
      name: "Atlas",
      submittedAt: "",
      docs: [
        doc({
          id: "doc_a",
          title: "Atlas technical: a.pdf",
          name: "a.pdf",
          kind: "technical",
          fileId: "file_a",
        }),
      ],
    },
    {
      proposalId: "prp_b",
      name: "Nile",
      submittedAt: "",
      docs: [
        doc({
          id: "doc_b",
          title: "Nile technical: b.docx",
          name: "b.docx",
          kind: "technical",
          ext: "docx",
          fileId: null,
          textContent: "We comply.",
        }),
      ],
    },
  ],
  reportLanguage: "en",
};

const checklist: ChecklistOutput = {
  requirements: [
    {
      code: "REQ-001",
      title: "Resolution",
      description: "5 mm",
      category: "technical",
      priority: "mandatory",
      sourceType: "rfp",
      sourceRef: "RFP §4",
      acceptance: "spec sheet",
    },
    {
      code: "REQ-002",
      title: "Data residency",
      description: "In country",
      category: "security",
      priority: "mandatory",
      sourceType: "standard",
      sourceRef: "SEC-01",
      acceptance: "architecture",
    },
  ],
  keyConstraints: [{ label: "Hosting", value: "On-premise" }],
};

const cacheMarks = (blocks: Block[]) =>
  blocks.map((b, i) => ("cache_control" in b && b.cache_control ? i : -1)).filter((i) => i >= 0);

describe("output schemas (P6.2)", () => {
  it("every step schema compiles to an output_config.format JSON schema", () => {
    for (const [phase, schema] of Object.entries(STEP_SCHEMAS)) {
      const f = betaZodOutputFormat(schema);
      expect(f.type, phase).toBe("json_schema");
      expect(JSON.stringify(f.schema)).not.toContain('"optional"');
    }
  });

  it("live steps share two output formats grouped by what they re-read (prompt cache)", () => {
    expect(OUTPUT_SCHEMA.checklist).toBe(OUTPUT_SCHEMA.analyze);
    expect(OUTPUT_SCHEMA.analyze).toBe(OUTPUT_SCHEMA.risk);
    expect(OUTPUT_SCHEMA.compare).toBe(OUTPUT_SCHEMA.summary);
    for (const [phase, schema] of Object.entries(OUTPUT_SCHEMA)) {
      const f = betaZodOutputFormat(schema);
      const props = (f.schema as { properties: Record<string, unknown> }).properties;
      expect(Object.keys(props), phase).toContain(OUTPUT_FIELD[phase as keyof typeof OUTPUT_FIELD]);
      // API limit (P6.10, 400 invalid_request_error): at most 16 nullable / union fields.
      let unions = 0;
      const walk = (node: unknown) => {
        if (Array.isArray(node)) return node.forEach(walk);
        if (!node || typeof node !== "object") return;
        const o = node as Record<string, unknown>;
        if (Array.isArray(o.anyOf) || Array.isArray(o.type)) unions++;
        Object.values(o).forEach(walk);
      };
      walk(f.schema);
      expect(unions, phase).toBeLessThanOrEqual(16);
    }
    const parsed = parseStepOutput(
      OUTPUT_SCHEMA.summary,
      JSON.stringify({
        comparison: null,
        summary: {
          ranking: [],
          recommendedVendor: "",
          executiveSummary: "x",
          conditions: [],
          negotiationPoints: [],
        },
      }),
    );
    expect(parsed.summary?.executiveSummary).toBe("x");
    expect(parsed.comparison).toBeNull();
  });

  it("validates fixtures and normalises enum spelling drift", () => {
    const raw = JSON.stringify({
      findings: [
        {
          code: "REQ-001",
          status: "Non-Compliant",
          vendorResponse: "4 mm",
          evidenceQuote: "q",
          evidenceDocument: "d",
          evidencePage: 3,
          evidenceSection: null,
          assessment: "a",
          gap: "g",
          confidence: "High",
        },
      ],
      summary: "s",
      strengths: [],
      weaknesses: [],
      commercial: {
        totalPrice: null,
        currency: null,
        paymentTerms: null,
        deliveryTime: null,
        warranty: null,
        validity: null,
        exclusions: [],
      },
    });
    const out = parseStepOutput(AnalysisSchema, raw);
    expect(out.findings[0].status).toBe("non_compliant");
    expect(out.findings[0].confidence).toBe("high");
    expect(normalizeEnums({ a: { status: "Not addressed" } })).toEqual({
      a: { status: "not_addressed" },
    });
  });

  it("rejects invalid JSON and wrong shapes with invalid_output", () => {
    expect(() => parseStepOutput(ChecklistSchema, "{nope")).toThrow(AiError);
    try {
      parseStepOutput(RiskSchema, JSON.stringify({ overall: "extreme", risks: [] }));
    } catch (e) {
      expect((e as AiError).code).toBe("invalid_output");
    }
  });

  it("clamps likelihood/impact and fixes requirement codes", () => {
    const r = normalizeRisks({
      overall: "high",
      risks: [
        {
          title: "t",
          category: "security",
          likelihood: 9,
          impact: 0,
          description: "",
          consequence: "",
          mitigation: "",
          evidence: null,
          requirementCodes: [],
        },
      ],
    });
    expect([r.risks[0].likelihood, r.risks[0].impact]).toEqual([5, 1]);
    const c = normalizeChecklist({
      ...checklist,
      requirements: [
        { ...checklist.requirements[0], code: "req-1" },
        { ...checklist.requirements[1], code: "REQ-001" },
      ],
    });
    expect(c.requirements.map((x) => x.code)).toEqual(["REQ-001", "REQ-002"]);
  });

  it("appends standard rules the checklist forgot (and only those)", () => {
    const { checklist: out, appended } = ensureStandardRules(checklist, ctx.standards);
    expect(appended).toEqual(["SEC-02"]);
    const added = out.requirements.at(-1)!;
    expect(added).toMatchObject({
      code: "REQ-003",
      sourceType: "standard",
      sourceRef: "SEC-02",
      priority: "important",
      category: "security",
    });
    // "SEC-01" cited inside a longer reference still counts; "SEC-010" would not.
    const cited = ensureStandardRules(
      {
        ...checklist,
        requirements: [{ ...checklist.requirements[1], sourceRef: "RFP §4.6; SEC-01" }],
      },
      [{ ...ctx.standards[0], rules: [ctx.standards[0].rules[0]] }],
    );
    expect(cited.appended).toEqual([]);
  });
});

describe("content blocks and cache breakpoints (P6.3)", () => {
  it("checklist step: shared RFP + standards prefix with one breakpoint, task last", () => {
    const blocks = buildContent({ phase: "checklist", ctx });
    expect(cacheMarks(blocks)).toEqual([blocks.length - 2]);
    expect(blocks.at(-1)).toMatchObject({ type: "text" });
    expect((blocks.at(-1) as { text: string }).text).toContain("SEC-01, SEC-02");
    expect((blocks.at(-1) as { text: string }).text).toContain('Answer in the "checklist" field');
    const pdf = blocks.find(
      (b) => b.type === "document" && "source" in b && b.source.type === "file",
    );
    expect(pdf).toMatchObject({
      source: { type: "file", file_id: "file_1" },
      title: "RFP: main.pdf",
    });
    const text = blocks.find(
      (b) => b.type === "document" && "source" in b && b.source.type === "text",
    );
    expect(text).toMatchObject({ title: "RFP: annex.xlsx", source: { data: "| a | b |" } });
  });

  it("analyze and risk share the prefix up to breakpoint ③ (same vendor)", () => {
    const analyze = buildContent({ phase: "analyze", ctx, checklist, vendor: ctx.vendors[0] });
    expect(cacheMarks(analyze)).toHaveLength(3);
    const digest: AnalysisDigest = {
      proposalId: "prp_a",
      vendor: "Atlas",
      scorePct: 50,
      mandatoryFailures: 1,
      counts: { compliant: 1, partial: 0, non_compliant: 1, not_addressed: 0 },
      categoryScores: {},
      analysis: {
        findings: [],
        summary: "",
        strengths: [],
        weaknesses: [],
        commercial: {
          totalPrice: null,
          currency: null,
          paymentTerms: null,
          deliveryTime: null,
          warranty: null,
          validity: null,
          exclusions: [],
        },
      },
    };
    const risk = buildContent({
      phase: "risk",
      ctx,
      checklist,
      vendor: ctx.vendors[0],
      analysis: digest,
    });
    const third = cacheMarks(analyze)[2];
    expect(JSON.stringify(risk.slice(0, third + 1))).toBe(
      JSON.stringify(analyze.slice(0, third + 1)),
    );
    // Other steps of other vendors share ① and ②.
    const other = buildContent({ phase: "analyze", ctx, checklist, vendor: ctx.vendors[1] });
    const second = cacheMarks(analyze)[1];
    expect(JSON.stringify(other.slice(0, second + 1))).toBe(
      JSON.stringify(analyze.slice(0, second + 1)),
    );
  });

  it("native documents need a Files API id; unreadable files become a note", () => {
    expect(() => docBlocks(doc({ fileId: null }))).toThrow(/no Files API id/);
    expect(docBlocks(doc({ aiReadable: false }))[0]).toMatchObject({ type: "text" });
    const img = docBlocks(doc({ ext: "png", fileId: "file_img" }));
    expect(img[1]).toMatchObject({ type: "image", source: { type: "file", file_id: "file_img" } });
    expect(
      nativeDocsFor({ phase: "analyze", ctx, checklist, vendor: ctx.vendors[1] }).map((d) => d.id),
    ).toEqual(["doc_1", "doc_3"]);
  });
});

describe("prompts (P6.4)", () => {
  it("system prompt is stable per language and has no dates or ids", () => {
    expect(systemPrompt("en")).toBe(systemPrompt("en"));
    expect(systemPrompt("ar")).toContain("Modern Standard Arabic");
    expect(systemPrompt("en")).not.toMatch(/\d{4}-\d{2}-\d{2}|prj_|run_/);
    expect(systemPrompt("en")).toMatchSnapshot();
  });

  it("task prompts spell out allowed values and counts", () => {
    expect(analyzeTask("Atlas", 42)).toContain("exactly 42 findings");
    expect(analyzeTask("Atlas", 42)).toContain('"non_compliant"');
    expect(checklistTask(["SEC-01"])).toContain("SEC-01");
    expect(checklistTask([])).toContain("No standards are applied");
  });
});

describe("planner, ETA and cost (P6.5)", () => {
  const vendors = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ proposalId: `p${i}`, name: `V${i + 1}` }));
  it.each([1, 2, 3, 10])("plans 3N + 2 steps for N = %i", (n) => {
    const steps = planSteps(vendors(n), 2);
    expect(steps).toHaveLength(3 * n + 2);
    expect(steps.map((s) => s.seq)).toEqual(steps.map((_, i) => i + 1));
    expect(steps.filter((s) => s.skipped)).toHaveLength(n === 1 ? 1 : 0);
    expect(steps[0].label).toContain("2 standards");
    expect(steps.at(-1)!.phase).toBe("summary");
  });

  it("labels name the other vendors", () => {
    const steps = planSteps(vendors(3), 1);
    expect(steps.find((s) => s.phase === "compare")!.label).toBe("Comparing V1 against V2 and V3");
    expect(joinNames(["A", "B", "C", "D"])).toBe("the other 4 vendors");
    expect(planSteps(vendors(1), 1)[0].label).toContain("1 standard");
  });

  it("ETA uses measured averages and concurrency", () => {
    const steps = [
      { phase: "checklist" as const, status: "done", durationMs: 40_000 },
      { phase: "analyze" as const, status: "done", durationMs: 100_000 },
      { phase: "analyze" as const, status: "queued", durationMs: null },
      { phase: "analyze" as const, status: "queued", durationMs: null },
      { phase: "summary" as const, status: "queued", durationMs: null },
    ];
    // analyze: 2 queued / 3 at a time = 1 wave × 100 s; summary default 45 s.
    expect(etaSeconds(steps, { concurrency: 3, mode: "live" })).toBe(145);
    expect(etaSeconds(steps, { concurrency: 1, mode: "live" })).toBe(245);
  });

  it("cost from usage uses the price sheet; mock models cost nothing", () => {
    const u = {
      inputTokens: 1_000_000,
      outputTokens: 100_000,
      cacheReadTokens: 2_000_000,
      cacheWriteTokens: 500_000,
    };
    expect(costFromUsage("claude-opus-5-5", u)).toBeCloseTo(4 + 2 + 0.4 + 2.5, 4);
    expect(costFromUsage("mock", u)).toBe(0);
  });
});

describe("scoring: risk severity (P6.6)", () => {
  it.each([
    [1, 4, "low"],
    [1, 5, "moderate"],
    [3, 3, "moderate"],
    [2, 5, "high"],
    [3, 5, "high"],
    [4, 4, "critical"],
    [5, 5, "critical"],
  ] as const)("L%i × I%i → %s", (l, i, s) => {
    expect(riskSeverity(l, i)).toBe(s);
  });
  it("max severity", () => {
    expect(maxSeverity([])).toBe("low");
    expect(maxSeverity(["moderate", "critical", "high"])).toBe("critical");
  });
});

describe("store helpers", () => {
  it("aligns findings to the checklist (missing → not addressed, unknown dropped)", () => {
    const f = {
      status: "compliant" as const,
      vendorResponse: "",
      evidenceQuote: null,
      evidenceDocument: null,
      evidencePage: null,
      evidenceSection: null,
      assessment: "",
      gap: null,
      confidence: "high" as const,
    };
    const { findings, missing } = alignFindings(checklist, {
      findings: [
        { ...f, code: "req-002" },
        { ...f, code: "REQ-999" },
        { ...f, code: "REQ-002", status: "partial" },
      ],
      summary: "",
      strengths: [],
      weaknesses: [],
      commercial: {
        totalPrice: null,
        currency: null,
        paymentTerms: null,
        deliveryTime: null,
        warranty: null,
        validity: null,
        exclusions: [],
      },
    });
    expect(findings.map((x) => [x.code, x.status])).toEqual([
      ["REQ-001", "not_addressed"],
      ["REQ-002", "compliant"],
    ]);
    expect(missing).toEqual(["REQ-001"]);
  });

  it("maps evidence titles and vendor names back to records", () => {
    const docs = ctx.vendors[0].docs;
    expect(matchEvidenceDoc("Atlas technical: a.pdf", docs)?.id).toBe("doc_a");
    expect(matchEvidenceDoc("a.pdf (page 3)", docs)?.id).toBe("doc_a");
    expect(matchEvidenceDoc(null, docs)).toBeNull();
    expect(matchVendor("atlas", ctx.vendors)?.proposalId).toBe("prp_a");
    expect(
      matchVendor("Nile Gate", [{ proposalId: "x", name: "Nile Gate Solutions" }])?.proposalId,
    ).toBe("x");
  });

  it("run outcome from step statuses", () => {
    const s = (phase: StepRow["phase"], status: StepRow["status"]) =>
      ({ phase, status, label: phase, error: null }) as StepRow;
    expect(outcomeOf([s("checklist", "done"), s("summary", "done")]).status).toBe("completed");
    expect(
      outcomeOf([s("checklist", "done"), s("analyze", "failed"), s("summary", "done")]).status,
    ).toBe("completed_with_errors");
    expect(outcomeOf([s("checklist", "failed"), s("summary", "skipped")]).status).toBe("failed");
    expect(outcomeOf([s("checklist", "done"), s("analyze", "cancelled")]).status).toBe("cancelled");
  });
});

describe("mock helpers (P6.9)", () => {
  it("is deterministic and splits real sentences", () => {
    expect(seeded("Atlas|REQ-001")).toBe(seeded("Atlas|REQ-001"));
    expect(seeded("a")).not.toBe(seeded("b"));
    const s = splitSentences(
      "The system shall scan 25 trucks per hour. Operators must log in with MFA; sessions lock after 15 minutes.",
    );
    expect(s).toHaveLength(2);
    expect([...keywords("The system shall provide encryption at rest")]).toEqual(
      ["provide", "encryption", "rest"].filter((w) => w !== "provide"),
    );
  });
});

describe("wire format (P6.10)", () => {
  it('turns "" and 0 back into null', () => {
    const analysis = fromWire("analysis", {
      findings: [
        {
          code: "REQ-001",
          status: "not_addressed",
          vendorResponse: "",
          evidenceQuote: "",
          evidenceDocument: "",
          evidencePage: 0,
          evidenceSection: "",
          assessment: "a",
          gap: "",
          confidence: "low",
        },
      ],
      summary: "",
      strengths: [],
      weaknesses: [],
      commercial: {
        totalPrice: "USD 1",
        currency: "",
        paymentTerms: "",
        deliveryTime: "",
        warranty: "",
        validity: "",
        exclusions: [],
      },
    }) as AnalysisOutput;
    expect(analysis.findings[0]).toMatchObject({
      evidenceQuote: null,
      evidencePage: null,
      evidenceSection: null,
      gap: null,
    });
    expect(analysis.commercial).toMatchObject({ totalPrice: "USD 1", currency: null });
    expect(AnalysisSchema.safeParse(analysis).success).toBe(true);
    const summary = fromWire("summary", {
      ranking: [],
      recommendedVendor: " ",
      executiveSummary: "x",
      conditions: [],
      negotiationPoints: [],
    }) as { recommendedVendor: string | null };
    expect(summary.recommendedVendor).toBeNull();
  });
});
