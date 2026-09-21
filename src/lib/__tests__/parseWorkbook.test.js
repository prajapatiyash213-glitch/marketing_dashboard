import { describe, it, expect } from "vitest";
import * as XLSX from "xlsx";
import { parseWorkbook } from "../parseWorkbook.js";
import { dayKey } from "../dates.js";

/** Builds a real xlsx buffer so the test exercises SheetJS, not a stand-in. */
function workbook(sheets) {
  const wb = XLSX.utils.book_new();
  for (const [name, aoa] of Object.entries(sheets)) {
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), name);
  }
  return XLSX.write(wb, { bookType: "xlsx", type: "array" });
}

const LEADS = [
  ["Website visitors export — generated sample"],
  [],
  ["Name", "Company", "Stage", "Lead Type", "Current Status", "Lead Value", "Visit Date"],
  ["Meera Iyer", "Arcelia Industries", "Qualified", "Organic Search", "Meeting booked", "₹12,50,000", "2026-07-03"],
  ["Rohan Shah", "Novaris Technologies", "Disqualified", "Outbound", "Not interested", "8 lakh", "2026-07-10"],
];

const SPLIT_NAMES = [
  ["First Name", "Last Name", "Company Name", "Lead Stage", "Annual Revenue", "Date"],
  ["Priya", "Nair", "Karyan Logistics", "Closed Won", 2100000, "22/04/2026"],
];

const MATRIX = [
  ["Weekly SEO performance"],
  [],
  ["Metric", "3-Jul", "10-Jul", "17-Jul"],
  ["Traffic (GA4) - Views", 3120, 3380, 3210],
  ["Bounce Rate", "58%", "56.4%", "55%"],
  ["Backlinks", 412, 430, 451],
];

describe("parseWorkbook end to end", () => {
  it("reads a multi-sheet workbook and routes each sheet to the right parser", () => {
    const buf = workbook({ "Website Visitors - People": LEADS, "Weekly Matrix": MATRIX, Instructions: [["Fill this in"]] });
    const out = parseWorkbook(buf, "mixed.xlsx");

    expect(out.leads).toHaveLength(2);
    expect(out.seoWeeks).toHaveLength(3);
    expect(out.file.sheets.map((s) => s.kind)).toEqual(["leads", "seo", "unrecognised"]);
  });

  it("keeps values, stages and dates intact through a real xlsx round trip", () => {
    const out = parseWorkbook(workbook({ Sheet1: LEADS }), "visitors.xlsx");
    const [first, second] = out.leads;

    expect(first.name).toBe("Meera Iyer");
    expect(first.value).toBe(1250000);
    expect(dayKey(first.date)).toBe("2026-07-03");
    expect(second.stage).toBe("Closed Lost");
    expect(second.value).toBe(800000);
  });

  it("joins split name columns and reads day-first dates", () => {
    const out = parseWorkbook(workbook({ Leads: SPLIT_NAMES }), "main.xlsx");
    expect(out.leads[0].name).toBe("Priya Nair");
    expect(dayKey(out.leads[0].date)).toBe("2026-04-22");
    expect(out.leads[0].stage).toBe("Closed Won");
  });

  it("unpivots the SEO matrix and reports which metrics it found", () => {
    const out = parseWorkbook(workbook({ Matrix: MATRIX }), "seo.xlsx");
    expect(out.seoWeeks.map((w) => w.views)).toEqual([3120, 3380, 3210]);
    expect(out.seoWeeks[1].bounce).toBeCloseTo(56.4);
    const metrics = out.file.sheets[0].metrics.map((m) => m.metric);
    expect(metrics).toEqual(["views", "bounce", "backlinks"]);
  });

  it("keeps raw rows for lead sheets so a mapping can be corrected later", () => {
    const out = parseWorkbook(workbook({ Sheet1: LEADS }), "visitors.xlsx");
    expect(out.rawSheets.Sheet1).toBeDefined();
    // blank rows are dropped during parsing, so index 1 is the header, not index 2
    expect(out.rawSheets.Sheet1[1][0]).toBe("Name");
  });

  it("surfaces the detected mapping, flagging guesses", () => {
    const out = parseWorkbook(workbook({ Sheet1: LEADS }), "visitors.xlsx");
    const { map } = out.file.sheets[0].mapping;
    expect(map.source.header).toBe("Lead Type");
    expect(map.status.header).toBe("Current Status");
    expect(map.value.header).toBe("Lead Value");
  });

  it("does not throw on an empty workbook", () => {
    const out = parseWorkbook(workbook({ Blank: [[]] }), "empty.xlsx");
    expect(out.leads).toHaveLength(0);
    expect(out.seoWeeks).toHaveLength(0);
  });

  it("recognises matrix sheets with date serial headers and maps site correctly", () => {
    // 46206 = 3-Jul-2026, 46213 = 10-Jul-2026, 46220 = 17-Jul-2026
    const numericDateMatrix = [
      ["Category", "Key Metrics", 46206, 46213, 46220],
      ["Website + SEO", "Traffic (GA4) - Views", 167, 215, 235],
      ["", "Bounce Rate", "40.79%", "53.15%", "46.27%"],
      ["", "Backlinks", "222 (DF - 121, NF - 101)", "238", "247"],
    ];
    const out = parseWorkbook(workbook({ Sheet1: numericDateMatrix }), "KPI _ Automation COE.xlsx");
    expect(out.seoWeeks).toHaveLength(3);
    expect(out.seoWeeks[0].site).toBe("automationcoe.com");
    expect(out.seoWeeks[0].views).toBe(167);
    expect(out.file.sheets[0].kind).toBe("seo");
  });

  it("excludes monthly and ytd sheets from seoWeeks in multi-sheet KPI workbooks", () => {
    const ytd = [["KPI", "Current", "YTD"], ["MQLs", 0, 12]];
    const monthly = [["KPI", "July 25", "Aug 25", "Sep 25"], ["Organic Traffic (GA4)", 0, 355, 538]];
    const weekly = [
      ["Category", "Key Metrics", "30-Sep", "3-Oct", "10-Oct"],
      ["Website + SEO", "Traffic (GA4) - Views", 812, 652, 853],
    ];
    const out = parseWorkbook(workbook({ YTD: ytd, Monthly: monthly, Weekly: weekly }), "Tecnoprism _ KPIs.xlsx");
    expect(out.seoWeeks).toHaveLength(3);
    expect(out.seoWeeks[0].label).toBe("30-Sep");
    expect(out.file.sheets.find((s) => s.sheet === "Weekly")?.kind).toBe("seo");
    expect(out.file.sheets.find((s) => s.sheet === "Monthly")?.kind).not.toBe("seo");
  });
});

