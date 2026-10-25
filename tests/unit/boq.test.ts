/**
 * Bills of quantities (2026-10-25): the reader on the layouts met in the Public Works tenders
 * (English or Arabic headings in any order, "LS" rates, merged lump sums, stretched "اجمــالي"
 * subtotals, a summary sheet) and the line-by-line comparison of the bids.
 */
import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { alignItems, compareBoqs } from "@/server/boq/compare";
import { boqDetail, boqOverview } from "@/server/boq/facts";
import { parseBoq, toNumber } from "@/server/boq/parse";
import { leftOutReason } from "@/server/imports/tender";

type Cell = string | number | null;

async function workbook(sheets: Record<string, Cell[][]>, merges: Record<string, string[]> = {}) {
  const wb = new ExcelJS.Workbook();
  for (const [name, rows] of Object.entries(sheets)) {
    const ws = wb.addWorksheet(name);
    for (const r of rows) ws.addRow(r);
    for (const m of merges[name] ?? []) ws.mergeCells(m);
  }
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

const CLIENT: Cell[][] = [
  ["Maintenance works"],
  ["S.No.", "Description", "Qty.", "Unit", "Unit Price", "Amount"],
  ["", "Demolition Works"],
  [1, "Demolition of wall tiles", 100, "sqm", null, null],
  [2, "Removal of washroom fixtures", 4, "item", null, null],
  ["", "Finishing Works"],
  [1, "Porcelain floor tiles 60x60", 200, "sqm", null, null],
  [2, "Gypsum false ceiling", 50, "sqm", null, null],
  ["", "Total Amount (AED)"],
];

const bid = (rates: (Cell | undefined)[], extra: Cell[][] = [], total?: number): Cell[][] => {
  const qty = [100, 4, 200, 50];
  const desc = [
    "Demolition of wall tiles",
    "Removal of washroom fixtures",
    "Porcelain floor tiles 60x60",
    "Gypsum false ceiling",
  ];
  const units = ["sqm", "item", "sqm", "sqm"];
  const rows: Cell[][] = [["S.No.", "Description", "Qty.", "Unit", "Unit Price", "Amount"]];
  let sum = 0;
  rates.forEach((r, i) => {
    if (i === 0) rows.push(["", "Demolition Works"]);
    if (i === 2) rows.push(["", "Finishing Works"]);
    if (r === undefined) return;
    const amount = typeof r === "number" ? r * qty[i] : null;
    if (amount) sum += amount;
    rows.push([i % 2 ? 2 : 1, desc[i], qty[i], units[i], r, amount]);
  });
  rows.push(...extra);
  rows.push(["", "Total Amount (AED)", "", "", "", total ?? sum]);
  rows.push(["", "VAT (5%)", "", "", "", (total ?? sum) * 0.05]);
  rows.push(["", "Total Amount with VAT (AED)", "", "", "", (total ?? sum) * 1.05]);
  return rows;
};

describe("reading a bill of quantities", () => {
  it("finds items, headings and the totals the bidder wrote", async () => {
    const boq = (await parseBoq(await workbook({ BOQ: bid([40, 900, 160, 110]) })))!;
    expect(boq.items).toHaveLength(4);
    expect(boq.items[2]).toMatchObject({
      section: "Finishing Works",
      no: "1",
      qty: 200,
      unit: "sqm",
      rate: 160,
      amount: 32000,
    });
    expect(boq.stated.total).toBe(4000 + 3600 + 32000 + 5500);
    expect(boq.stated.totalWithVat).toBeCloseTo(45100 * 1.05);
    expect(boq.currency).toBe("AED");
  });

  it("reads Arabic headings in another order, LS rates, merged lump sums and stretched subtotals", async () => {
    const rows: Cell[][] = [
      ["م", "البنود", "الوحدة", "الكمية", "سعر الوحدة", "الإجمالي"],
      ["", "الأعمال التحضيرية"],
      [1, "تهيئة الموقع", "مقطوعية", 1, "LS", 25000],
      [2, "السور المؤقت", 1, "مقطوعية", 8000, 8000], // quantity and unit swapped
      [3, "طفايات حريق", "عدد", 8, null, 12000],
      [4, "كاشف دخان", "عدد", 7, null, 12000], // merged with the row above: one lump sum
      ["", "اجمــــــالي الأعمال التحضيرية", "", "", "", 45000],
    ];
    const boq = (await parseBoq(
      await workbook({ "الأعمال التحضيرية": rows }, { "الأعمال التحضيرية": ["F5:F6"] }),
    ))!;
    expect(boq.items.map((i) => i.description)).toEqual([
      "تهيئة الموقع",
      "السور المؤقت",
      "طفايات حريق",
      "كاشف دخان",
    ]);
    expect(boq.items[0]).toMatchObject({ rate: null, rateText: "LS", amount: 25000 });
    expect(boq.items[1]).toMatchObject({ qty: 1, unit: "مقطوعية" });
    expect(boq.items[3]).toMatchObject({ amount: null, inGroup: true });
    expect(boq.stated.total).toBe(45000); // the subtotal row is a total, not an item
  });

  it("takes the project total from a summary sheet", async () => {
    const sheet: Cell[][] = [
      ["م", "البنود", "الوحدة", "الكمية", "سعر الوحدة", "الإجمالي"],
      [1, "حفر", "م3", 100, 30, 3000],
      ["", "إجمالي الأعمال", "", "", "", 3000],
    ];
    const summary: Cell[][] = [
      ["م", "البنود", "الإجمالي"],
      [1, "الأعمال المدنية", 3000],
      ["", "إجمالي المشروع", 3000],
      ["", "قيمة ضريبة القيمة المضافة (%5)", 150],
      ["", "إجمالي التكلفة شامل ضريبة القيمة المضافة", 3150],
    ];
    const boq = (await parseBoq(await workbook({ مبنى: sheet, "ملخص الجدول": summary })))!;
    expect(boq.items).toHaveLength(1);
    expect(boq.stated).toEqual({ total: 3000, vat: 150, totalWithVat: 3150 });
  });

  it("reads numbers written as text", () => {
    expect(toNumber("1,250,000")).toBe(1250000);
    expect(toNumber("AED 12,500.50")).toBe(12500.5);
    expect(toNumber("LS")).toBeNull();
  });

  it("is null for a workbook that is no bill of quantities", async () => {
    expect(
      await parseBoq(
        await workbook({
          Sheet1: [
            ["Name", "Phone"],
            ["A", "1"],
          ],
        }),
      ),
    ).toBeNull();
    expect(await parseBoq(new Uint8Array([1, 2, 3]))).toBeNull();
  });
});

describe("comparing the bids", () => {
  it("ranks the bids and finds what stands out on each", async () => {
    const client = (await parseBoq(await workbook({ BOQ: CLIENT })))!;
    const clean = (await parseBoq(await workbook({ BOQ: bid([40, 900, 160, 110]) })))!;
    // Cheap: a line unpriced, the ceiling quantity changed, written 10× too high on one line.
    const cheapRows = bid([10, 200, 150, undefined]);
    cheapRows.splice(5, 0, [2, "Gypsum false ceiling", 60, "sqm", 100, 6000]);
    cheapRows[2] = [1, "Demolition of wall tiles", 100, "sqm", 10, 10000];
    const cheap = (await parseBoq(await workbook({ BOQ: cheapRows })))!;
    // Dear: high rates and an added line.
    const dear = (await parseBoq(
      await workbook({
        BOQ: bid([120, 2500, 420, 330], [[1, "Temporary site office", 1, "LS", 9000, 9000]]),
      }),
    ))!;
    const res = compareBoqs(
      client,
      [
        { proposalId: "a", vendor: "Clean", document: "a.xlsx", boq: clean },
        { proposalId: "b", vendor: "Cheap", document: "b.xlsx", boq: cheap },
        { proposalId: "c", vendor: "Dear", document: "c.xlsx", boq: dear },
        { proposalId: "d", vendor: "No Excel", document: null, boq: null },
      ],
      { estimate: 50000, clientDocument: "client.xlsx" },
    );
    expect(res.items).toBe(4);
    const by = (id: string) => res.vendors.find((v) => v.proposalId === id)!;
    expect(by("a")).toMatchObject({ rank: 2, unpriced: 0, arithmetic: 0, qtyChanged: 0, extra: 0 });
    expect(by("a").vsEstimatePct).toBeCloseTo(-9.8);
    expect(by("b")).toMatchObject({ rank: 1, arithmetic: 1, qtyChanged: 1 });
    expect(by("c")).toMatchObject({ rank: 3, extra: 1, extraAmount: 9000 });
    expect(by("c").high).toBeGreaterThan(0);
    expect(by("d")).toMatchObject({ parsed: false, rank: null });
    const tiles = res.rows[2];
    expect(tiles.cells.b.flags).toContain("lowest");
    expect(tiles.median).toBe(160);

    // The AI gets these figures as text.
    const overview = boqOverview(res);
    expect(overview).toContain("Client's internal cost estimate: 50,000 AED.");
    expect(overview).toMatch(/- Cheap: rank 1 of 3 by price/);
    expect(overview).toContain("- No Excel: no Excel bill of quantities");
    expect(boqDetail(res, "b")).toContain("but the amount written is 10,000");
    expect(boqDetail(res, "b")).toContain("50 → 60 sqm");
  });

  it("matches lines by their description when a bidder re-typed the sheet", async () => {
    const client = (await parseBoq(await workbook({ BOQ: CLIENT })))!;
    const retyped = (await parseBoq(
      await workbook({
        "Table 1": [
          ["S.No.", "Description", "Qty.", "Unit", "Unit Price", "Amount"],
          [1, "Demolition of wall tiles.", 100, "sqm", 40, 4000],
          [2, "Removal of washroom fixtures", 4, "item", 900, 3600],
          [3, "Porcelain floor tiles 60x60", 200, "sqm", 160, 32000],
          [4, "Gypsum false ceiling", 50, "sqm", 110, 5500],
        ],
      }),
    ))!;
    const { match, extra } = alignItems(client.items, retyped.items);
    expect(match.size).toBe(4);
    expect(extra).toHaveLength(0);
  });
});

describe("a lean import", () => {
  it("leaves out what the evaluation does not need, keeps the tender's and the bids' documents", () => {
    const tender = (name: string) => leftOutReason(`T/مستندات الطرح/الخارجية/${name}`, "tender");
    expect(tender("BRD107 ARCH 09.dwg")).toBe("drawing");
    expect(tender("05 صورة جوية.pdf")).toBe("map");
    expect(tender("02 خارطة الأرض.pdf")).toBe("map");
    expect(tender("06 ممانعة فيوا.pdf")).toBe("permit");
    expect(tender("08 عدم ممانعة الصرف الصحي.pdf")).toBe("permit");
    expect(tender("04 تقرير الزيارة الموقعية.pdf")).toBe("site_report");
    expect(tender("Rfq_2412.jpg")).toBe("image");
    for (const kept of [
      "جدول كميات المناقصة.xlsx",
      "جدول كميات المناقصة.pdf",
      "إقرار بمستندات العطاء.docx",
      "نموذج عقد إنشاء.pdf",
      "المذكرة الداخلية .pdf",
    ])
      expect(tender(kept), kept).toBeNull();
    const bid = (path: string) => leftOutReason(`T/bids/Co-1234/${path}`, "bid");
    expect(bid("General_Attachments/Signed and stamped document/ARC.pdf")).toBe("drawing");
    expect(bid("General_Attachments/002-ايبان_الشركة.pdf")).toBe("bank_details");
    expect(bid("_/002-رخصة.jpg")).toBeNull(); // a scanned licence stays
    expect(bid("BOQ/005-جدول_الكميات(Excel).xlsx")).toBeNull();
  });
});
