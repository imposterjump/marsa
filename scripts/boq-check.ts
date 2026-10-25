/**
 * Reads bills of quantities with the app's parser (src/server/boq/parse.ts) and prints what it
 * found: items, priced items, the sum of amounts and the totals written in the file. Read-only.
 *   npx tsx scripts/boq-check.ts <file.xlsx | folder | file.zip> …
 *   npx tsx scripts/boq-check.ts --items=<part of a file name> [--sheet=<part of a sheet name>] …
 *   npx tsx scripts/boq-check.ts --compare=<client.xlsx> [--estimate=<amount>] <bids folder | zip>
 *     (one bid per folder that holds an .xlsx: the folder name is the bidder)
 * Folders are searched for .xlsx files; .zip files are read in memory (nothing is extracted).
 */
import fs from "node:fs";
import path from "node:path";
import JSZip from "jszip";
import { compareBoqs, type BoqBid } from "../src/server/boq/compare";
import { parseBoq } from "../src/server/boq/parse";

const arg = (k: string) => process.argv.find((a) => a.startsWith(`--${k}=`))?.slice(k.length + 3);
const itemsOf = arg("items");
const sheetOf = arg("sheet");

async function check(name: string, bytes: Uint8Array) {
  if (itemsOf && !name.includes(itemsOf)) return;
  const boq = await parseBoq(bytes);
  if (!boq) return console.log(`  -  ${name}: no bill of quantities found`);
  if (itemsOf) {
    for (const i of boq.items.filter((x) => !sheetOf || x.sheet.includes(sheetOf)))
      console.log(
        [
          i.row,
          i.no,
          i.qty ?? "-",
          i.unit,
          i.rate ?? i.rateText ?? "-",
          i.amount ?? i.amountText ?? "-",
          i.description.slice(0, 50),
          `[${i.section.slice(0, 30)}]`,
        ].join("	"),
      );
    return;
  }
  const priced = boq.items.filter((i) => i.amount !== null).length;
  const sum = boq.items.reduce((s, i) => s + (i.amount ?? 0), 0);
  const s = boq.stated;
  console.log(
    `  ${name.slice(-70).padEnd(70)} items=${boq.items.length} priced=${priced} sum=${Math.round(sum).toLocaleString("en")} stated=${s.total?.toLocaleString("en") ?? "-"} vat=${s.vat?.toLocaleString("en") ?? "-"} withVat=${s.totalWithVat?.toLocaleString("en") ?? "-"} ${boq.currency ?? ""} sheets=${boq.sheets.map((x) => `${x.name}:${x.items}`).join(",")}`,
  );
}

async function walk(p: string) {
  const st = fs.statSync(p);
  if (st.isDirectory()) {
    for (const e of fs.readdirSync(p)) await walk(path.join(p, e));
  } else if (p.endsWith(".xlsx")) {
    await check(p, fs.readFileSync(p));
  } else if (p.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(fs.readFileSync(p));
    for (const f of Object.values(zip.files)) {
      if (!f.dir && f.name.endsWith(".xlsx")) await check(f.name, await f.async("uint8array"));
    }
  }
}

/** Every .xlsx under a folder or in a zip, with its path. */
async function workbooks(p: string, out: { name: string; bytes: Uint8Array }[] = []) {
  if (fs.statSync(p).isDirectory()) {
    for (const e of fs.readdirSync(p)) await workbooks(path.join(p, e), out);
  } else if (p.endsWith(".xlsx")) out.push({ name: p, bytes: fs.readFileSync(p) });
  else if (p.endsWith(".zip")) {
    const zip = await JSZip.loadAsync(fs.readFileSync(p));
    for (const f of Object.values(zip.files))
      if (!f.dir && f.name.endsWith(".xlsx"))
        out.push({ name: f.name, bytes: await f.async("uint8array") });
  }
  return out;
}

async function compare(clientFile: string, bidsDir: string) {
  const client = (await parseBoq(fs.readFileSync(clientFile)))!;
  const bidder = (name: string) =>
    name.split(/[\\/]/).find((part) => /-\d{4,}$/.test(part)) ?? path.basename(path.dirname(name));
  const seen = new Set<string>();
  const bids: BoqBid[] = [];
  for (const w of await workbooks(bidsDir)) {
    const who = bidder(w.name);
    if (seen.has(who)) continue;
    seen.add(who);
    bids.push({
      proposalId: who,
      vendor: who,
      document: path.basename(w.name),
      boq: await parseBoq(w.bytes),
    });
  }
  const estimate = Number(arg("estimate")) || null;
  const res = compareBoqs(client, bids, { estimate, clientDocument: path.basename(clientFile) });
  console.log(`client: ${res.items} lines · ${res.sheets.join(", ")} · ${res.currency}`);
  for (const v of res.vendors.sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99)))
    console.log(
      `#${v.rank} ${v.vendor.slice(0, 26).padEnd(26)} stated=${v.statedTotal?.toLocaleString("en") ?? "-"} lines=${v.linesTotal?.toLocaleString("en") ?? "-"} diff=${v.difference ?? "-"} priced=${v.priced} unpriced=${v.unpriced} missing=${v.missing} extra=${v.extra}(${v.extraAmount}) arith=${v.arithmetic} qty=${v.qtyChanged} high=${v.high} low=${v.low} lowest=${v.lowest} vsEst=${v.vsEstimatePct ?? "-"}%`,
    );
}

(async () => {
  const c = arg("compare");
  const rest = process.argv.slice(2).filter((x) => !x.startsWith("--"));
  if (c) return compare(c, rest[0]);
  for (const a of rest) await walk(a);
})();
