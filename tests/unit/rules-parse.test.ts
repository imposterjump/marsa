import { describe, expect, it } from "vitest";
import { nextRuleCode, parseRules } from "@/lib/rules-parse";

describe("parseRules", () => {
  it("accepts Arabic priority words", () => {
    const { rules, errors } = parseRules(
      "AR-01 | تخزين البيانات داخل الدولة | إلزامي\nAR-02 | نسخ احتياطي | مرغوب",
    );
    expect(errors).toEqual([]);
    expect(rules.map((r) => r.priority)).toEqual(["mandatory", "desirable"]);
  });

  it("parses CODE | text | priority lines with aliases", () => {
    const { rules, errors } = parseRules(
      "SEC-01 | Data stays in-country. | mandatory\nSEC-02 | MFA for admins | M\nSEC-03 | Backups | d",
    );
    expect(errors).toEqual([]);
    expect(rules.map((r) => [r.code, r.text, r.priority])).toEqual([
      ["SEC-01", "Data stays in-country.", "mandatory"],
      ["SEC-02", "MFA for admins", "mandatory"],
      ["SEC-03", "Backups", "desirable"],
    ]);
  });

  it("accepts tab-separated rows (pasted from Excel/Word tables)", () => {
    const { rules } = parseRules("SAF-01\tNo beam on occupied cabs.\tMandatory");
    expect(rules[0]).toMatchObject({
      code: "SAF-01",
      text: "No beam on occupied cabs.",
      priority: "mandatory",
    });
  });

  it("supports text-only and text | priority lines (code generated later)", () => {
    const { rules } = parseRules("Plain rule\nAnother rule | important");
    expect(rules).toMatchObject([
      { code: null, text: "Plain rule", priority: "important" },
      { code: null, text: "Another rule", priority: "important" },
    ]);
  });

  it("keeps pipes inside the rule text", () => {
    const { rules } = parseRules("COM-01 | Price in USD | excl. VAT | mandatory");
    expect(rules[0].text).toBe("Price in USD | excl. VAT");
  });

  it("ignores blanks and # comments, reports bad lines with line numbers", () => {
    const { rules, errors } = parseRules(
      "# header\n\nX-1 | ok | important\n9BAD | text | important\nY-1 | | M\nZ-1 | t | urgent\nX-1 | dup | M",
    );
    expect(rules).toHaveLength(1);
    expect(errors.map((e) => e.line)).toEqual([4, 5, 6, 7]);
    expect(errors[3].message).toMatch(/Duplicate code/);
  });

  it("handles Windows line endings and Arabic text", () => {
    const { rules } = parseRules(
      "AR-01 | يجب تخزين البيانات داخل الدولة | M\r\nAR-02 | النسخ الاحتياطي يومياً | I",
    );
    expect(rules).toHaveLength(2);
    expect(rules[0].text).toBe("يجب تخزين البيانات داخل الدولة");
  });
});

describe("nextRuleCode", () => {
  it("continues the highest number with zero padding", () => {
    expect(nextRuleCode("SEC", ["SEC-01", "SEC-07", "OTHER-99"])).toBe("SEC-08");
    expect(nextRuleCode("sec", [])).toBe("SEC-01");
    expect(nextRuleCode("CITS-2026", [])).toBe("CITS2026-01");
    expect(nextRuleCode("", [])).toBe("R-01");
  });
});
