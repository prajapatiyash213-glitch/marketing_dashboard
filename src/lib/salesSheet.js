import { detectHeaderRow, mapHeaders, identifiable } from "./fieldMap.js";
import { normalizeStage } from "./stages.js";
import { parseCurrency } from "./numbers.js";
import { parseDateCell, detectDayFirst, prettyDate, dayKey, fromLocalDate } from "./dates.js";
import { detectPipeline, detectSite } from "./segments.js";

const asText = (v) => {
  if (v === null || v === undefined) return "";
  if (v instanceof Date) return dayKey(fromLocalDate(v));
  return String(v).trim();
};

/**
 * Turns a sheet into lead records.
 * `overrides` lets the UI correct a mis-detected column: { company: 4 } forces
 * the company field to column index 4 regardless of what matching decided.
 */
export function parseSalesSheet(rows, { fileName, sheetName, overrides = {} } = {}) {
  const detected = detectHeaderRow(rows);
  if (!detected) return null;

  const { headerRow, header } = detected;
  const map = { ...detected.map };
  for (const [field, index] of Object.entries(overrides)) {
    if (index === null || index === undefined || index === "") delete map[field];
    else map[field] = { index: Number(index), header: String(header[index] ?? ""), confidence: "manual" };
  }
  if (!identifiable(map)) return null;

  const body = rows.slice(headerRow + 1);

  // Decide day-first once per column rather than guessing on every row.
  const dateCol = map.date?.index;
  const dayFirst = dateCol == null
    ? { dayFirst: true, certain: false }
    : detectDayFirst(body.map((r) => (r || [])[dateCol]));

  const leads = [];
  let undated = 0;

  for (let i = 0; i < body.length; i++) {
    const row = body[i] || [];
    if (row.every((c) => c === null || c === undefined || String(c).trim() === "")) continue;

    const raw = (field) => (map[field] ? row[map[field].index] : null);
    const text = (field) => asText(raw(field));

    let name = text("name");
    if (!name) name = [text("firstName"), text("lastName")].filter(Boolean).join(" ").trim();
    const company = text("company");
    const email = text("email");
    if (!name && !company && !email) continue;

    const stageText = text("stage");
    const status = text("status");
    const date = parseDateCell(raw("date"), { dayFirst: dayFirst.dayFirst });
    if (!date) undated++;

    leads.push({
      id: `${fileName}::${sheetName}::${headerRow + 1 + i}`,
      pipeline: detectPipeline({ explicit: text("pipeline"), sheetName, fileName }),
      site: detectSite({ explicit: text("site"), sheetName, fileName }),
      campaign: text("campaign"),
      medium: text("medium"),
      name: name || "—",
      company: company || "—",
      title: text("title"),
      stage: normalizeStage(stageText, status),
      stageRaw: stageText || status || "",
      source: text("source") || "Unattributed",
      status: status || stageText || "—",
      value: parseCurrency(raw("value")),
      email,
      phone: text("phone"),
      date,
      dateText: date ? prettyDate(date) : "",
      file: fileName,
      sheet: sheetName,
    });
  }

  if (!leads.length) return null;
  return {
    leads,
    mapping: { headerRow, header: header.map(String), map, dayFirst, undated },
  };
}

/** Re-runs one sheet with corrected column choices. */
export function remapSheet(rows, context, overrides) {
  return parseSalesSheet(rows, { ...context, overrides });
}

export { mapHeaders };
