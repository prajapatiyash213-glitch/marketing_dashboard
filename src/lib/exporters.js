import * as XLSX from "xlsx";
import { dayKey } from "./dates.js";
import { SEO_METRICS } from "./seoMatrix.js";

const LEAD_COLUMNS = [
  ["Name", (l) => l.name],
  ["Company", (l) => l.company],
  ["Job title", (l) => l.title],
  ["Stage", (l) => l.stage],
  ["Stage as written", (l) => l.stageRaw],
  ["Source", (l) => l.source],
  ["Lead status", (l) => l.status],
  ["Value", (l) => l.value],
  ["Date", (l) => (l.date ? dayKey(l.date) : "")],
  ["Email", (l) => l.email],
  ["Phone", (l) => l.phone],
  ["Source file", (l) => l.file],
  ["Sheet", (l) => l.sheet],
];

export const leadRows = (leads) =>
  leads.map((l) => Object.fromEntries(LEAD_COLUMNS.map(([h, get]) => [h, get(l)])));

export const seoRows = (weeks) =>
  weeks.map((w) => ({
    Week: w.label,
    Date: dayKey(w.date),
    [SEO_METRICS.views]: w.views ?? "",
    [SEO_METRICS.users]: w.users ?? "",
    [SEO_METRICS.bounce]: w.bounce ?? "",
    [SEO_METRICS.seoLeads]: w.seoLeads ?? "",
    [SEO_METRICS.backlinks]: w.backlinks ?? "",
    [SEO_METRICS.da]: w.da ?? "",
  }));

const escapeCsv = (v) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCsv(rows) {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  return [headers.join(","), ...rows.map((r) => headers.map((h) => escapeCsv(r[h])).join(","))].join("\r\n");
}

export function buildWorkbook({ leads, weeks, funnel }) {
  const wb = XLSX.utils.book_new();
  if (leads?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(leadRows(leads)), "Leads");
  if (weeks?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(seoRows(weeks)), "SEO weekly");
  if (funnel?.length) XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(funnel), "Funnel");
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
