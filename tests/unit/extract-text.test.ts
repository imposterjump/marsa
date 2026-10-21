import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { extractText, htmlToText, TEXT_CONTENT_MAX } from "@/server/documents/extract-text";

const pack = (f: string) =>
  new Uint8Array(fs.readFileSync(path.join(process.cwd(), "test-inputs/phase-1/rfp-pack", f)));
const enc = (s: string) => new TextEncoder().encode(s);

describe("extractText", () => {
  it("turns an XLSX into one pipe table per sheet, using formula results", async () => {
    const t = (await extractText(
      "annex-b.xlsx",
      pack("03-Annex-B-Technical-Specifications.xlsx"),
    ))!;
    expect(t).toContain("## Sheet: Read me");
    expect(t).toContain("## Sheet: Technical specs");
    expect(t).toMatch(
      /\| TB-01 \| Imaging \| Steel penetration \(ANSI N42\.46-2008\) \| mm \| ≥ 310 \|/,
    );
    expect(t).not.toContain("[object Object]");
  });

  it("turns a DOCX into text with markdown-style headings", async () => {
    const t = (await extractText("annex-c.docx", pack("04-Annex-C-Draft-Contract.docx")))!;
    expect(t).toContain("# Part A — General Conditions (GC)");
    expect(t).toContain("## GC 4 Contract price and taxes");
    expect(t).toContain("DDP site (Incoterms 2020)");
    expect(t).not.toMatch(/<\/?[a-z]+>/);
  });

  it("decodes plain-text formats and skips PDFs, images and unknown types", async () => {
    expect(await extractText("q.txt", enc("Question 1 — clarify TB-27\r\n"))).toContain(
      "clarify TB-27",
    );
    expect(await extractText("rows.csv", enc("a,b\n1,2"))).toBe("a,b\n1,2");
    expect(await extractText("rfp.pdf", enc("%PDF-1.4"))).toBeNull(); // PDFs go to Claude natively
    expect(await extractText("plan.png", new Uint8Array([0x89, 0x50]))).toBeNull();
    expect(await extractText("setup.bin", enc("??"))).toBeNull();
  });

  it("truncates very large text with a note", async () => {
    const t = (await extractText("big.txt", enc("x".repeat(TEXT_CONTENT_MAX + 10))))!;
    expect(t.length).toBeLessThanOrEqual(TEXT_CONTENT_MAX + 200);
    expect(t).toMatch(/truncated/i);
  });
});

describe("htmlToText", () => {
  it("keeps headings, list items and table rows; decodes entities", () => {
    const t = htmlToText(
      "<h1>Title</h1><p>A &amp; B</p><ul><li>one</li></ul><table><tr><td>x</td><td>y</td></tr></table>",
    );
    expect(t).toContain("# Title");
    expect(t).toContain("A & B");
    expect(t).toMatch(/- one/);
    expect(t).toContain("| x | y |");
  });
});
