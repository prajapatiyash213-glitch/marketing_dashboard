/**
 * Header matching. Two passes: exact alias match across every field first, then
 * substring matching over what is left. Columns are claimed as they are taken,
 * which is what stops "Lead Status" being swallowed by the Stage matcher.
 *
 * Order inside each alias list is priority order.
 */

export const norm = (s) => {
  if (s === null || s === undefined || s instanceof Date) return "";
  return String(s)
    .toLowerCase()
    .replace(/[\s_\-/.]+/g, " ")
    .replace(/[^a-z0-9 &+()]/g, "")
    .replace(/\s+/g, " ")
    .trim();
};

export const FIELD_DEFS = [
  ["firstName", "First name", ["first name", "firstname", "fname", "given name"]],
  ["lastName", "Last name", ["last name", "lastname", "lname", "surname", "family name"]],
  ["name", "Name", ["name", "full name", "lead name", "contact name", "contact person", "person", "attendee", "contact"]],
  ["company", "Company", ["company", "company name", "organisation", "organization", "account name", "account", "employer", "firm"]],
  ["stage", "Stage", ["stage", "lead stage", "deal stage", "sales stage", "pipeline stage", "funnel stage"]],
  ["source", "Source", ["source", "lead source", "lead type", "channel", "origin", "utm source", "campaign"]],
  ["status", "Lead status", ["lead status", "current status", "status", "state", "disposition"]],
  ["value", "Value", ["lead value", "annual revenue", "deal value", "opportunity value", "estimated value", "value", "revenue", "arr", "amount", "potential"]],
  ["date", "Date", ["date", "created", "created on", "created date", "date added", "captured on", "visit date", "enquiry date", "timestamp", "first seen"]],
  ["title", "Job title", ["designation", "job title", "title", "role", "position"]],
  ["email", "Email", ["email", "email address", "e mail", "work email"]],
  ["phone", "Phone", ["phone", "mobile", "contact number", "phone number"]],
  ["pipeline", "Pipeline", ["pipeline", "business unit", "business line", "vertical", "product line", "brand", "practice", "division"]],
  ["site", "Website", ["site", "website", "domain", "property", "web property"]],
  ["campaign", "Campaign", ["utm campaign", "campaign name"]],
  ["medium", "UTM medium", ["utm medium", "medium"]],
];

export const FIELD_LABELS = Object.fromEntries(FIELD_DEFS.map(([k, label]) => [k, label]));

/**
 * Generic two-pass column matcher, shared by every sheet type.
 * `defs` is [field, label, aliases][]. Returns { field: { index, header, confidence } }.
 */
export function matchColumns(headers, defs) {
  const normed = headers.map(norm);
  const claimed = new Set();
  const map = {};

  for (const [field, , aliases] of defs) {
    for (const alias of aliases) {
      const i = normed.findIndex((h, ix) => !claimed.has(ix) && h === alias);
      if (i >= 0) {
        map[field] = { index: i, header: String(headers[i]), confidence: "exact" };
        claimed.add(i);
        break;
      }
    }
  }
  for (const [field, , aliases] of defs) {
    if (map[field]) continue;
    for (const alias of aliases) {
      const i = normed.findIndex((h, ix) => !claimed.has(ix) && h.length > 1 && h.includes(alias));
      if (i >= 0) {
        map[field] = { index: i, header: String(headers[i]), confidence: "guess" };
        claimed.add(i);
        break;
      }
    }
  }
  return map;
}

/** Returns { field: { index, header, confidence } } so the UI can show its work. */
export const mapHeaders = (headers) => matchColumns(headers, FIELD_DEFS);

export const identifiable = (map) => Boolean(map.name || map.firstName || map.company || map.email);

/**
 * Finds the header row. Sheets often start with a title or a blank row, so we
 * scan down until a row both looks like headers and yields an identifying field.
 */
export function detectHeaderRow(rows, limit = 12) {
  for (let r = 0; r < Math.min(rows.length, limit); r++) {
    const header = (rows[r] || []).map((c) => (c === null || c === undefined ? "" : c));
    if (header.filter((c) => String(c).trim() !== "").length < 2) continue;
    const map = mapHeaders(header);
    if (identifiable(map)) return { headerRow: r, header, map };
  }
  return null;
}
