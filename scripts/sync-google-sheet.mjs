import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { parseWorkbook } from "../src/lib/parseWorkbook.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SHEET_ID = "1YVysKInWrAQBa_TrU6pnsmNQ2Ds86ZGb7ogf1-uYGho";
const GOOGLE_SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit?usp=sharing`;
const GOOGLE_SHEET_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=xlsx`;

export async function syncGoogleSheet() {
  console.log(`[Google Sheet Sync] Fetching live sheet from ${GOOGLE_SHEET_EXPORT_URL}...`);
  try {
    const res = await fetch(GOOGLE_SHEET_EXPORT_URL, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!res.ok) {
      throw new Error(`Google Sheet returned HTTP ${res.status}: ${res.statusText}`);
    }

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    if (buffer.length < 500) {
      throw new Error("Received unexpectedly small file from Google Sheets");
    }

    // Verify parser on the downloaded buffer
    const parsed = parseWorkbook(arrayBuffer, "KPI _ Automation COE (2).xlsx");
    const weeks = parsed?.seoWeeks || [];
    const latestWeek = weeks.length ? weeks[weeks.length - 1] : null;

    console.log(`[Google Sheet Sync] Parsed ${weeks.length} weeks of SEO data! Latest week: ${latestWeek?.label || "N/A"}`);

    const targetPublicPath = path.resolve(__dirname, "../public/master/KPI _ Automation COE (2).xlsx");
    const targetDistPath = path.resolve(__dirname, "../dist/master/KPI _ Automation COE (2).xlsx");
    const metaPublicPath = path.resolve(__dirname, "../public/master/google_sheet_sync.json");
    const metaDistPath = path.resolve(__dirname, "../dist/master/google_sheet_sync.json");

    fs.mkdirSync(path.dirname(targetPublicPath), { recursive: true });
    fs.writeFileSync(targetPublicPath, buffer);

    if (fs.existsSync(path.resolve(__dirname, "../dist"))) {
      fs.mkdirSync(path.dirname(targetDistPath), { recursive: true });
      fs.writeFileSync(targetDistPath, buffer);
    }

    const meta = {
      sheetId: SHEET_ID,
      sheetUrl: GOOGLE_SHEET_URL,
      site: "automationcoe.com",
      weeksCount: weeks.length,
      latestWeek: latestWeek?.label || null,
      latestWeekDate: latestWeek?.date || null,
      latestViews: latestWeek?.views || null,
      latestUsers: latestWeek?.users || null,
      latestBounce: latestWeek?.bounce || null,
      lastSynced: new Date().toISOString(),
    };

    fs.writeFileSync(metaPublicPath, JSON.stringify(meta, null, 2), "utf8");
    if (fs.existsSync(path.resolve(__dirname, "../dist"))) {
      fs.writeFileSync(metaDistPath, JSON.stringify(meta, null, 2), "utf8");
    }

    return {
      success: true,
      meta,
      bufferLength: buffer.length,
    };
  } catch (err) {
    console.error("[Google Sheet Sync Error]:", err.message);
    throw err;
  }
}

if (process.argv[1] && process.argv[1].replace(/\\/g, "/").includes("scripts/sync-google-sheet.mjs")) {
  syncGoogleSheet()
    .then((r) => console.log("[Google Sheet Sync] Done:", r.meta))
    .catch((e) => console.error("[Google Sheet Sync] Failed:", e));
}
