/**
 * P6.2–P6.6 unit tests: output schemas → JSON schema, validation + enum normalisation, the
 * standard-rule safety net, content blocks and cache breakpoints, prompts, planner, ETA, cost,
 * risk severity, and the store's pure helpers.
 */
import { betaZodOutputFormat } from "@anthropic-ai/sdk/helpers/beta/zod";
import { describe, expect, it } from "vitest";
import { buildContent, docBlocks, nativeDocsFor, type Block } from "@/server/ai/content";
import { keywords, seeded, splitSentences } from "@/server/ai/mock";
import { analyzeTask, checklistTask, standardsTask, systemPrompt } from "@/server/ai/prompts";
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
  normalizeAnalysis,
  normalizeChecklist,
  normalizeRisks,
  requirementsFor,
  ruleTitle,
  withStandardRules,
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
import { clauseText, clauseTokens, findToken, stripRunningLines } from "@/server/runs/sources";
import { costFromUsage, etaSeconds, joinNames, planSteps } from "@/lib/plan";
import { maxSeverity, overallValue, riskLevel, riskScore, riskSeverity } from "@/lib/scoring";
import { guessSection, toSection } from "@/lib/sections";

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
      section: "solution",
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
      section: "security",
    },
  ],
  ruleSections: [],
  keyConstraints: [{ label: "Hosting", value: "On-premise" }],
};

const analysisFinding: AnalysisOutput["findings"][number] = {
  code: "REQ-001",
  status: "compliant",
  headline: "Meets the resolution",
  vendorResponse: "5 mm",
  evidenceQuote: null,
  evidenceDocument: null,
  evidencePage: null,
  evidenceSection: null,
  assessment: "",
  gap: null,
  confidence: "high",
};
const emptyCommercial: AnalysisOutput["commercial"] = {
  totalPrice: null,
  currency: null,
  paymentTerms: null,
  deliveryTime: null,
  warranty: null,
  validity: null,
  exclusions: [],
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
          headline: "4 mm instead of 5 mm",
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
          section: "Security & Data",
        },
      ],
    });
    expect([r.risks[0].likelihood, r.risks[0].impact]).toEqual([5, 1]);
    expect(r.risks[0].section).toBe("security");
    const c = normalizeChecklist({
      ...checklist,
      requirements: [
        { ...checklist.requirements[0], code: "req-1", section: "Implementation & timeline" },
        { ...checklist.requirements[0], code: "REQ-001", section: "nonsense" },
        // The model must not copy standard rules: they are added one by one afterwards.
        { ...checklist.requirements[1], code: "REQ-003" },
      ],
    });
    expect(c.requirements.map((x) => x.code)).toEqual(["REQ-001", "REQ-002"]);
    expect(c.requirements.map((x) => x.section)).toEqual(["implementation", "solution"]);
    const a = normalizeAnalysis({
      findings: [{ ...analysisFinding, headline: "  a\n  long   phrase  " }],
      summary: "",
      strengths: [],
      weaknesses: [],
      commercial: emptyCommercial,
    });
    expect(a.findings[0].headline).toBe("a long phrase");
  });

  it("adds every standard rule as its own requirement, filed under a section (P8)", () => {
    const rfpOnly = { ...checklist, requirements: [checklist.requirements[0]] };
    const out = withStandardRules(
      { ...rfpOnly, ruleSections: [{ code: "sec-01", section: "security" }] },
      ctx.standards,
    );
    expect(out.requirements.map((r) => r.code)).toEqual(["REQ-001", "SEC-01", "SEC-02"]);
    expect(out.requirements[1]).toMatchObject({
      sourceType: "standard",
      sourceRef: "SEC-01",
      title: ruleTitle(ctx.standards[0].rules[0].text),
      section: "security",
    });
    expect(ruleTitle("Seals shall log every opening. Logs are kept 5 years.")).toBe(
      "Seals shall log every opening",
    );
    expect(ruleTitle("x ".repeat(80)).length).toBeLessThanOrEqual(90);
    // Without a section from the model, the rule text decides.
    expect(out.requirements[2].section).toBe(guessSection(ctx.standards[0].rules[1].text));
    expect(requirementsFor(out, "standards").map((r) => r.code)).toEqual(["SEC-01", "SEC-02"]);
    expect(requirementsFor(out, "rfp").map((r) => r.code)).toEqual(["REQ-001"]);
    // The same rule code in a second standard gets its standard as a prefix.
    const twice = withStandardRules(rfpOnly, [
      ctx.standards[0],
      { ...ctx.standards[0], code: "PCT-07" },
    ]);
    expect(twice.requirements.map((r) => r.code)).toContain("PCT-07-SEC-01");
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
    const codes = Array.from({ length: 42 }, (_, i) => `REQ-${String(i + 1).padStart(3, "0")}`);
    expect(analyzeTask("Atlas", codes)).toContain("exactly 42 findings");
    expect(analyzeTask("Atlas", codes)).toContain('"non_compliant"');
    expect(analyzeTask("Atlas", codes)).toContain("headline");
    expect(standardsTask("Atlas", ["SEC-01", "SEC-02"])).toContain("exactly 2 findings");
    expect(checklistTask(["SEC-01"])).toContain("SEC-01");
    expect(checklistTask(["SEC-01"])).toContain('"security" (Security & data)');
    expect(checklistTask([])).toContain("No standards are applied");
  });
});

