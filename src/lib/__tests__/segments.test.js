import { describe, it, expect } from "vitest";
import { detectSite, detectPipeline, SITES } from "../segments.js";

describe("detectSite", () => {
  it("recognises each property from a file or tab name", () => {
    expect(detectSite({ fileName: "SEO_Matrix_Tecnoprism.xlsx" })).toBe("tecnoprism.com");
    expect(detectSite({ sheetName: "automationcoe weekly" })).toBe("automationcoe.com");
    expect(detectSite({ fileName: "Automation CoE - SEO.xlsx" })).toBe("automationcoe.com");
    expect(detectSite({ fileName: "ACOE_SEO.xlsx" })).toBe("automationcoe.com");
    expect(detectSite({ sheetName: "ACOE" })).toBe("automationcoe.com");
    expect(detectSite({ explicit: "ACOE" })).toBe("automationcoe.com");
  });

  it("lets an explicit column win over the file name", () => {
    expect(detectSite({ explicit: "automationcoe.com", fileName: "tecnoprism-export.xlsx" })).toBe("automationcoe.com");
    expect(detectSite({ explicit: "ACOE", fileName: "tecnoprism-export.xlsx" })).toBe("automationcoe.com");
  });

  it("falls back to unassigned rather than guessing", () => {
    expect(detectSite({ fileName: "Q3 numbers.xlsx" })).toBe("unassigned");
  });

  it("covers every configured site", () => {
    for (const site of SITES) expect(detectSite({ fileName: site.id })).toBe(site.id);
  });
});

describe("detectPipeline", () => {
  it("prefers an explicit pipeline column and maps ACOE to automationCOE", () => {
    expect(detectPipeline({ explicit: "Outbound", sheetName: "Sheet1" })).toBe("Outbound");
    expect(detectPipeline({ explicit: "ACOE", sheetName: "Sheet1" })).toBe("automationCOE");
    expect(detectPipeline({ explicit: "Automation CoE", sheetName: "Sheet1" })).toBe("automationCOE");
  });
  it("names a pipeline after the site when the sheet is site-specific", () => {
    expect(detectPipeline({ fileName: "Automation CoE Leads.xlsx" })).toBe("automationCOE");
    expect(detectPipeline({ fileName: "ACOE Leads.xlsx" })).toBe("automationCOE");
  });
  it("uses the tab name when it is meaningful", () => {
    expect(detectPipeline({ sheetName: "Main Leads Sheet", fileName: "x.xlsx" })).toBe("Main Leads Sheet");
    expect(detectPipeline({ sheetName: "ACOE Leads", fileName: "x.xlsx" })).toBe("automationCOE");
  });
  it("ignores default tab names like Sheet1", () => {
    expect(detectPipeline({ sheetName: "Sheet1", fileName: "Q3 Leads.xlsx" })).toBe("Q3 Leads");
  });
});
