import * as XLSX from "xlsx";
import { parseSeoMatrix, mergeSeoWeeks } from "./seoMatrix.js";
import { parseSalesSheet } from "./salesSheet.js";
import { detectChannelSheet, CHANNEL_SCHEMAS } from "./channels.js";
import { detectSite, detectPipeline } from "./segments.js";

export const MAX_FILE_BYTES = 40 * 1024 * 1024;

export const sheetToMatrix = (ws) =>
  XLSX.utils.sheet_to_json(ws, { header: 1, raw: false, defval: null, blankrows: false });

/**
 * Reads one workbook. Each sheet is tested as an SEO matrix first (a sheet with
 * three or more parseable week columns), then as a lead sheet. Sheet names are
 * never trusted — real files rename tabs constantly.
 *
 * Returns raw rows alongside the parse so the mapping-review screen can re-parse
 * a sheet without asking the user to upload it again.
 */
export function parseWorkbook(arrayBuffer, fileName) {
  const wb = XLSX.read(arrayBuffer, { type: "array", cellDates: true, dense: false });

  const leads = [];
  let seoWeeks = [];
  const channels = { email: [], social: [], landing: [], cost: [], dropoffs: [] };
  const sheets = [];
  const rawSheets = {};

  // Only target the specific "Leads Sheet.xlsx" workbook from user request
  // (which has tabs: Dashboard, Main Leads Sheet, Website, CFO Sheet, etc.)
  const isLeadsSheetFile = /^(?:copy\s+of\s+)?leads?[-_\s]*sheet(?:\s*\(\d+\))?\.(?:xlsx?|xlsm)$/i.test(fileName || "");

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = sheetToMatrix(ws);
    if (!rows.length) {
      sheets.push({ sheet: sheetName, kind: "empty", count: 0 });
      continue;
    }

    // User rule: "ye sheet me only website lead consider"
    // In "Leads Sheet.xlsx", only the "Website" sheet contains valid website leads.
    // Non-website sheets (Dashboard, Main Leads Sheet, CFO Sheet, etc.) must not be imported as leads.
    if (isLeadsSheetFile && !/website/i.test(sheetName)) {
      sheets.push({
        sheet: sheetName,
        kind: "ignored",
        count: 0,
        label: "Ignored (only website leads considered)",
      });
      continue;
    }

    const matrix = parseSeoMatrix(rows, { fileName, sheetName });
    if (matrix) {
      seoWeeks = mergeSeoWeeks(seoWeeks, matrix.weeks);
      sheets.push({ sheet: sheetName, kind: "seo", count: matrix.weeks.length, metrics: matrix.metrics, site: matrix.site });
      continue;
    }

    const channel = detectChannelSheet(rows, {
      fileName,
      sheetName,
      site: detectSite({ sheetName, fileName }),
      pipeline: detectPipeline({ sheetName, fileName }),
    });
    if (channel) {
      channels[channel.channel].push(...channel.records);
      sheets.push({
        sheet: sheetName,
        kind: channel.channel,
        label: CHANNEL_SCHEMAS[channel.channel].label,
        count: channel.records.length,
        mapping: channel.mapping,
      });
      continue;
    }

    const parsed = parseSalesSheet(rows, { fileName, sheetName });
    if (parsed) {
      leads.push(...parsed.leads);
      rawSheets[sheetName] = rows;
      sheets.push({
        sheet: sheetName,
        kind: "leads",
        count: parsed.leads.length,
        mapping: parsed.mapping,
      });
    } else {
      sheets.push({ sheet: sheetName, kind: "unrecognised", count: 0 });
    }
  }

  const channelCount = Object.values(channels).reduce((n, rows) => n + rows.length, 0);
  const cleanLeads = deduplicateLeads(leads);

  return {
    file: { name: fileName, leadCount: cleanLeads.length, seoCount: seoWeeks.length, channelCount, sheets },
    leads: cleanLeads,
    seoWeeks,
    channels,
    rawSheets,
  };
}

/**
 * Deduplicates lead records by email (case-insensitive) or by name + company.
 * Retains the first occurrence and removes redundant duplicate entries.
 */
export function deduplicateLeads(leads) {
  if (!Array.isArray(leads)) return [];
  const seen = new Set();
  return leads.filter((l) => {
    const em = (l.email || "").toLowerCase().trim();
    if (em && em.includes("@") && !["na", "n/a", "-", "none"].includes(em)) {
      const key = `email:${em}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    const nm = (l.name || "").toLowerCase().trim();
    const co = (l.company || "").toLowerCase().trim();
    if (nm && co && nm !== "na" && co !== "na" && nm !== "-" && co !== "-") {
      const key = `name:${nm}::${co}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }
    return true;
  });
}
