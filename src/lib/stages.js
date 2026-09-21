export const STAGES = ["Discovery", "Qualified", "Proposal", "Closed Won", "Closed Lost"];

export const STAGE_COLOR = {
  Discovery: "#8E9BA6",
  Qualified: "#3D6091",
  Proposal: "#C0863A",
  "Closed Won": "#2E7D5B",
  "Closed Lost": "#A64B4B",
};

/** Stages counted as having advanced past discovery. Closed Lost is excluded. */
export const ADVANCED_STAGES = ["Qualified", "Proposal", "Closed Won"];

import { norm } from "./fieldMap.js";

/**
 * Order matters. "disqualified" contains "qualified", and "closed won" contains
 * "closed", so the specific rules run before the general ones.
 */
const RULES = [
  [/disqualif|unqualif/, "Closed Lost"],
  [/closed won|won|converted|customer|signed|onboard|success/, "Closed Won"],
  [/closed lost|lost|dropped|dead|not interested|rejected|no response|churn/, "Closed Lost"],
  [/proposal|quote|quotation|negotiat|pricing|contract|poc|pilot|evaluation|shortlist/, "Proposal"],
  [/qualified|sql|qualification|demo|meeting|engaged|warm|interested|opportunity/, "Qualified"],
];

export function normalizeStage(raw, fallback) {
  const s = norm(raw) || norm(fallback);
  if (!s) return "Discovery";
  for (const [re, stage] of RULES) if (re.test(s)) return stage;
  return "Discovery";
}
