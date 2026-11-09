import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseWorkbook } from "../src/lib/parseWorkbook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const GOOGLE_SHEETS = [
  {
    id: "1G6hN7zR-4vkwUgANW1Fi3lLVCfME6kqJcHu4-1YZgRI",
    name: "Tecnoprism",
    site: "tecnoprism.com",
    sheetUrl: "https://docs.google.com/spreadsheets/d/1G6hN7zR-4vkwUgANW1Fi3lLVCfME6kqJcHu4-1YZgRI/edit?gid=0#gid=0",
    exportUrl: "https://docs.google.com/spreadsheets/d/1G6hN7zR-4vkwUgANW1Fi3lLVCfME6kqJcHu4-1YZgRI/export?format=csv",
    targetFile: "Key Metrics of Marketing(Tecnoprism) (4).csv",
    format: "csv",
  },
  {
    id: "1YVysKInWrAQBa_TrU6pnsmNQ2Ds86ZGb7ogf1-uYGho",
    name: "Automation COE",
    site: "automationcoe.com",
    sheetUrl: "https://docs.google.com/spreadsheets/d/1YVysKInWrAQBa_TrU6pnsmNQ2Ds86ZGb7ogf1-uYGho/edit?usp=sharing",
    exportUrl: "https://docs.google.com/spreadsheets/d/1YVysKInWrAQBa_TrU6pnsmNQ2Ds86ZGb7ogf1-uYGho/export?format=xlsx",
    targetFile: "KPI _ Automation COE (2).xlsx",
    format: "xlsx",
  },
];

export async function syncGoogleSheet() {
  const results = [];
  const metaList = [];

  for (const sheet of GOOGLE_SHEETS) {
    console.log(`[Google Sheet Sync] Fetching ${sheet.name} from ${sheet.exportUrl}...`);
    try {
      const res = await fetch(sheet.exportUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
        },
      });

      if (!res.ok) {
        throw new Error(`Google Sheet [${sheet.name}] returned HTTP ${res.status}: ${res.statusText}`);
      }

      const arrayBuffer = await res.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length < 200) {
        throw new Error(`Received unexpectedly small file from Google Sheets for ${sheet.name}`);
      }

      const parsed = parseWorkbook(arrayBuffer, sheet.targetFile);
      const weeks = parsed?.seoWeeks || [];
      const latestWeek = weeks.length ? weeks[weeks.length - 1] : null;

      console.log(`[Google Sheet Sync] Parsed ${weeks.length} weeks of SEO data for ${sheet.name}! Latest week: ${latestWeek?.label || "N/A"}`);

      const targetPublicPath = path.resolve(__dirname, `../public/master/${sheet.targetFile}`);
      const targetDistPath = path.resolve(__dirname, `../dist/master/${sheet.targetFile}`);

      fs.mkdirSync(path.dirname(targetPublicPath), { recursive: true });
      fs.writeFileSync(targetPublicPath, buffer);

      if (fs.existsSync(path.resolve(__dirname, "../dist"))) {
        fs.mkdirSync(path.dirname(targetDistPath), { recursive: true });
        fs.writeFileSync(targetDistPath, buffer);
      }

      const itemMeta = {
        name: sheet.name,
        sheetId: sheet.id,
        sheetUrl: sheet.sheetUrl,
        site: sheet.site,
        targetFile: sheet.targetFile,
        weeksCount: weeks.length,
        latestWeek: latestWeek?.label || null,
        latestWeekDate: latestWeek?.date || null,
        latestViews: latestWeek?.views || null,
        latestUsers: latestWeek?.users || null,
        latestBounce: latestWeek?.bounce || null,
      };

      metaList.push(itemMeta);
      results.push({
        name: sheet.name,
        targetFile: sheet.targetFile,
        weeksCount: weeks.length,
        latestWeek: latestWeek?.label || null,
        bufferLength: buffer.length,
      });
    } catch (err) {
      console.error(`[Google Sheet Sync Error - ${sheet.name}]:`, err.message);
      throw err;
    }
  }

  const primaryTecnoprism = metaList.find((m) => m.site === "tecnoprism.com") || metaList[0];
  const totalWeeks = metaList.reduce((acc, m) => acc + (m.weeksCount || 0), 0);

  const meta = {
    sheetId: primaryTecnoprism?.sheetId || GOOGLE_SHEETS[0].id,
    sheetUrl: primaryTecnoprism?.sheetUrl || GOOGLE_SHEETS[0].sheetUrl,
    site: primaryTecnoprism?.site || "tecnoprism.com",
    weeksCount: primaryTecnoprism?.weeksCount || 0,
    latestWeek: primaryTecnoprism?.latestWeek || null,
    latestWeekDate: primaryTecnoprism?.latestWeekDate || null,
    latestViews: primaryTecnoprism?.latestViews || null,
    latestUsers: primaryTecnoprism?.latestUsers || null,
    latestBounce: primaryTecnoprism?.latestBounce || null,
    totalWeeksCount: totalWeeks,
    lastSynced: new Date().toISOString(),
    sheets: metaList,
  };

  const metaPublicPath = path.resolve(__dirname, "../public/master/google_sheet_sync.json");
  const metaDistPath = path.resolve(__dirname, "../dist/master/google_sheet_sync.json");

  fs.writeFileSync(metaPublicPath, JSON.stringify(meta, null, 2), "utf8");
  if (fs.existsSync(path.resolve(__dirname, "../dist"))) {
    fs.writeFileSync(metaDistPath, JSON.stringify(meta, null, 2), "utf8");
  }

  return {
    success: true,
    meta,
    results,
  };
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").includes("scripts/sync-google-sheet.mjs")) {
  syncGoogleSheet()
    .then((r) => console.log("[Google Sheet Sync] Done. Synced sheets:", r.results))
    .catch((e) => console.error("[Google Sheet Sync] Failed:", e));
}
