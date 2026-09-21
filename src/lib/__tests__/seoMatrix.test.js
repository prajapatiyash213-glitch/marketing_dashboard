import { describe, it, expect } from "vitest";
import { parseSeoMatrix, mergeSeoWeeks, classifyMetric } from "../seoMatrix.js";

const MATRIX = [
  ["Weekly SEO report", null, null, null],
  ["Metric", "3-Jul", "10-Jul", "17-Jul"],
  ["Traffic (GA4) - Views", 3120, 3380, 3210],
  ["Total Users", 2280, 2410, 2290],
  ["Bounce Rate", "58%", "56.4%", "55%"],
  ["Leads (forms+chatbot)", 38, 44, 41],
  ["Backlinks", 412, 430, 451],
  ["Domain Authority", 31.5, 31.8, 32.1],
  ["Notes", "campaign live", null, null],
];

describe("parseSeoMatrix", () => {
  const result = parseSeoMatrix(MATRIX);

  it("finds the header row below the title", () => {
    expect(result.headerRow).toBe(1);
  });

  it("produces one row per week, in date order", () => {
    expect(result.weeks.map((w) => w.label)).toEqual(["3-Jul", "10-Jul", "17-Jul"]);
  });

  it("unpivots each metric onto its week", () => {
    const [first] = result.weeks;
    expect(first.views).toBe(3120);
    expect(first.users).toBe(2280);
    expect(first.seoLeads).toBe(38);
    expect(first.backlinks).toBe(412);
    expect(first.da).toBe(31.5);
  });

  it("reads bounce rate as a percentage regardless of how it is written", () => {
    expect(result.weeks[1].bounce).toBeCloseTo(56.4);
  });

  it("ignores rows that are not metrics", () => {
    expect(result.metrics.some((m) => m.sourceLabel === "Notes")).toBe(false);
  });

  it("returns null for a lead sheet so the caller can try the other parser", () => {
    expect(parseSeoMatrix([["Name", "Company", "Stage"], ["Meera", "Arcelia", "Qualified"]])).toBeNull();
  });

  it("requires several week columns before claiming a sheet", () => {
    expect(parseSeoMatrix([["Metric", "3-Jul"], ["Views", 10]])).toBeNull();
  });
});

describe("classifyMetric", () => {
  it("keeps users and views apart", () => {
    expect(classifyMetric("Total Users")).toBe("users");
    expect(classifyMetric("Traffic (GA4) - Views")).toBe("views");
  });
  it("recognises alternative wording", () => {
    expect(classifyMetric("Referring domains")).toBe("backlinks");
    expect(classifyMetric("DR")).toBe("da");
  });
});

import { EXACT_SEO_RAW_MATRIX } from "../exactSeoData.js";

describe("mergeSeoWeeks", () => {
  it("updates a week rather than duplicating it when a file is re-imported", () => {
    const a = parseSeoMatrix(MATRIX).weeks;
    const merged = mergeSeoWeeks(a, [{ ...a[0], views: 9999 }]);
    expect(merged).toHaveLength(3);
    expect(merged[0].views).toBe(9999);
  });
});

describe("EXACT_SEO_RAW_MATRIX parsing", () => {
  const result = parseSeoMatrix(EXACT_SEO_RAW_MATRIX, { today: new Date("2026-09-10") });

  it("parses all 45 weeks and all 11 metrics", () => {
    expect(result).not.toBeNull();
    expect(result.weeks).toHaveLength(45);
    expect(result.metrics.map((m) => m.metric)).toEqual([
      "views", "users", "bounce", "as", "da", "seoLeads", "downloads", "pa", "keywords", "backlinks", "aiSearch"
    ]);
  });

  it("extracts exact initial and final week values", () => {
    const first = result.weeks[0];
    expect(first.label).toBe("30-Sep");
    expect(first.views).toBe(812);
    expect(first.users).toBe(229);
    expect(first.bounce).toBe(41.39);
    expect(first.as).toBe(3);
    expect(first.da).toBe(9);
    expect(first.seoLeads).toBe(2);
    expect(first.downloads).toBe(0);
    expect(first.pa).toBe(20);
    expect(first.keywords ?? null).toBeNull();
    expect(first.backlinks).toBe(29);
    expect(first.aiSearch).toBe(0);

    const last = result.weeks[44];
    expect(last.label).toBe("31-Jul");
    expect(last.views).toBe(610);
    expect(last.users).toBe(173);
    expect(last.bounce).toBe(45.63);
    expect(last.as).toBe(9);
    expect(last.da).toBe(16);
    expect(last.seoLeads).toBe(0);
    expect(last.downloads).toBe(0);
    expect(last.pa).toBe(28);
    expect(last.keywords).toBe(13);
    expect(last.backlinks).toBe(611);
    expect(last.aiSearch).toBe(28);
  });
});
