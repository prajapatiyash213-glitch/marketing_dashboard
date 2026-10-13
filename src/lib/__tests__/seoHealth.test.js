import { describe, it, expect } from "vitest";
import { getSeoMetricHealth } from "../seoHealth.js";

describe("Dynamic SEO Metric Health Evaluator", () => {
  it("evaluates SEMrush Authority Score (AS)", () => {
    // 4 is bad (< 10)
    const as4 = getSeoMetricHealth("as", 4, 3);
    expect(as4.status).toBe("bad");
    expect(as4.textClass).toBe("text-rose-600");
    expect(as4.borderClass).toBe("border-l-rose-500");

    // 16 is natural baseline (10-25)
    const as16 = getSeoMetricHealth("as", 16, 16);
    expect(as16.status).toBe("neutral");
    expect(as16.textClass).toBe("text-slate-900");

    // 32 is strong authority (> 25)
    const as32 = getSeoMetricHealth("as", 32, 30);
    expect(as32.status).toBe("good");
    expect(as32.textClass).toBe("text-emerald-600");
  });

  it("evaluates Bounce Rate: below 30% -> GREEN, otherwise -> RED", () => {
    // 28.5% is below 30%: GOOD (GREEN)
    const b28 = getSeoMetricHealth("bounce", 28.5, 32.0);
    expect(b28.status).toBe("good");
    expect(b28.textClass).toBe("text-emerald-600");
    expect(b28.borderClass).toBe("border-l-emerald-500");
    expect(b28.badgeText).toContain("< 30%");

    // 50.8% is above 30%: BAD (RED)
    const b50 = getSeoMetricHealth("bounce", 50.8, 50.5);
    expect(b50.status).toBe("bad");
    expect(b50.textClass).toBe("text-rose-600");
    expect(b50.borderClass).toBe("border-l-rose-500");
    expect(b50.badgeText).toContain("≥ 30%");

    // Exactly 30.0% is not below 30%: BAD (RED)
    const b30 = getSeoMetricHealth("bounce", 30.0, 30.0);
    expect(b30.status).toBe("bad");
    expect(b30.textClass).toBe("text-rose-600");
    expect(b30.borderClass).toBe("border-l-rose-500");
  });

  it("evaluates Inbound Leads and Downloads conversion", () => {
    // 0 leads is bad
    const leads0 = getSeoMetricHealth("webLeads", 0, 0);
    expect(leads0.status).toBe("bad");
    expect(leads0.textClass).toBe("text-rose-600");

    // 5 leads is good
    const leads5 = getSeoMetricHealth("webLeads", 5, 2);
    expect(leads5.status).toBe("good");
    expect(leads5.textClass).toBe("text-emerald-600");

    // 0 downloads is bad
    const dl0 = getSeoMetricHealth("downloads", 0, 0);
    expect(dl0.status).toBe("bad");
    expect(dl0.textClass).toBe("text-rose-600");
  });

  it("evaluates Backlinks & AI Search Visibility", () => {
    // 865 backlinks is strong (> 300)
    const bl865 = getSeoMetricHealth("backlinks", 865, 820);
    expect(bl865.status).toBe("good");
    expect(bl865.textClass).toBe("text-emerald-600");

    // 31 AI Search queries is strong (> 10)
    const ai31 = getSeoMetricHealth("aiSearch", 31, 28);
    expect(ai31.status).toBe("good");
    expect(ai31.textClass).toBe("text-emerald-600");

    // 0 AI search is bad
    const ai0 = getSeoMetricHealth("aiSearch", 0, 0);
    expect(ai0.status).toBe("bad");
    expect(ai0.textClass).toBe("text-rose-600");
  });

  it("evaluates Domain Authority (DA) and Page Authority (PA)", () => {
    // DA 16 is natural baseline (15-30)
    const da16 = getSeoMetricHealth("da", 16, 16);
    expect(da16.status).toBe("neutral");
    expect(da16.textClass).toBe("text-slate-900");

    // PA 28 is natural baseline (20-35)
    const pa28 = getSeoMetricHealth("pa", 28, 28);
    expect(pa28.status).toBe("neutral");
    expect(pa28.textClass).toBe("text-slate-900");
  });

  it("evaluates GA4 Views: growing is green, drop is red, flat is neutral", () => {
    // Growing: 680 -> 750 (+10.3%) -> GREEN
    const viewsGrowing = getSeoMetricHealth("views", 750, 680);
    expect(viewsGrowing.status).toBe("good");
    expect(viewsGrowing.textClass).toBe("text-emerald-600");
    expect(viewsGrowing.borderClass).toBe("border-l-emerald-500");
    expect(viewsGrowing.shortBadge).toBe("Growing");
    expect(viewsGrowing.diffText).toContain("+10.3% WoW");

    // Dropping: 680 -> 610 (-10.3%) -> RED
    const viewsDropping = getSeoMetricHealth("views", 610, 680);
    expect(viewsDropping.status).toBe("bad");
    expect(viewsDropping.textClass).toBe("text-rose-600");
    expect(viewsDropping.borderClass).toBe("border-l-rose-500");
    expect(viewsDropping.shortBadge).toBe("Dropping");
    expect(viewsDropping.diffText).toContain("-10.3% WoW");

    // Flat: 680 -> 680 (0.0%) -> NEUTRAL / BLACK
    const viewsFlat = getSeoMetricHealth("views", 680, 680);
    expect(viewsFlat.status).toBe("neutral");
    expect(viewsFlat.textClass).toBe("text-slate-900");
    expect(viewsFlat.borderClass).toBe("border-l-slate-400");
    expect(viewsFlat.shortBadge).toBe("Stable");
    expect(viewsFlat.diffText).toContain("0.0% WoW");

    // Zero traffic -> RED
    const viewsZero = getSeoMetricHealth("views", 0, 100);
    expect(viewsZero.status).toBe("bad");
    expect(viewsZero.shortBadge).toBe("Zero");
  });

  it("evaluates Total Users: growing is green, drop is red, flat is neutral", () => {
    // Growing: 163 -> 173 (+6.1%) -> GREEN
    const usersGrowing = getSeoMetricHealth("users", 173, 163);
    expect(usersGrowing.status).toBe("good");
    expect(usersGrowing.textClass).toBe("text-emerald-600");
    expect(usersGrowing.borderClass).toBe("border-l-emerald-500");
    expect(usersGrowing.shortBadge).toBe("Growing");
    expect(usersGrowing.diffText).toContain("+6.1% WoW");

    // Dropping: 200 -> 150 (-25.0%) -> RED
    const usersDropping = getSeoMetricHealth("users", 150, 200);
    expect(usersDropping.status).toBe("bad");
    expect(usersDropping.textClass).toBe("text-rose-600");
    expect(usersDropping.borderClass).toBe("border-l-rose-500");
    expect(usersDropping.shortBadge).toBe("Dropping");
    expect(usersDropping.diffText).toContain("-25.0% WoW");

    // Flat: 150 -> 150 (0.0%) -> NEUTRAL / BLACK
    const usersFlat = getSeoMetricHealth("users", 150, 150);
    expect(usersFlat.status).toBe("neutral");
    expect(usersFlat.textClass).toBe("text-slate-900");
    expect(usersFlat.borderClass).toBe("border-l-slate-400");
    expect(usersFlat.shortBadge).toBe("Stable");
  });

  it("evaluates All Time selection: GA4 Views and Total Users must always be GREEN", () => {
    // All time views: e.g. 80,561
    const allViews = getSeoMetricHealth("views", 80561, null, { isAllTime: true });
    expect(allViews.status).toBe("good");
    expect(allViews.textClass).toBe("text-emerald-600");
    expect(allViews.borderClass).toBe("border-l-emerald-500");
    expect(allViews.shortBadge).toBe("Healthy");

    // All time users: e.g. 34,913
    const allUsers = getSeoMetricHealth("users", 34913, null, { isAllTime: true });
    expect(allUsers.status).toBe("good");
    expect(allUsers.textClass).toBe("text-emerald-600");
    expect(allUsers.borderClass).toBe("border-l-emerald-500");
    expect(allUsers.shortBadge).toBe("Healthy");
  });

  it("evaluates 7-day week-over-week Bounce Rate comparison (Green if improved, Red if worse, Grey if equal)", () => {
    // Improved bounce rate (e.g. 52.7% down to 50.0%): GREEN
    const bounceImproved = getSeoMetricHealth("bounce", 50.0, 52.7, { is7Days: true, compareWoW: true });
    expect(bounceImproved.status).toBe("good");
    expect(bounceImproved.textClass).toBe("text-emerald-600");
    expect(bounceImproved.borderClass).toBe("border-l-emerald-500");
    expect(bounceImproved.shortBadge).toBe("Improved");
    expect(bounceImproved.diffText).toBe("-2.7% WoW");

    // Deteriorated bounce rate (e.g. 52.71% up to 54.73%): RED
    const bounceWorse = getSeoMetricHealth("bounce", 54.73, 52.71, { is7Days: true, compareWoW: true });
    expect(bounceWorse.status).toBe("bad");
    expect(bounceWorse.textClass).toBe("text-rose-600");
    expect(bounceWorse.borderClass).toBe("border-l-rose-500");
    expect(bounceWorse.shortBadge).toBe("Higher");
    expect(bounceWorse.diffText).toBe("+2.0% WoW");

    // Equal bounce rate (52.0% to 52.0%): GREY / NEUTRAL
    const bounceEqual = getSeoMetricHealth("bounce", 52.0, 52.0, { is7Days: true, compareWoW: true });
    expect(bounceEqual.status).toBe("neutral");
    expect(bounceEqual.textClass).toBe("text-slate-600");
    expect(bounceEqual.borderClass).toBe("border-l-slate-400");
    expect(bounceEqual.shortBadge).toBe("Stable");
    expect(bounceEqual.diffText).toBe("0.0% WoW");
  });
});
