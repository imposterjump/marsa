/** A bid's total in a few characters under the vendor's name (2026-10-26). */
import { describe, expect, it } from "vitest";
import { shortPrice } from "@/lib/price";

describe("short bid price", () => {
  it("takes the amount before VAT from the AI's sentence, in the formats bids use", () => {
    expect(shortPrice("480200 before VAT; VAT 24010; 504210 including VAT", "AED")).toEqual({
      amount: "AED 480,200",
      beforeVat: true,
    });
    expect(shortPrice("712,400 before VAT; VAT 35,620; 748,020 with VAT", null)).toEqual({
      amount: "712,400",
      beforeVat: true,
    });
    expect(
      shortPrice("1,204,310.50 AED before VAT; 1,264,526.03 AED with 5% VAT (60,215.53)", null),
    ).toEqual({ amount: "AED 1,204,310.50", beforeVat: true });
    expect(
      shortPrice(
        "1,320,000 AED before VAT; VAT (5%) 66,000 AED; total with VAT 1,386,000 AED (cover letter: AED 1,386,000.00)",
        "AED",
      ),
    ).toEqual({ amount: "AED 1,320,000", beforeVat: true });
    expect(shortPrice("2,604,100.00 AED before VAT; 130,205.00 AED VAT (5%)", null)?.amount).toBe(
      "AED 2,604,100",
    );
  });

  it("finds the amount before VAT wherever it is, and reads Arabic", () => {
    expect(shortPrice("Total 1,386,000 incl. VAT (1,320,000 excluding VAT)", "AED")).toEqual({
      amount: "AED 1,320,000",
      beforeVat: true,
    });
    expect(
      shortPrice("480,200 درهمًا قبل ضريبة القيمة المضافة؛ 504,210 درهمًا شاملة", null),
    ).toEqual({ amount: "AED 480,200", beforeVat: true });
  });

  it("keeps a plain total, and gives up on text with no amount", () => {
    expect(shortPrice("USD 2,397,000", "USD")).toEqual({
      amount: "USD 2,397,000",
      beforeVat: false,
    });
    expect(shortPrice("EUR 1.2 million", "EUR")).toBeNull();
    expect(shortPrice("Not stated", null)).toBeNull();
    expect(shortPrice(null, "AED")).toBeNull();
  });
});

describe("short bid price: the currency", () => {
  it("reads the currency from the field when it names one, else from the text", () => {
    expect(shortPrice("480200 before VAT", "UAE Dirham")?.amount).toBe("AED 480,200");
    expect(shortPrice("480,200 dirhams before VAT", "as stated")?.amount).toBe("AED 480,200");
    expect(shortPrice("1,250,000 excluding VAT", "")?.amount).toBe("1,250,000");
  });
});