describe("planner, ETA and cost (P6.5)", () => {
  const vendors = (n: number) =>
    Array.from({ length: n }, (_, i) => ({ proposalId: `p${i}`, name: `V${i + 1}` }));
  // P8: checklist → per vendor standards, RFP and risk → recommendation → per vendor report →
  // the Translator.
  it.each([1, 2, 3, 10])("plans 4N + 3 steps for N = %i with standards", (n) => {
    const steps = planSteps(vendors(n), { standards: 2, rules: 26 });
    expect(steps).toHaveLength(4 * n + 3);
    expect(steps.map((s) => s.seq)).toEqual(steps.map((_, i) => i + 1));
    expect(steps.filter((s) => s.skipped)).toHaveLength(0);
    expect(steps.map((s) => s.phase)).not.toContain("compare");
    expect(steps[0].label).toContain("26 rules of 2 standards");
    expect(steps[3 * n + 1].phase).toBe("summary");
    expect(steps.slice(-n - 1, -1).every((s) => s.phase === "report")).toBe(true);
    expect(steps.at(-2)!.label).toBe(`Writing the consultant report on V${n}`);
    expect(steps.at(-1)).toMatchObject({
      phase: "translate",
      proposalId: null,
      label: "Translating the results into Arabic",
    });
  });

  it("without standards there is no standards phase (3N + 3)", () => {
    const steps = planSteps(vendors(3), { standards: 0, rules: 0 });
    expect(steps).toHaveLength(12);
    expect(steps.map((s) => s.phase)).not.toContain("standards");
    expect(steps[0].label).toBe("Building the RFP checklist");
  });

  it("labels name the vendor and what it is checked against", () => {
    const steps = planSteps(vendors(2), { standards: 1, rules: 12 });
    expect(steps.find((s) => s.phase === "standards")!.label).toBe(
      "Checking V1 against the standards: 12 rules",
    );
    expect(steps.find((s) => s.phase === "analyze")!.label).toBe("Checking V1 against the RFP");
    expect(joinNames(["A", "B", "C", "D"])).toBe("the other 4 vendors");
  });

  it("ETA uses measured averages and concurrency", () => {
    const steps = [
      { phase: "checklist" as const, status: "done", durationMs: 40_000 },
      { phase: "analyze" as const, status: "done", durationMs: 100_000 },
      { phase: "analyze" as const, status: "queued", durationMs: null },
      { phase: "analyze" as const, status: "queued", durationMs: null },
      { phase: "summary" as const, status: "queued", durationMs: null },
    ];
    // analyze: 2 queued / 3 at a time = 1 wave × 100 s; summary default 30 s.
    expect(etaSeconds(steps, { concurrency: 3, mode: "live" })).toBe(130);
    expect(etaSeconds(steps, { concurrency: 1, mode: "live" })).toBe(230);
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

describe("risk score and recommendation (P8)", () => {
  const counts = (compliant: number, partial: number, non: number, na: number) => ({
    compliant,
    partial,
    non_compliant: non,
    not_addressed: na,
  });
  const reg = (...li: [number, number][]) =>
    li.map(([likelihood, impact]) => ({ likelihood, impact }));
  // Real Sonnet runs (data/live-test): the AI rated all of these "high" or "critical".
  it.each([
    ["Harborline 91.6 %", 1, counts(77, 8, 0, 6), reg([3, 5], [4, 4], [4, 4]), 28, "moderate"],
    ["Meridian 74.9 %", 2, counts(54, 20, 6, 11), reg([5, 5], [5, 5], [5, 4]), 50, "high"],
    ["Atlas 49.4 %", 14, counts(28, 28, 9, 26), reg([5, 5], [5, 5], [5, 4]), 84, "critical"],
    ["Qasr 96.3 %", 0, counts(29, 2, 0, 0), reg([5, 4], [3, 4], [3, 4]), 16, "low"],
  ] as const)("%s → %i", (_n, mandatory, c, risks, score, level) => {
    const s = riskScore({ mandatoryNotMet: mandatory, counts: c, risks: [...risks] });
    expect(s).toBe(score);
    expect(riskLevel(s)).toBe(level);
  });

  it("bands and the overall value", () => {
    expect([0, 24, 25, 49, 50, 69, 70, 100].map(riskLevel)).toEqual([
      "low",
      "low",
      "moderate",
      "moderate",
      "high",
      "high",
      "critical",
      "critical",
    ]);
    expect(riskScore({ mandatoryNotMet: 0, counts: counts(0, 0, 0, 0), risks: [] })).toBe(0);
    expect(overallValue(90, 80, 20)).toBe(84);
    expect(overallValue(null, 80, 20)).toBe(80);
  });

  it("normalises proposal sections", () => {
    expect(toSection("Security & data")).toBe("security");
    expect(toSection("commercial")).toBe("commercial");
    expect(toSection("", "Payment: 30 % advance against a bank guarantee")).toBe("commercial");
    expect(guessSection("24-month warranty from acceptance")).toBe("support");
    expect(guessSection("All lanes in operation within 8 months")).toBe("implementation");
  });

  it("guesses sections by the best score, not the first keyword (user: only 4 sections showed)", () => {
    // "route deviation" is a platform feature, not a contract deviation
    expect(guessSection("A live map with alerts for route deviation and stops.")).toBe("solution");
    // a payment tied to acceptances is still commercial
    expect(
      guessSection(
        "Payment: 25 % on acceptance of the pilot and 75 % on acceptance of the rollout.",
      ),
    ).toBe("commercial");
    // bid and performance securities are contract terms, not information security
    expect(guessSection("Bid validity of 90 days. Bid security of USD 30,000.")).toBe("terms");
    expect(guessSection("All servers shall be installed in the Authority's server rooms.")).toBe(
      "security",
    );
    expect(guessSection("At least 3 similar installations in the last 5 years (references).")).toBe(
      "company",
    );
    expect(guessSection("Training of 6 maintenance technicians.")).toBe("implementation");
  });
});

describe("store helpers", () => {
  it("aligns findings to the checklist (missing → not addressed, unknown dropped)", () => {
    const f = {
      status: "compliant" as const,
      headline: "h",
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
          headline: "Not addressed",
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

describe("requirement sources (links to RFP clauses and standard rules)", () => {
  it("extracts clause tokens and leaves standard rule codes alone", () => {
    const rules = new Set(["SEC-02", "COM-01"]);
    expect(clauseTokens("RFP §4.6.1; SEC-02", rules)).toEqual(["4.6.1"]);
    expect(clauseTokens("Annex B TB-24", rules)).toEqual(["TB-24"]);
    expect(clauseTokens("Annex C GC 10.1, SC 7.2", rules)).toEqual(["GC 10.1", "SC 7.2"]);
    expect(clauseTokens("Addendum 1 Q3; COM-01", rules)).toEqual(["Q3"]);
  });

  it("finds the page where a clause starts a line, not a mention or a bare number", () => {
    const pages = [
      "Contents\nThe vendor shall comply with 4.6.1 below.",
      "4.6 Licensing\n4.6.1 All licensing servers shall be on-premise.",
      "8. Evaluation\n8 trucks per hour",
    ];
    expect(findToken(pages, "4.6.1")).toBe(1);
    expect(findToken(pages, "8")).toBe(2);
    expect(findToken(pages, "9.9.9")).toBe(-1);
  });
});

describe("clause text for RFP highlights", () => {
  it("takes the whole clause up to the next clause heading", () => {
    const page =
      "4.6 Software\n4.6.1 All software components shall be hosted\non-premise at the CDC. MANDATORY\n4.6.2 No scan image shall leave the territory.";
    expect(clauseText(page, "4.6.1")).toBe(
      "4.6.1 All software components shall be hosted on-premise at the CDC. MANDATORY",
    );
  });

  it("keeps a table clause to its own row, without cell separators", () => {
    const text =
      "| Ref | Area | Requirement |\n| TB-24 | Software | Hosting of all components | M |\n| TB-25 | Software | Data residency | M |";
    expect(clauseText(text, "TB-24", true)).toBe("TB-24 Software Hosting of all components M");
  });

  it("drops running headers and footers repeated on most pages", () => {
    const pages = [1, 2, 3, 4].map(
      (n) => `NGPA/T/2026/014 · Request for Proposal\nClause text ${n}.\nPage ${n} of 4`,
    );
    expect(stripRunningLines(pages)[1]).toBe("Clause text 2.");
  });
});
