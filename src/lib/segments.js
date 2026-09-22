import { norm } from "./fieldMap.js";

/**
 * A lead belongs to a pipeline (a business line) and a visit belongs to a site.
 * Neither is usually written in the sheet, so they are inferred from the file
 * and tab names — with an explicit column always winning when one exists.
 *
 * Add your own properties here; everything downstream reads this list.
 */
export const SITES = [
  { id: "tecnoprism.com", label: "Tecnoprism", match: /tecnoprism|techno ?prism/i, color: "#2D7DD2" },
  {
    id: "automationcoe.com",
    label: "automationCOE",
    aliases: ["ACOE", "Automation CoE", "Automation COE"],
    match: /automation ?coe|automationcoe|\bacoe\b|acoe|\bcoe\b/i,
    color: "#17A398",
  },
];

export const UNASSIGNED_SITE = { id: "unassigned", label: "Unassigned", color: "#8E9BA6" };

export const siteById = (id) =>
  SITES.find(
    (s) =>
      s.id === id ||
      (id && (s.match.test(norm(id)) || s.label.toLowerCase() === String(id).toLowerCase() || (s.aliases && s.aliases.some((a) => norm(a) === norm(id)))))
  ) || UNASSIGNED_SITE;

/** Looks through a file name, tab name and any explicit cell value, in that order of trust. */
export function detectSite({ explicit, sheetName, fileName } = {}) {
  const candidates = [explicit, sheetName, fileName].filter(Boolean).map((v) => norm(v));
  for (const value of candidates) {
    const hit = SITES.find((s) => s.match.test(value));
    if (hit) return hit.id;
  }
  return UNASSIGNED_SITE.id;
}

/**
 * Pipelines are open-ended: whatever the sheet says, or the tab name, or the
 * file name with its extension stripped. Named pipelines get a stable colour so
 * the same line is the same colour in every chart.
 */
const PIPELINE_COLORS = ["#0E7C86", "#E4572E", "#F0A202", "#6A4C93", "#2D7DD2", "#17A398", "#D64550", "#5B8C5A"];

export function detectPipeline({ explicit, sheetName, fileName } = {}) {
  if (explicit && String(explicit).trim()) {
    const raw = String(explicit).trim();
    if (/^(acoe|automation ?coe)$/i.test(raw)) return "automationCOE";
    return raw;
  }
  for (const site of SITES) {
    if ([sheetName, fileName].some((v) => v && site.match.test(norm(v)))) return site.label;
  }
  if (sheetName && !/^sheet\d*$/i.test(sheetName)) return sheetName.trim();
  return String(fileName || "Unassigned").replace(/\.(xlsx|xlsm|xls|csv)$/i, "");
}

/** Stable colour per pipeline name, so charts stay consistent between renders. */
export function pipelineColor(name, index) {
  if (typeof index === "number") return PIPELINE_COLORS[index % PIPELINE_COLORS.length];
  let hash = 0;
  for (let i = 0; i < String(name).length; i++) hash = (hash * 31 + String(name).charCodeAt(i)) >>> 0;
  return PIPELINE_COLORS[hash % PIPELINE_COLORS.length];
}
