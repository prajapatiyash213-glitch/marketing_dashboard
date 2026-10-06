import { describe, it, expect } from "vitest";
import { buildSampleData } from "../sampleData.js";
import { resolveRange, withinRange, RANGE_PRESETS } from "../dates.js";

describe("Time filter calculations for Website + SEO exact matrix", () => {
  const { weeks } = buildSampleData();

  it("contains all 45 weeks of exact data for tecnoprism.com", () => {
    expect(weeks).toHaveLength(45);
    expect(weeks[0].label).toBe("30-Sep");
    expect(weeks[weeks.length - 1].label).toBe("31-Jul");
  });

  it("includes 6m preset in RANGE_PRESETS", () => {
    const p6m = RANGE_PRESETS.find((p) => p.key === "6m");
    expect(p6m).toBeDefined();
    expect(p6m.label).toBe("6 months");
  });

  const anchor = weeks[weeks.length - 1].date; // 31-Jul-2026

  it("calculates 'This month' (mtd) metrics exclusively for July 2026", () => {
    const range = resolveRange("mtd", anchor);
    const periodWeeks = weeks.filter((w) => withinRange(w.date, range));
    expect(periodWeeks).toHaveLength(5);
    expect(periodWeeks.map((w) => w.label)).toEqual(["3-Jul", "10-Jul", "17-Jul", "24-Jul", "31-Jul"]);

    const views = periodWeeks.reduce((acc, w) => acc + (w.views || 0), 0);
    const users = periodWeeks.reduce((acc, w) => acc + (w.users || 0), 0);
    const avgBounce = periodWeeks.reduce((acc, w) => acc + w.bounce, 0) / periodWeeks.length;
    const latest = periodWeeks[periodWeeks.length - 1];

    expect(views).toBe(2777); // 460 + 577 + 450 + 680 + 610
    expect(users).toBe(800);  // 182 + 145 + 137 + 163 + 173
    expect(avgBounce).toBeCloseTo(45.15, 1);
    expect(latest.as).toBe(9);
    expect(latest.da).toBe(16);
    expect(latest.pa).toBe(28);
    expect(latest.keywords).toBe(13);
    expect(latest.backlinks).toBe(611);
    expect(latest.aiSearch).toBe(28);
  });

  it("calculates '3 months' (3m) metrics over May-July 2026", () => {
    const range = resolveRange("3m", anchor);
    const periodWeeks = weeks.filter((w) => withinRange(w.date, range));
    expect(periodWeeks.length).toBeGreaterThanOrEqual(12);
    const views = periodWeeks.reduce((acc, w) => acc + (w.views || 0), 0);
    expect(views).toBeGreaterThan(2777);
  });

  it("calculates '6 months' (6m) metrics over Feb-July 2026", () => {
    const range = resolveRange("6m", anchor);
    const periodWeeks = weeks.filter((w) => withinRange(w.date, range));
    expect(periodWeeks.length).toBeGreaterThanOrEqual(25);
    const views = periodWeeks.reduce((acc, w) => acc + (w.views || 0), 0);
    expect(views).toBeGreaterThan(20000);
  });

  it("calculates 'All time' and '12 months' over all 45 weeks", () => {
    const range = resolveRange("all", anchor);
    const periodWeeks = weeks.filter((w) => withinRange(w.date, range));
    expect(periodWeeks).toHaveLength(45);

    const views = periodWeeks.reduce((acc, w) => acc + (w.views || 0), 0);
    const users = periodWeeks.reduce((acc, w) => acc + (w.users || 0), 0);
    const leads = periodWeeks.reduce((acc, w) => acc + (w.seoLeads || 0), 0);
    const downloads = periodWeeks.reduce((acc, w) => acc + (w.downloads || 0), 0);

    expect(views).toBe(64002);
    expect(users).toBe(24842);
    expect(leads).toBe(12);
    expect(downloads).toBe(1);
  });

  it("evaluates 7 days (7d) preset comparing against previous 7-day period (red/green instead of baseline)", async () => {
    const { previousWindow } = await import("../dates.js");
    const { getSeoMetricHealth } = await import("../seoHealth.js");

    const range = resolveRange("7d", anchor);
    const prevRange = previousWindow(range);

    const periodWeeks = weeks.filter((w) => withinRange(w.date, range));
    const previousWeeks = weeks.filter((w) => withinRange(w.date, prevRange));

    expect(periodWeeks).toHaveLength(1);
    expect(previousWeeks).toHaveLength(1);

    const curWeek = periodWeeks[0];
    const prevWeek = previousWeeks[0];

    // Views dropped from 680 (24-Jul) to 610 (31-Jul) -> RED (Dropping)
    const viewsHealth = getSeoMetricHealth("views", curWeek.views, prevWeek.views);
    expect(viewsHealth.status).toBe("bad");
    expect(viewsHealth.shortBadge).toBe("Dropping");
    expect(viewsHealth.borderClass).toContain("rose");
    expect(viewsHealth.diffText).toContain("-10.3% WoW");

    // Users grew from 163 (24-Jul) to 173 (31-Jul) -> GREEN (Growing)
    const usersHealth = getSeoMetricHealth("users", curWeek.users, prevWeek.users);
    expect(usersHealth.status).toBe("good");
    expect(usersHealth.shortBadge).toBe("Growing");
    expect(usersHealth.borderClass).toContain("emerald");
    expect(usersHealth.diffText).toContain("+6.1% WoW");
  });
});
