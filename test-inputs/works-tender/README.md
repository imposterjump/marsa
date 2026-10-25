# Building works tender (fictional, for testing)

A small maintenance tender in the layout the **e-procurement portal** exports (the same layout as
the Public Works Department's real tenders the client's supervisor shared, 2026-10-25). Everything
here is invented: the tender, the three contractors, their prices. Rebuild it with
`npx tsx scripts/test-inputs/build-works-tender.ts`.

```
مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية/
  مستندات الطرح/الخارجية/      tender documents sent to bidders → the project's RFP
    جدول كميات المناقصة.xlsx   the bill of quantities (14 lines, 4 sections) — compared line by line
    جدول كميات المناقصة.pdf
    إقرار بمستندات العطاء.pdf  what every bid must contain (priced BOQ, bid bond 5%, licence, programme)
  مستندات الطرح/الداخلية/      internal papers → never imported; the estimate is read from them
    الإعتماد المالي.pdf        estimate: AED 310,000
  عطاءات الشركات في محضر الفتح/
    bids_wt_2026_017.zip       the 3 companies' bids, one folder each (supplier.txt = legal name)
```

## Try it

1. **Projects → Import tender**, then choose this folder (the one with the Arabic name), or drop it.
2. The preview shows: 3 tender documents, 1 internal paper not imported, the estimate
   **AED 310,000** (from الإعتماد المالي.pdf), and 3 companies at the opening.
   Coastline: "1 duplicate file left out" (it uploaded its licence twice).
3. **Import**: the project opens as *Construction & maintenance*, with the 3 vendors.
4. **Run AI analysis**. The demo AI is free and checks the tender's own conditions. Live AI reads
   the documents and writes in English, then the Translator writes Arabic.
5. On the results page:
   - the sections are the building works ones: contractor & licence, scope, programme, priced
     bill of quantities, bid bond & guarantees, declarations;
   - the **Prices** tab compares the three bills of quantities line by line.

| Company | Total before VAT | Rank | What the price check finds |
|---|---|---|---|
| شركة الريم للمقاولات العامة ذ.م.م | 219,120 | 1 | 2 lines unpriced, 1 quantity changed; **no bid bond** in the bid |
| Al Wadi Building Contracting LLC | 285,385 | 2 | clean and complete |
| Coastline Engineering & Maintenance LLC | 801,420 | 3 | 1 line where quantity × rate ≠ amount (written 10× too high), 1 added line, rates far above the others |

The same from a terminal (prints the preview; `--commit` imports into `DATA_DIR`):

```bash
npx tsx scripts/tender-import.ts "test-inputs/works-tender/مناقصة صيانة مبنى مركز خدمات المتعاملين - تجريبية"
```

## The real tenders

The supervisor's two real tenders (`new company req files/`, kept on the team's machine only:
they hold bank guarantees, licences and an IBAN, so they are **not in git**) import the same way,
from the app or with the script above. Pick the tender's own folder, not the folder that holds
both: one tender per import.
