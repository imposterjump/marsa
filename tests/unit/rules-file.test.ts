import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  pdfTextToRules,
  rowsToRules,
  rulesFromFile,
  textToRows,
} from "@/server/standards/rules-file";

const POC = path.join(process.cwd(), "test-inputs", "poc-inputs", "2-meeting-e-seals");
const read = (name: string) => new Uint8Array(fs.readFileSync(path.join(POC, name)));

describe("rules from a dropped file (P8 New standard)", () => {
  it("reads table rows: skips header and separator rows, keeps the priority column", () => {
    const { rules, errors } = rowsToRules([
      ["Code", "Rule", "Priority"],
      ["---", "---", "---"],
      ["SEC-01", "Data shall stay in the State.", "Mandatory"],
      ["SEC-02", "Admins shall use MFA."],
      ["SEC-03", "Logs are kept", "for 5 years."],
    ]);
    expect(errors).toEqual([]);
    expect(rules.map((r) => [r.code, r.priority])).toEqual([
      ["SEC-01", "mandatory"],
      ["SEC-02", "important"],
      ["SEC-03", "important"],
    ]);
    // A third cell that is no priority is part of the rule text.
    expect(rules[2].text).toBe("Logs are kept for 5 years.");
  });

  it("turns pipe tables and tab rows of extracted text into rows", () => {
    expect(
      textToRows("# comment\n| A-1 | Rule one | mandatory |\nB-2\tRule two\nno table here"),
    ).toEqual([
      [" A-1 ", " Rule one ", " mandatory "],
      ["B-2", "Rule two"],
    ]);
  });

  it("splits a PDF's text into rules at each code and drops page footers", () => {
    const { rules } = pdfTextToRules([
      "TR-01 Tracking data shall stay in the State. mandatory\nTR-02 Seals shall be certified",
      "to ISO 17712. Page 1 of 2\nTR-03 Alerts within 60 seconds. desirable",
    ]);
    expect(rules.map((r) => [r.code, r.priority])).toEqual([
      ["TR-01", "mandatory"],
      ["TR-02", "important"],
      ["TR-03", "desirable"],
    ]);
    expect(rules[1].text).toBe("Seals shall be certified to ISO 17712.");
  });

  it.each(["csv", "xlsx", "txt"])("reads the POC rules file (.%s) exactly", async (ext) => {
    const res = await rulesFromFile(
      `Standard-CTS-2026-rules.${ext}`,
      read(`Standard-CTS-2026-rules.${ext}`),
    );
    expect(res.errors).toEqual([]);
    expect(res.needsAi).toBe(false);
    expect(res.rules).toHaveLength(12);
    expect(res.rules[0]).toMatchObject({ code: "TR-01", priority: "mandatory" });
    expect(res.rules[0].text).toMatch(/^Tracking data, alerts and audit records shall be stored/);
    expect(res.rules[9]).toMatchObject({ code: "TR-10", priority: "desirable" });
    expect(res.rules[8].text).toContain("−10 °C to +60 °C");
  });

  it("offers AI only for a PDF whose text has no rule codes; refuses other types", async () => {
    const pdf = await rulesFromFile("RFP.pdf", read("RFP-GCD-T-2026-047.pdf"));
    expect(pdf.needsAi).toBe(true);
    const png = await rulesFromFile("rules.png", new Uint8Array([1, 2, 3]));
    expect(png).toMatchObject({ rules: [], needsAi: false });
    expect(png.errors[0].message).toMatch(/Excel, CSV/);
  });
});
