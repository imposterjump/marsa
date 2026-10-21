/**
 * P6.1 live smoke test (≈ $0.01): one tiny streaming call with structured output, adaptive
 * thinking and refusal fallbacks, validated with zod. Prints the model, stop reason, usage and
 * cost, never the API key.
 *   npm run ai:smoke                 → Sonnet 5.5 (cheap)
 *   npm run ai:smoke -- claude-opus-5-5
 */
import "./load-env";
import { z } from "zod";
import { callStructured } from "../src/server/ai/client";
import { costFromUsage } from "../src/lib/plan";

const model = process.argv[2] ?? "claude-sonnet-5-5";
const schema = z.object({
  status: z.enum(["compliant", "partial", "non_compliant", "not_addressed"]),
  evidenceQuote: z.string().nullable(),
  reason: z.string(),
});

async function main() {
  const started = Date.now();
  let firstEvent = 0;
  const res = await callStructured({
    model,
    system: "You are a procurement evaluation analyst. Judge only from the provided text.",
    content: [
      {
        type: "text",
        text: 'Requirement: "The scanner shall penetrate at least 300 mm of steel."\nVendor text: "Our HE-6 system penetrates 310 mm of steel (ISO 12345 test, page 4)."\nReturn the finding. status is one of "compliant", "partial", "non_compliant", "not_addressed".',
      },
    ],
    schema,
    onStarted: () => (firstEvent ||= Date.now() - started),
  });
  console.log(
    JSON.stringify(
      {
        model: res.model,
        stopReason: res.stopReason,
        output: res.data,
        usage: res.usage,
        costUsd: costFromUsage(model, res.usage),
        firstEventMs: firstEvent,
        totalMs: Date.now() - started,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error("Smoke test failed:", err?.status ?? "", err?.message ?? err);
  process.exit(1);
});
