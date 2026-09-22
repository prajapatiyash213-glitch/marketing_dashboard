import { parseWeekToken, assignWeekYears, MONTHS } from "./dates.js";
import { parseNumber, parsePercent } from "./numbers.js";
import { norm } from "./fieldMap.js";
import { detectSite } from "./segments.js";

export const SEO_METRICS = {
  views: "Traffic (GA4) - Views",
  users: "Traffic (GA4) - Total Users",
  bounce: "Bounce Rate",
  as: "Authority Score (SEMrush)",
  da: "Domain Authority (DAPA Checker)",
  seoLeads: "Leads (forms+chatbot)",
  downloads: "Downloads",
  pa: "Page Authority (Homepage)",
  keywords: "KW Ranking (top 20)",
  backlinks: "Backlinks",
  aiSearch: "AI Search",
};

/** Metrics that accumulate rather than reset: summing them across weeks is wrong. */
export const STOCK_METRICS = new Set(["backlinks", "da", "as", "pa", "keywords", "aiSearch"]);

export function classifyMetric(raw) {
  if (typeof raw !== "string" && typeof raw !== "number") return null;
  const str = String(raw).trim();
  if (!str || str.length > 80 || /^https?:\/\//i.test(str) || /^mailto:/i.test(str)) return null;
  const s = norm(raw);
  if (!s) return null;
  if (/bounce/.test(s)) return "bounce";
  if (/backlink|referring domain/.test(s)) return "backlinks";
  if (/page authority|\bpa\b/.test(s)) return "pa";
  if (/authority score|semrush|\bas\b/.test(s)) return "as";
  if (/domain authority|domain rating|\bda\b|\bdr\b|dapa/.test(s)) return "da";
  if (/keyword|ranking|\bkw\b/.test(s)) return "keywords";
  if (/total users|\busers\b|\bvisitors\b|\bunique\b/.test(s)) return "users";
  if (/views|traffic|sessions|pageview|ga4|impressions/.test(s)) return "views";
  if (/download/.test(s)) return "downloads";
  if (/(\bleads?\b|\bform\b|chatbot|\benquir|\binquir|\bconversion)/.test(s) && !/leader|developer|engineer|manager|director|vp|executive/i.test(s)) return "seoLeads";
  if (/ai search|ai-search|\bai\b/.test(s)) return "aiSearch";
  return null;
}

export const weekLabel = (d) => `${d.getUTCDate()}-${MONTHS[d.getUTCMonth()]}`;

/**
 * Reads the week columns of a header row as one sequence, so years can be
 * inferred across the run rather than guessed cell by cell.
 * When `stringsOnly` is true (the default when scanning for the header row),
 * only string-typed cells are considered — this prevents Excel date serial
 * numbers stored in data cells from being mistaken for SEO week column headers.
 */
export function readWeekColumns(row, today, { stringsOnly = false } = {}) {
  const found = [];
  for (let c = 0; c < row.length; c++) {
    const cell = row[c];
    if (stringsOnly && typeof cell !== "string") continue;
    const token = parseWeekToken(cell);
    if (token) found.push({ col: c, token });
  }
  if (!found.length) return [];
  const dates = assignWeekYears(found.map((f) => f.token), today);
  return found.map((f, i) => ({
    col: f.col,
    date: dates[i],
    sort: dates[i].getTime(),
    label: weekLabel(dates[i]),
  }));
}

/**
 * Unpivots a horizontal weekly matrix into one row per week.
 *
 * Input  | Metric        | 3-Jul | 10-Jul | 17-Jul |
 *        | Views         |  3120 |   3380 |   3210 |
 * Output [{ label: "3-Jul", views: 3120 }, { label: "10-Jul", views: 3380 }, ...]
 *
 * Returns null when the sheet is not a matrix, so the caller can try to read it
 * as a lead sheet instead.
 */
export function parseSeoMatrix(rows, { minWeeks = 3, headerScanDepth = 10, today, fileName, sheetName } = {}) {
  // Monthly, YTD, and annual summaries are not weekly SEO tracking matrices
  if (sheetName && /^(monthly|month|ytd|annual|yearly|summary)$/i.test(sheetName.trim())) {
    return null;
  }

  // If the sheet contains obvious lead columns in the top header row, it is NOT an SEO matrix
  for (let r = 0; r < Math.min(rows.length, 3); r++) {
    const rowNorm = (rows[r] || []).map((c) => String(c || "").toLowerCase().trim());
    if (rowNorm.some((h) => ["email", "first name", "last name", "lead stage", "lead status", "lead source", "contact owner"].includes(h))) {
      return null;
    }
  }

  const site = detectSite({ sheetName, fileName });
  for (let r = 0; r < Math.min(rows.length, headerScanDepth); r++) {
    const row = rows[r] || [];
    // Allow both string labels (e.g. '3-Jul') and formatted/serial dates in header row
    const weekCols = readWeekColumns(row, today, { stringsOnly: false });
    if (weekCols.length < minWeeks) continue;

    const buckets = new Map(weekCols.map((w) => [w.label, { label: w.label, date: w.date, sort: w.sort, site, file: fileName }]));
    const metricsFound = [];
    const labelBoundary = weekCols[0].col;

    for (let i = r + 1; i < rows.length; i++) {
      const dataRow = rows[i] || [];
      let labelCell = null;
      let metric = null;
      for (let c = 0; c < Math.min(dataRow.length, labelBoundary + 1); c++) {
        const cell = dataRow[c];
        if (cell !== null && cell !== undefined && String(cell).trim() !== "") {
          const candidate = classifyMetric(cell);
          if (candidate) {
            metric = candidate;
            labelCell = cell;
            break;
          }
        }
      }
      if (!metric) continue;

      let wrote = false;
      for (const w of weekCols) {
        const raw = dataRow[w.col];
        const val = metric === "bounce" ? parsePercent(raw) : parseNumber(raw);
        if (val !== null) {
          const target = buckets.get(w.label);
          target[metric] = val;
          if (raw !== null && raw !== undefined && typeof raw === "string" && (raw.includes("(") || raw.includes(",") || isNaN(raw.trim()))) {
            target[`raw_${metric}`] = raw.trim();
          }
          wrote = true;
        }
      }
      if (wrote) metricsFound.push({ metric, sourceLabel: String(labelCell) });
    }

    const coreMetrics = new Set(["views", "users", "bounce", "da", "pa", "as", "keywords", "backlinks"]);
    const hasCoreMetric = metricsFound.some((m) => coreMetrics.has(m.metric));
    if (metricsFound.length >= 2 || (metricsFound.length >= 1 && hasCoreMetric)) {
      return {
        weeks: Array.from(buckets.values()).sort((a, b) => a.sort - b.sort),
        metrics: metricsFound,
        headerRow: r,
        site,
      };
    }
  }
  return null;
}

/** Weeks are keyed by date, so re-importing a file updates rather than duplicates. */
export function mergeSeoWeeks(existing, incoming) {
  const key = (d) => `${d.site || "unassigned"}::${d.sort}`;
  const byKey = new Map(existing.map((d) => [key(d), { ...d }]));
  for (const d of incoming) {
    const cur = byKey.get(key(d));
    byKey.set(key(d), cur ? { ...cur, ...d } : { ...d });
  }
  return Array.from(byKey.values()).sort((a, b) => a.sort - b.sort);
}

/** Purges legacy/corrupted monthly intervals misclassified as weeks (e.g. from previous monthly sheet parse). */
export function sanitizeSeoWeeks(weeks) {
  if (!Array.isArray(weeks)) return [];
  const BOGUS_MONTHLY_LABELS = new Set([
    "25-Jul", "25-Aug", "25-Sep", "25-Oct", "25-Nov", "25-Dec",
    "26-Jan", "26-Feb", "26-Mar", "26-Apr", "26-May", "26-Jun"
  ]);
  return weeks.filter((w) => !(w.site === "tecnoprism.com" && BOGUS_MONTHLY_LABELS.has(w.label)));
}

