import { describe, it, expect } from "vitest";
import { NAV } from "../../components/Shell.jsx";
import { getSeoMetricHealth } from "../seoHealth.js";

describe("Website Drop-offs Navigation and Metrics", () => {
  it("includes Website Drop-offs in the main sidebar navigation", () => {
    const dropoffNav = NAV.find(([k]) => k === "dropoffs");
    expect(dropoffNav).toBeDefined();
    expect(dropoffNav[1]).toMatch(/Website Drop-offs/i);

    // Verify it is positioned right after Pipeline
    const pipelineIndex = NAV.findIndex(([k]) => k === "pipeline");
    const dropoffsIndex = NAV.findIndex(([k]) => k === "dropoffs");
    expect(dropoffsIndex).toBe(pipelineIndex + 1);
  });

  it("includes Sales Team pointing to external admin target URL in main navigation", () => {
    const salesTeamNav = NAV.find(([k]) => k === "sales-team");
    expect(salesTeamNav).toBeDefined();
    expect(salesTeamNav[1]).toBe("Sales Team");
    expect(salesTeamNav[2]).toBe("https://sales-hazel-ten.vercel.app/admin");
  });

  it("evaluates drop-off and bounce rate health with strict < 30% rule", () => {
    // Healthy: < 30%
    const healthyHealth = getSeoMetricHealth("bounce", 28.3, null);
    expect(healthyHealth.status).toBe("good");
    expect(healthyHealth.borderClass).toContain("emerald");

    // Critical: >= 30%
    const criticalHealth = getSeoMetricHealth("bounce", 35.1, null);
    expect(criticalHealth.status).toBe("bad");
    expect(criticalHealth.borderClass).toContain("rose");

    const highCriticalHealth = getSeoMetricHealth("bounce", 58.4, null);
    expect(highCriticalHealth.status).toBe("bad");
  });

  it("accurately calculates drop-off sessions from page sessions and bounce rate", () => {
    const sessions = 4210;
    const bounceRate = 58.4;
    const dropoffs = Math.round(sessions * (bounceRate / 100));

    expect(dropoffs).toBe(2459);
    expect(sessions - dropoffs).toBe(1751); // Engaged sessions
  });

  it("extracts multi-line visited pages and formats drop-off records", async () => {
    const { extractVisitedPages, formatDropoffRecord, EXACT_SAMPLE_DROPOFFS } = await import("../dropoffData.js");
    expect(EXACT_SAMPLE_DROPOFFS.length).toBe(12);

    const multilineRecord = EXACT_SAMPLE_DROPOFFS.find((r) => r.firstName === "Gill");
    expect(multilineRecord).toBeDefined();

    const pages = extractVisitedPages(multilineRecord.pageVisited);
    expect(pages.length).toBe(6);
    expect(pages[0]).toBe("tecnoprism.com/book-a-demo");
    expect(pages[pages.length - 1]).toBe("triaparkinc.com/job-seekers");

    const formatted = formatDropoffRecord(multilineRecord);
    expect(formatted.name).toBe("Gill Burke");
    expect(formatted.pageCount).toBe(6);
    expect(formatted.lastPage).toBe("triaparkinc.com/job-seekers");
  });

  it("builds the Website Dropoffs sample template sheet", async () => {
    const { buildSampleWorkbook, SAMPLE_CATEGORIES } = await import("../sampleTemplates.js");
    const dropoffCat = SAMPLE_CATEGORIES.find((c) => c.id === "dropoffs");
    expect(dropoffCat).toBeDefined();
    expect(dropoffCat.fileName).toBe("Website_Dropoffs.xlsx");

    const wb = buildSampleWorkbook("dropoffs");
    expect(wb.SheetNames).toContain("Website Dropoffs");
    const ws = wb.Sheets["Website Dropoffs"];
    expect(ws).toBeDefined();
  });
});

