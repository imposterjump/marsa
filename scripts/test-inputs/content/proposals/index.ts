import { ATLAS } from "./atlas";
import { HARBORLINE } from "./harborline";
import { MERIDIAN } from "./meridian";
import { NILE_GATE } from "./nile-gate";

/** Submission order (oldest first), as the bids would reach the Tender Committee. */
export const VENDORS = [ATLAS, NILE_GATE, HARBORLINE, MERIDIAN];
export { commercialHtml, technicalHtml, totals, usd, type VendorSpec } from "./common";
