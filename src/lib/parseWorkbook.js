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
  const channels = { email: [], social: [], landing: [], cost: [] };
  const sheets = [];
  const rawSheets = {};

  for (const sheetName of wb.SheetNames) {
    const ws = wb.Sheets[sheetName];
    if (!ws) continue;
    const rows = sheetToMatrix(ws);
    if (!rows.length) {
      sheets.push({ sheet: sheetName, kind: "empty", count: 0 });
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

  return {
    file: { name: fileName, leadCount: leads.length, seoCount: seoWeeks.length, channelCount, sheets },
    leads,
    seoWeeks,
    channels,
    rawSheets,
  };
}
