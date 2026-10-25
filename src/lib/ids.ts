import { customAlphabet } from "nanoid";

// No look-alike characters (0/O, 1/l/I) so IDs are readable in URLs and logs.
const nano = customAlphabet("23456789abcdefghijkmnpqrstuvwxyz", 14);

export const ID_PREFIXES = {
  project: "prj",
  document: "doc",
  vendor: "ven",
  proposal: "prp",
  standard: "std",
  rule: "rul",
  run: "run",
  step: "stp",
  requirement: "req",
  evaluation: "evl",
  finding: "fnd",
  comparison: "cmp",
  risk: "rsk",
  review: "rvw",
  import: "imp",
} as const;

export type IdKind = keyof typeof ID_PREFIXES;

export function newId(kind: IdKind): string {
  return `${ID_PREFIXES[kind]}_${nano()}`;
}
