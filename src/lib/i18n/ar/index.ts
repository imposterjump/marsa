import type { Dictionary } from "../core";
import { analysis } from "./analysis";
import { common } from "./common";
import { comparison } from "./comparison";
import { projects } from "./projects";
import { proposals } from "./proposals";
import { results } from "./results";
import { server } from "./server";
import { settings } from "./settings";
import { shell } from "./shell";
import { standards } from "./standards";
import { ui } from "./ui";
import { viewer } from "./viewer";

/** One file per area so translations can be edited side by side; a key may live in only one. */
export const AR_PARTS: Record<string, Dictionary> = {
  common,
  shell,
  ui,
  analysis,
  comparison,
  results,
  projects,
  proposals,
  standards,
  settings,
  viewer,
  server,
};

export const AR: Dictionary = Object.assign({}, ...Object.values(AR_PARTS));
