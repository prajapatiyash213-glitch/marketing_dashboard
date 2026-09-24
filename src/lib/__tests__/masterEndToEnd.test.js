import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";
import { parseWorkbook } from "../parseWorkbook.js";
import { mergeSeoWeeks, sanitizeSeoWeeks } from "../seoMatrix.js";

const MASTER_DIR = path.resolve(__dirname, "../../../public/master");

describe("Master Dataset End-to-End Processing", () => {
  const masterFiles = [
    "Imagine 26 - Leads Database (1).xlsx",
    "Key Metrics of Marketing (1).xlsx",
    "KPI _ Automation COE (1).xlsx",
    "Bulk Email Marketing statistics - 21 Sep 26.csv",
    "Tools_And_Costs_Cleaned.xlsx",
    "Leads Sheet.xlsx",
    "CFO_Event_Live_Lead_Sheet_CEO_Final_Mapped.xlsx",
    "Website Visitors Leads Sheet.xlsx",
    "tecnoprism_content_30D_1790061710570.xls",
    "tecnoprism_followers_1790061783804.xls",
  ];

  it("verifies all 10 master spreadsheet files exist in public/master", () => {
    for (const fileName of masterFiles) {
      const fullPath = path.join(MASTER_DIR, fileName);
      expect(fs.existsSync(fullPath), `Missing master file: ${fileName}`).toBe(true);
      const stats = fs.statSync(fullPath);
      expect(stats.size).toBeGreaterThan(50);
    }
  });

  it("verifies linkedin_live.json exists and contains ~25,000 followers", () => {
    const jsonPath = path.join(MASTER_DIR, "linkedin_live.json");
    expect(fs.existsSync(jsonPath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
    expect(content.companyName).toBe("Tecnoprism Pvt Ltd");
    expect(content.followers).toBeGreaterThanOrEqual(24700);
    expect(content.growthSinceExport).toBeGreaterThanOrEqual(4900);
    expect(Array.isArray(content.recentPosts)).toBe(true);
    expect(content.recentPosts.length).toBeGreaterThan(0);
  });

  it("parses all 10 master files cleanly through parseWorkbook", () => {
    let totalLeads = [];
    let allSeoWeeks = [];
    let channels = { email: [], social: [], landing: [], cost: [] };

    for (const fileName of masterFiles) {
      const fullPath = path.join(MASTER_DIR, fileName);
      const buffer = fs.readFileSync(fullPath);
      const arrayBuffer = buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength);

      const parsed = parseWorkbook(arrayBuffer, fileName);
      expect(parsed).toBeDefined();

      if (parsed.leads?.length) {
        totalLeads = totalLeads.concat(parsed.leads);
      }
      if (parsed.seoWeeks?.length) {
        allSeoWeeks = mergeSeoWeeks(allSeoWeeks, parsed.seoWeeks);
      }
      if (parsed.channels) {
        for (const [key, rows] of Object.entries(parsed.channels)) {
          if (rows?.length) {
            channels[key] = (channels[key] || []).concat(rows);
          }
        }
      }
    }

    const cleanWeeks = sanitizeSeoWeeks(allSeoWeeks);

    // 1. Leads Verification
    expect(totalLeads.length).toBeGreaterThan(50);
    const qualifiedLeads = totalLeads.filter((l) => l.stage === "Qualified");
    expect(qualifiedLeads.length).toBeGreaterThan(0);

    // 2. SEO & AI Search Verification
    expect(cleanWeeks.length).toBeGreaterThan(0);
    const weeksWithAi = cleanWeeks.filter((w) => w.aiSearch != null && w.aiSearch > 0);
    expect(weeksWithAi.length).toBeGreaterThan(0);
    // Latest week in September has 31 AI queries
    const latestWeek = cleanWeeks[cleanWeeks.length - 1];
    expect(latestWeek).toBeDefined();

    // 3. Social Media Verification
    expect(channels.social.length).toBeGreaterThan(0);
    const metricsRows = channels.social.filter((r) => r.subType === "metric");
    const postRows = channels.social.filter((r) => r.subType === "post");
    const demoRows = channels.social.filter((r) => r.subType === "demographic");
    const followerRows = channels.social.filter((r) => r.subType === "followerGrowth");

    expect(metricsRows.length).toBe(30);
    expect(postRows.length).toBe(4);
    expect(followerRows.length).toBe(30);
    expect(demoRows.length).toBeGreaterThan(20);

    // 4. Technology Costs Verification
    expect(channels.cost.length).toBeGreaterThanOrEqual(10);
    const activeTools = channels.cost.filter((r) => String(r.status || "Active").toLowerCase() === "active");
    expect(activeTools.length).toBeGreaterThanOrEqual(7);

    // 5. Email Marketing Verification
    expect(channels.email.length).toBeGreaterThanOrEqual(4);
    const totalSent = channels.email.reduce((sum, r) => sum + (r.sent || 0), 0);
    expect(totalSent).toBeGreaterThan(1000);
  });

  it("verifies social demographics and follower calculations match expectations", () => {
    const fullPathFollowers = path.join(MASTER_DIR, "tecnoprism_followers_1790061783804.xls");
    const buffer = fs.readFileSync(fullPathFollowers);
    const parsed = parseWorkbook(buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength), "tecnoprism_followers.xls");

    const demoRows = parsed.channels?.social?.filter((r) => r.subType === "demographic") || [];
    expect(demoRows.length).toBeGreaterThan(0);

    const functions = demoRows.filter((r) => r.category === "function").sort((a, b) => b.count - a.count);
    const seniorities = demoRows.filter((r) => r.category === "seniority").sort((a, b) => b.count - a.count);

    expect(functions.length).toBeGreaterThan(0);
    expect(functions[0].label).toBe("Engineering");
    expect(functions[0].count).toBe(7416);

    expect(seniorities.length).toBeGreaterThan(0);
    expect(seniorities[0].label).toBe("Senior");
    expect(seniorities[0].count).toBe(9659);
  });
});
