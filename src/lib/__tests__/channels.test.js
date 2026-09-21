import { describe, it, expect } from "vitest";
import { parseChannelSheet, detectChannelSheet, CHANNEL_SCHEMAS, annualise } from "../channels.js";
import { dayKey } from "../dates.js";

const ctx = { fileName: "marketing.xlsx", sheetName: "Sheet1" };

describe("email campaigns", () => {
  const rows = [
    ["Campaign Name", "Send Date", "Emails Sent", "Delivered", "Unique Opens", "Unique Clicks", "Leads Generated"],
    ["CFO briefing invite", "2026-07-03", 8400, 8180, 2290, 342, 41],
    ["Imagine 26 save the date", "2026-07-17", "12,000", 11640, 4100, 780, 96],
  ];
  const out = parseChannelSheet(rows, CHANNEL_SCHEMAS.email, ctx);

  it("claims the sheet and reads every campaign", () => {
    expect(out.channel).toBe("email");
    expect(out.records).toHaveLength(2);
  });

  it("computes CTR against delivered, not sent", () => {
    expect(out.records[0].ctr).toBeCloseTo((342 / 8180) * 100, 4);
  });

  it("computes open rate and click-to-lead", () => {
    expect(out.records[0].openRate).toBeCloseTo((2290 / 8180) * 100, 4);
    expect(out.records[0].clickToLead).toBeCloseTo((41 / 342) * 100, 4);
  });

  it("reads numbers written with separators", () => {
    expect(out.records[1].sent).toBe(12000);
  });

  it("parses the send date", () => {
    expect(dayKey(out.records[0].date)).toBe("2026-07-03");
  });

  it("surfaces dayFirst in mapping", () => {
    expect(out.mapping.dayFirst).toBeDefined();
    expect(typeof out.mapping.dayFirst.certain).toBe("boolean");
  });

  it("refuses a sheet without the required columns", () => {
    expect(parseChannelSheet([["Campaign"], ["No numbers here"]], CHANNEL_SCHEMAS.email, ctx)).toBeNull();
  });
});

describe("social, landing pages and costs", () => {
  it("reads social impressions and derives engagement rate", () => {
    const rows = [
      ["Platform", "Month", "Impressions", "Engagements", "Link Clicks", "Followers"],
      ["LinkedIn", "2026-07-01", 26000, 940, 210, 8400],
    ];
    const out = parseChannelSheet(rows, CHANNEL_SCHEMAS.social, ctx);
    expect(out.records[0].engagementRate).toBeCloseTo((940 / 26000) * 100, 4);
  });

  it("reads GA4 landing pages with UTM columns", () => {
    const rows = [
      ["Landing Page", "Sessions", "Conversions", "Bounce Rate", "UTM Source", "UTM Medium"],
      ["/imagine-26", 1840, 96, "42.5%", "linkedin", "cpc"],
    ];
    const out = parseChannelSheet(rows, CHANNEL_SCHEMAS.landing, ctx);
    expect(out.records[0].conversionRate).toBeCloseTo((96 / 1840) * 100, 4);
    expect(out.records[0].bounce).toBeCloseTo(42.5);
    expect(out.records[0].medium).toBe("cpc");
  });

  it("annualises every billing cycle so totals are comparable", () => {
    expect(annualise(1000, "Monthly")).toBe(12000);
    expect(annualise(1000, "Annual")).toBe(1000);
    expect(annualise(1000, "Quarterly")).toBe(4000);
    expect(annualise(1000, "")).toBe(12000); // unstated cycles are treated as monthly
  });

  it("reads a tools sheet and annualises each row", () => {
    const rows = [
      ["Tool", "Category", "Monthly Cost", "Billing Cycle"],
      ["HubSpot", "Marketing automation", "₹42,000", "Monthly"],
      ["Zoom Events", "Events", "₹26,000", "Annual"],
    ];
    const out = parseChannelSheet(rows, CHANNEL_SCHEMAS.cost, ctx);
    expect(out.records[0].annual).toBe(504000);
    expect(out.records[1].annual).toBe(26000);
  });
});

describe("detectChannelSheet", () => {
  it("picks the right schema without being told", () => {
    const email = detectChannelSheet([["Campaign", "Sent"], ["Launch", 100]], ctx);
    const cost = detectChannelSheet([["Tool", "Cost"], ["Figma", 4500]], ctx);
    expect(email.channel).toBe("email");
    expect(cost.channel).toBe("cost");
  });

  it("leaves lead sheets alone", () => {
    expect(detectChannelSheet([["Name", "Company", "Stage"], ["Meera", "Arcelia", "Qualified"]], ctx)).toBeNull();
  });
});
