import { describe, it, expect } from "vitest";
import { resolveRange, withinRange, fromLocalDate } from "../dates.js";

describe("Social Media metrics response to time frame presets", () => {
  // Tecnoprism live posts benchmarks data
  const samplePosts = [
    { title: "A question every CIO, COO, CTO...", date: new Date("2026-09-28T09:00:00Z"), impressions: 480, likes: 18, comments: 2, reposts: 1, clicks: 12 },
    { title: "Forward Deployed Engineers", date: new Date("2026-09-15T09:00:00Z"), impressions: 716, likes: 29, comments: 0, reposts: 3, clicks: 13 },
    { title: "A process owner explains a challenge", date: new Date("2026-09-07T09:00:00Z"), impressions: 1914, likes: 47, comments: 0, reposts: 1, clicks: 44 },
    { title: "Rakshabandhan celebration", date: new Date("2026-08-28T09:00:00Z"), impressions: 1041, likes: 54, comments: 0, reposts: 1, clicks: 14 },
    { title: "A manufacturing client once thought", date: new Date("2026-08-24T09:00:00Z"), impressions: 1108, likes: 40, comments: 0, reposts: 1, clicks: 15 },
    { title: "Independence Day", date: new Date("2026-08-15T09:00:00Z"), impressions: 1420, likes: 65, comments: 4, reposts: 2, clicks: 22 },
    { title: "Automation COE at Imagine 2026", date: new Date("2026-07-07T09:00:00Z"), impressions: 2080, likes: 94, comments: 6, reposts: 4, clicks: 35 },
    { title: "Silver Partner at IMAGINE '26", date: new Date("2026-07-02T09:00:00Z"), impressions: 3820, likes: 193, comments: 14, reposts: 8, clicks: 75 },
    { title: "Introducing Automation COE", date: new Date("2026-07-01T09:00:00Z"), impressions: 4560, likes: 222, comments: 22, reposts: 15, clicks: 96 },
    { title: "Leadership team at IMAGINE '26", date: new Date("2026-06-30T09:00:00Z"), impressions: 3380, likes: 174, comments: 11, reposts: 7, clicks: 65 },
  ];

  const anchor = fromLocalDate(new Date("2026-09-29T12:00:00Z"));

  it("dynamically changes impressions and engagements for 7 days vs 4 weeks vs all time", () => {
    // 7 Days
    const range7d = resolveRange("7d", anchor);
    const posts7d = samplePosts.filter((p) => withinRange(p.date, range7d));
    const imp7d = posts7d.reduce((acc, p) => acc + p.impressions, 0);
    const eng7d = posts7d.reduce((acc, p) => acc + p.likes + p.comments + p.reposts, 0);

    expect(posts7d).toHaveLength(1);
    expect(imp7d).toBe(480);
    expect(eng7d).toBe(21);

    // 4 Weeks
    const range4w = resolveRange("4w", anchor);
    const posts4w = samplePosts.filter((p) => withinRange(p.date, range4w));
    const imp4w = posts4w.reduce((acc, p) => acc + p.impressions, 0);
    const eng4w = posts4w.reduce((acc, p) => acc + p.likes + p.comments + p.reposts, 0);

    expect(posts4w).toHaveLength(3);
    expect(imp4w).toBe(480 + 716 + 1914);
    expect(eng4w).toBe(21 + 32 + 48);
    expect(imp4w).toBeGreaterThan(imp7d);
    expect(eng4w).toBeGreaterThan(eng7d);

    // All Time
    const rangeAll = resolveRange("all", anchor);
    const postsAll = samplePosts.filter((p) => withinRange(p.date, rangeAll));
    const impAll = postsAll.reduce((acc, p) => acc + p.impressions, 0);
    const engAll = postsAll.reduce((acc, p) => acc + p.likes + p.comments + p.reposts, 0);

    expect(postsAll).toHaveLength(10);
    expect(impAll).toBe(20519);
    expect(engAll).toBe(1038);
    expect(impAll).toBeGreaterThan(imp4w);
    expect(engAll).toBeGreaterThan(eng4w);
  });
});
