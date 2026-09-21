import { useMemo, useState, useCallback } from "react";
import { resolveRange, previousWindow, withinRange, bucketOf, fromLocalDate, prettyDate, addDays, startOfWeek } from "../lib/dates.js";
import { STAGES, ADVANCED_STAGES } from "../lib/stages.js";
import { STOCK_METRICS } from "../lib/seoMatrix.js";
import { SITES, siteById } from "../lib/segments.js";

const GRAIN_WORD = { day: "day", week: "week", month: "month", quarter: "quarter", year: "year" };
const sum = (rows, key) => rows.reduce((n, r) => n + (r[key] || 0), 0);
const rate = (part, whole) => (whole ? (part / whole) * 100 : null);

/**
 * Every figure the dashboard shows is derived here, once, from three controls:
 * the period, the site, and the pipeline. Views read the result — they never
 * filter for themselves, so two panels cannot disagree about what is on screen.
 */
export function useDashboard({ leads, weeks, channels }) {
  const [rangeKey, setRangeKey] = useState("all");
  const [custom, setCustom] = useState({ from: "", to: "" });
  const [grain, setGrain] = useState("month");
  const [site, setSite] = useState("All");
  const [pipeline, setPipeline] = useState("All");
  const [includeUndated, setIncludeUndated] = useState(true);

  const selectRangeKey = useCallback((key) => {
    setRangeKey(key);
    if (key === "7d" || key === "mtd") {
      setGrain("day");
    } else if (key === "4w" || key === "3m") {
      setGrain("week");
    } else if (key === "ytd" || key === "12m" || key === "all") {
      setGrain("month");
    }
  }, []);

  // Memoised together: a fresh `|| []` on every render would invalidate every
  // memo below it, which is the whole reason they exist.
  const { email, social, landing, cost } = useMemo(() => ({
    email: channels?.email || [],
    social: channels?.social || [],
    landing: channels?.landing || [],
    cost: channels?.cost || [],
  }), [channels]);

  /* ---- what the data actually covers, per subject ---- */
  const coverage = useMemo(() => {
    const extent = (dates) => {
      let min = null;
      let max = null;
      for (const d of dates) {
        if (!d) continue;
        if (!min || d < min) min = d;
        if (!max || d > max) max = d;
      }
      return min ? { min, max } : null;
    };
    return {
      leads: extent(leads.map((l) => l.date)),
      web: extent(weeks.map((w) => w.date)),
      email: extent(email.map((r) => r.date)),
      social: extent(social.map((r) => r.date)),
      landing: extent(landing.map((r) => r.date)),
    };
  }, [leads, weeks, email, social, landing]);

  const bounds = useMemo(() => {
    const all = Object.values(coverage).filter(Boolean);
    if (!all.length) return { min: null, max: fromLocalDate(new Date()) };
    return {
      min: all.reduce((m, e) => (!m || e.min < m ? e.min : m), null),
      max: all.reduce((m, e) => (!m || e.max > m ? e.max : m), null),
    };
  }, [coverage]);

  const range = useMemo(() => {
    const r = resolveRange(rangeKey, bounds.max, custom);
    // A backwards custom range is a slip, not an instruction to show nothing.
    if (r.from && r.to && r.from > r.to) return { ...r, from: r.to, to: r.from, swapped: true };
    return r;
  }, [rangeKey, bounds.max, custom]);

  const rangeActive = Boolean(range.from || range.to);
  const previous = useMemo(() => previousWindow(range), [range]);

  /* ---- segment + period filters ---- */
  const matchesSegment = useMemo(
    () => (row, { siteKey = "site", pipelineKey = "pipeline" } = {}) => {
      if (site !== "All" && row[siteKey] !== site) return false;
      if (pipeline !== "All" && pipelineKey && row[pipelineKey] !== undefined && row[pipelineKey] !== pipeline) return false;
      return true;
    },
    [site, pipeline]
  );

  const inPeriod = useMemo(
    () => (row) => {
      if (!rangeActive) return true;
      if (!row.date) return includeUndated;
      return withinRange(row.date, range);
    },
    [rangeActive, range, includeUndated]
  );

  const periodLeads = useMemo(
    () => leads.filter((l) => matchesSegment(l) && inPeriod(l)),
    [leads, matchesSegment, inPeriod]
  );
  const periodWeeks = useMemo(
    () => weeks.filter((w) => matchesSegment(w, { pipelineKey: null }) && (!rangeActive || withinRange(w.date, range))),
    [weeks, matchesSegment, rangeActive, range]
  );
  const periodEmail = useMemo(() => email.filter((r) => matchesSegment(r, { pipelineKey: null }) && inPeriod(r)), [email, matchesSegment, inPeriod]);
  const periodSocial = useMemo(() => social.filter((r) => inPeriod(r)), [social, inPeriod]);
  const periodLanding = useMemo(() => landing.filter((r) => matchesSegment(r, { pipelineKey: null }) && inPeriod(r)), [landing, matchesSegment, inPeriod]);

  const previousLeads = useMemo(
    () => (previous ? leads.filter((l) => matchesSegment(l) && l.date && withinRange(l.date, previous)) : null),
    [leads, previous, matchesSegment]
  );
  const previousWeeks = useMemo(
    () => (previous ? weeks.filter((w) => matchesSegment(w, { pipelineKey: null }) && withinRange(w.date, previous)) : null),
    [weeks, previous, matchesSegment]
  );
  const previousEmail = useMemo(
    () => (previous ? email.filter((r) => r.date && withinRange(r.date, previous)) : null),
    [email, previous]
  );

  const undated = useMemo(() => leads.filter((l) => matchesSegment(l) && !l.date).length, [leads, matchesSegment]);
  const excludedByPeriod = rangeActive && !includeUndated ? undated : 0;

  /* ---- pipeline ---- */
  const stageCounts = useMemo(() => {
    const m = Object.fromEntries(STAGES.map((s) => [s, 0]));
    for (const l of periodLeads) m[l.stage] = (m[l.stage] || 0) + 1;
    return m;
  }, [periodLeads]);

  const advanced = ADVANCED_STAGES.reduce((s, k) => s + stageCounts[k], 0);
  const conversion = periodLeads.length ? (advanced / periodLeads.length) * 100 : 0;
  const previousConversion = useMemo(() => {
    if (!previousLeads?.length) return null;
    const adv = previousLeads.filter((l) => ADVANCED_STAGES.includes(l.stage)).length;
    return (adv / previousLeads.length) * 100;
  }, [previousLeads]);

  const pipelineValue = useMemo(() => sum(periodLeads, "value"), [periodLeads]);
  const wonValue = useMemo(() => sum(periodLeads.filter((l) => l.stage === "Closed Won"), "value"), [periodLeads]);
  const wonCount = stageCounts["Closed Won"];

  const pipelines = useMemo(() => {
    const m = new Map();
    for (const l of leads) {
      if (!l.pipeline) continue;
      m.set(l.pipeline, (m.get(l.pipeline) || 0) + 1);
    }
    return Array.from(m, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [leads]);

  const pipelineBreakdown = useMemo(() => {
    const m = new Map();
    for (const l of periodLeads) {
      const key = l.pipeline || "Unassigned";
      if (!m.has(key)) m.set(key, { name: key, leads: 0, won: 0, value: 0, advanced: 0 });
      const row = m.get(key);
      row.leads += 1;
      row.value += l.value || 0;
      if (l.stage === "Closed Won") row.won += 1;
      if (ADVANCED_STAGES.includes(l.stage)) row.advanced += 1;
    }
    return Array.from(m.values())
      .map((r) => ({ ...r, conversion: rate(r.advanced, r.leads) }))
      .sort((a, b) => b.leads - a.leads);
  }, [periodLeads]);

  const sources = useMemo(() => {
    const m = new Map();
    for (const l of periodLeads) {
      const key = l.source?.trim() || "Unattributed";
      m.set(key, (m.get(key) || 0) + 1);
    }
    return Array.from(m, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [periodLeads]);

  const sourcePie = useMemo(() => {
    if (sources.length <= 7) return sources;
    return [...sources.slice(0, 6), { name: "Other sources", value: sum(sources.slice(6).map((s) => ({ value: s.value })), "value") }];
  }, [sources]);

  const fileNames = useMemo(() => Array.from(new Set(leads.map((l) => l.file))), [leads]);

  const funnel = useMemo(() => {
    const total = periodLeads.length;
    return STAGES.map((stage) => ({
      stage,
      count: stageCounts[stage],
      share: rate(stageCounts[stage], total) || 0,
      value: sum(periodLeads.filter((l) => l.stage === stage), "value"),
    }));
  }, [periodLeads, stageCounts]);

  const funnelByPipeline = useMemo(
    () => STAGES.map((stage) => {
      const row = { stage };
      for (const p of pipelineBreakdown) row[p.name] = 0;
      for (const l of periodLeads) if (l.stage === stage) row[l.pipeline || "Unassigned"] = (row[l.pipeline || "Unassigned"] || 0) + 1;
      return row;
    }),
    [periodLeads, pipelineBreakdown]
  );

  const leadTrend = useMemo(() => {
    const m = new Map();
    if (rangeActive && range.from && range.to) {
      if (grain === "day") {
        const spanDays = Math.round((range.to - range.from) / 86400000);
        if (spanDays >= 0 && spanDays <= 90) {
          for (let i = 0; i <= spanDays; i++) {
            const d = addDays(range.from, i);
            const b = bucketOf(d, "day");
            if (!m.has(b.key)) m.set(b.key, { label: b.label, sort: b.sort, leads: 0, won: 0, value: 0 });
          }
        }
      } else if (grain === "week") {
        const spanDays = Math.round((range.to - range.from) / 86400000);
        if (spanDays >= 0 && spanDays <= 366) {
          let cur = startOfWeek(range.from);
          while (cur <= range.to) {
            const b = bucketOf(cur, "week");
            if (!m.has(b.key)) m.set(b.key, { label: b.label, sort: b.sort, leads: 0, won: 0, value: 0 });
            cur = addDays(cur, 7);
          }
        }
      }
    }
    for (const l of periodLeads) {
      if (!l.date) continue;
      const b = bucketOf(l.date, grain);
      if (!m.has(b.key)) m.set(b.key, { label: b.label, sort: b.sort, leads: 0, won: 0, value: 0 });
      const row = m.get(b.key);
      row.leads += 1;
      row.value += l.value || 0;
      if (l.stage === "Closed Won") row.won += 1;
    }
    return Array.from(m.values()).sort((a, b) => a.sort - b.sort);
  }, [periodLeads, grain, rangeActive, range]);

  /* ---- web, per site and combined ---- */
  const bucketWeeks = (rows) => {
    const m = new Map();
    for (const w of rows) {
      const b = bucketOf(w.date, grain);
      if (!m.has(b.key)) {
        m.set(b.key, {
          label: b.label,
          sort: b.sort,
          views: 0,
          users: 0,
          seoLeads: 0,
          downloads: 0,
          bounceSum: 0,
          bounceN: 0,
          backlinks: null,
          da: null,
          as: null,
          pa: null,
          keywords: null,
          aiSearch: null,
        });
      }
      const row = m.get(b.key);
      row.views += w.views || 0;
      row.users += w.users || 0;
      row.seoLeads += w.seoLeads || 0;
      row.downloads += w.downloads || 0;
      if (w.bounce != null) { row.bounceSum += w.bounce; row.bounceN += 1; }
      for (const k of STOCK_METRICS) if (w[k] != null) row[k] = w[k];
    }
    return Array.from(m.values()).sort((a, b) => a.sort - b.sort)
      .map((r) => ({ ...r, bounce: r.bounceN ? Math.round((r.bounceSum / r.bounceN) * 10) / 10 : null }));
  };

  const seoTrend = useMemo(() => bucketWeeks(periodWeeks), [periodWeeks, grain]); // eslint-disable-line react-hooks/exhaustive-deps

  const siteBreakdown = useMemo(() => {
    const present = Array.from(new Set(weeks.map((w) => w.site)));
    return present.map((id) => {
      const meta = siteById(id);
      const rows = periodWeeks.filter((w) => w.site === id);
      const prevRows = previousWeeks?.filter((w) => w.site === id) || null;
      const views = sum(rows, "views");
      const leadsFromWeb = sum(rows, "seoLeads");
      const latest = rows[rows.length - 1] || {};
      const bounceRows = rows.filter((w) => w.bounce != null);
      return {
        id,
        label: meta.label,
        color: meta.color,
        weeks: rows.length,
        views,
        users: sum(rows, "users"),
        downloads: sum(rows, "downloads"),
        webLeads: leadsFromWeb,
        efficiency: rate(leadsFromWeb, views),
        bounce: bounceRows.length ? bounceRows.reduce((n, w) => n + w.bounce, 0) / bounceRows.length : null,
        backlinks: latest.backlinks ?? null,
        da: latest.da ?? null,
        as: latest.as ?? null,
        pa: latest.pa ?? null,
        keywords: latest.keywords ?? null,
        aiSearch: latest.aiSearch ?? null,
        previousViews: prevRows?.length ? sum(prevRows, "views") : null,
        trend: bucketWeeks(rows),
        spark: rows.map((w) => w.views || 0),
        pipelineLeads: periodLeads.filter((l) => l.site === id).length,
      };
    })
    .filter((s) => s.id !== "unassigned" || s.views > 0)
    .sort((a, b) => b.views - a.views);
  }, [weeks, periodWeeks, previousWeeks, periodLeads, grain]); // eslint-disable-line react-hooks/exhaustive-deps

  const seo = useMemo(() => {
    const views = sum(periodWeeks, "views");
    const users = sum(periodWeeks, "users");
    const webLeads = sum(periodWeeks, "seoLeads");
    const downloads = sum(periodWeeks, "downloads");
    const bounceWeeks = periodWeeks.filter((w) => w.bounce != null);
    const avgBounce = bounceWeeks.length
      ? Math.round((bounceWeeks.reduce((acc, w) => acc + w.bounce, 0) / bounceWeeks.length) * 10) / 10
      : null;
    const peak = periodWeeks.reduce((best, w) => ((w.views || 0) > (best.views || 0) ? w : best), { views: 0 });
    const latest = periodWeeks[periodWeeks.length - 1] || {};
    return {
      views,
      users,
      webLeads,
      downloads,
      avgBounce,
      peak,
      latest,
      previousViews: previousWeeks?.length ? sum(previousWeeks, "views") : null,
      efficiency: rate(webLeads, views) || 0,
      hasTraffic: periodWeeks.some((w) => w.views != null || w.users != null),
      hasBacklinks: periodWeeks.some((w) => w.backlinks != null),
      hasAuthority: periodWeeks.some((w) => w.da != null || w.as != null || w.pa != null),
      hasBounce: periodWeeks.some((w) => w.bounce != null),
    };
  }, [periodWeeks, previousWeeks]);

  /* ---- channels ---- */
  const emailStats = useMemo(() => {
    if (!periodEmail.length) return null;
    const sent = sum(periodEmail, "sent");
    const delivered = sum(periodEmail, "delivered") || sent;
    const clicks = sum(periodEmail, "clicks");
    const opens = sum(periodEmail, "opens");
    const leadsGenerated = sum(periodEmail, "leads");
    const spend = sum(periodEmail, "cost");
    const bounces = sum(periodEmail, "bounces");
    const complaints = sum(periodEmail, "complaints");
    const unsubscribes = sum(periodEmail, "unsubscribes");
    return {
      campaigns: periodEmail.length,
      sent,
      delivered,
      opens,
      clicks,
      leads: leadsGenerated,
      spend,
      bounces,
      complaints,
      unsubscribes,
      openRate: rate(opens, delivered),
      ctr: rate(clicks, delivered),
      ctor: rate(clicks, opens),
      bounceRate: rate(bounces, sent),
      complaintRate: rate(complaints, delivered),
      unsubRate: rate(unsubscribes, delivered),
      clickToLead: rate(leadsGenerated, clicks),
      costPerLead: leadsGenerated ? spend / leadsGenerated : null,
      previousCtr: previousEmail?.length
        ? rate(sum(previousEmail, "clicks"), sum(previousEmail, "delivered") || sum(previousEmail, "sent"))
        : null,
      byCampaign: periodEmail.slice().sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0)),
      trend: periodEmail
        .filter((r) => r.date)
        .slice()
        .sort((a, b) => a.date - b.date)
        .map((r) => ({
          label: r.campaign,
          sort: r.date.getTime(),
          ctr: r.ctr,
          openRate: r.openRate,
          ctor: r.ctor,
          bounceRate: r.bounceRate,
          leads: r.leads,
          sent: r.sent,
        })),
    };
  }, [periodEmail, previousEmail]);

  const socialStats = useMemo(() => {
    if (!periodSocial.length) return null;
    const byPlatform = new Map();
    for (const r of periodSocial) {
      const key = r.platform || "Unknown";
      if (!byPlatform.has(key)) byPlatform.set(key, { platform: key, impressions: 0, engagements: 0, clicks: 0, leads: 0, posts: 0, spend: 0, followers: 0 });
      const row = byPlatform.get(key);
      row.impressions += r.impressions || 0;
      row.engagements += r.engagements || 0;
      row.clicks += r.clicks || 0;
      row.leads += r.leads || 0;
      row.posts += r.posts || 0;
      row.spend += r.spend || 0;
      row.followers = Math.max(row.followers, r.followers || 0);
    }
    const platforms = Array.from(byPlatform.values())
      .map((p) => ({ ...p, engagementRate: rate(p.engagements, p.impressions) }))
      .sort((a, b) => b.impressions - a.impressions);
    return {
      platforms,
      impressions: sum(platforms, "impressions"),
      engagements: sum(platforms, "engagements"),
      leads: sum(platforms, "leads"),
      followers: sum(platforms, "followers"),
      spend: sum(platforms, "spend"),
      engagementRate: rate(sum(platforms, "engagements"), sum(platforms, "impressions")),
    };
  }, [periodSocial]);

  const landingStats = useMemo(() => {
    if (!periodLanding.length) return null;
    const byPage = new Map();
    for (const r of periodLanding) {
      const key = r.page || "(unknown)";
      if (!byPage.has(key)) byPage.set(key, { page: key, site: r.site, sessions: 0, conversions: 0, bounceSum: 0, bounceN: 0 });
      const row = byPage.get(key);
      row.sessions += r.sessions || 0;
      row.conversions += r.conversions || 0;
      if (r.bounce != null) { row.bounceSum += r.bounce; row.bounceN += 1; }
    }
    const pages = Array.from(byPage.values())
      .map((p) => ({ ...p, conversionRate: rate(p.conversions, p.sessions), bounce: p.bounceN ? p.bounceSum / p.bounceN : null }))
      .sort((a, b) => b.sessions - a.sessions);
    const sessions = sum(pages, "sessions");
    const conversions = sum(pages, "conversions");
    return { pages, sessions, conversions, conversionRate: rate(conversions, sessions) };
  }, [periodLanding]);

  const costStats = useMemo(() => {
    if (!cost.length) return null;

    const active = cost.filter((r) => String(r.status || "Active").toLowerCase() === "active");
    const cancelled = cost.filter((r) => String(r.status || "").toLowerCase() === "cancelled");
    const adhoc = cost.filter((r) => {
      const s = String(r.status || "").toLowerCase();
      const c = String(r.cycle || "").toLowerCase();
      return s === "ad hoc" || s === "adhoc" || c === "irregular";
    });

    const totalInrMonthly = active
      .filter((r) => r.currency !== "USD")
      .reduce((sum, r) => sum + (r.monthlyCost ?? (r.cycle?.toLowerCase() === "monthly" ? r.costPerCycle : 0) ?? 0), 0);

    const totalUsdMonthly = active
      .filter((r) => r.currency === "USD")
      .reduce((sum, r) => sum + (r.monthlyCost ?? (r.cycle?.toLowerCase() === "monthly" ? r.costPerCycle : 0) ?? 0), 0);

    // Date range multiplier / divider rule from the selected range preset
    let factor = 1;
    let periodLabel = "This month";
    let periodRule = "Exact 1-month rate";

    if (rangeKey === "7d") {
      factor = 0.25; // divide by 4
      periodLabel = "7 days";
      periodRule = "Divided by 4 (1 week / 7 days)";
    } else if (rangeKey === "4w") {
      factor = 1;
      periodLabel = "4 weeks";
      periodRule = "Exact 4-week rate (~1 month)";
    } else if (rangeKey === "mtd") {
      factor = 1;
      periodLabel = "This month";
      periodRule = "Exact 1-month rate";
    } else if (rangeKey === "3m") {
      factor = 3;
      periodLabel = "3 months";
      periodRule = "Multiplied by 3 (Quarterly / 3 months)";
    } else if (rangeKey === "6m") {
      factor = 6;
      periodLabel = "6 months";
      periodRule = "Multiplied by 6 (Half-yearly / 6 months)";
    } else if (rangeKey === "ytd") {
      factor = 12;
      periodLabel = "This year";
      periodRule = "Multiplied by 12 (Annual commitment)";
    } else if (rangeKey === "12m") {
      factor = 12;
      periodLabel = "12 months";
      periodRule = "Multiplied by 12 (Annual commitment)";
    } else if (rangeKey === "all") {
      factor = 12;
      periodLabel = "Annual / All time";
      periodRule = "Multiplied by 12 (Annual commitment)";
    } else if (rangeKey === "custom") {
      if (range?.from && range?.to) {
        const days = Math.max(1, Math.round((range.to - range.from) / 86400000) + 1);
        factor = Math.round((days / 30.417) * 100) / 100;
        periodLabel = `${days} days`;
        periodRule = `Pro-rated for ${days} days (factor ${factor}x)`;
      }
    }

    const periodInrTotal = totalInrMonthly * factor;
    const periodUsdTotal = totalUsdMonthly * factor;

    const byCategory = new Map();
    for (const r of active) {
      const key = r.category || "Uncategorised";
      const val = (r.monthlyCost ?? r.costPerCycle ?? 0) * factor;
      byCategory.set(key, (byCategory.get(key) || 0) + val);
    }
    const categories = Array.from(byCategory, ([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const rowsWithPeriod = cost.map((r) => {
      const mCost = r.monthlyCost ?? (r.cycle?.toLowerCase() === "monthly" ? r.costPerCycle : null);
      const periodCost = mCost != null ? mCost * factor : null;
      return {
        ...r,
        monthlyCost: mCost,
        periodCost,
      };
    });

    return {
      tools: cost.length,
      activeCount: active.length,
      cancelledCount: cancelled.length,
      adhocCount: adhoc.length,
      totalInrMonthly,
      totalUsdMonthly,
      periodInrTotal,
      periodUsdTotal,
      factor,
      periodLabel,
      periodRule,
      rangeKey,
      categories,
      rows: rowsWithPeriod,
    };
  }, [cost, rangeKey, range]);

  /* ---- how many leads each channel claims, side by side ---- */
  const channelContribution = useMemo(() => {
    const rows = [
      { id: "web", label: "Website & SEO", value: seo.webLeads || 0 },
      { id: "email", label: "Email", value: emailStats?.leads || 0 },
      { id: "social", label: "Social", value: socialStats?.leads || 0 },
      { id: "landing", label: "Landing pages", value: landingStats?.conversions || 0 },
    ].filter((r) => r.value > 0);
    return rows.sort((a, b) => b.value - a.value);
  }, [seo.webLeads, emailStats, socialStats, landingStats]);

  const modulesConnected = {
    pipeline: leads.length > 0,
    web: weeks.length > 0,
    email: email.length > 0,
    social: social.length > 0,
    landing: landing.length > 0,
    cost: cost.length > 0,
  };

  /** Plain-language explanation of why a period might look empty. */
  const emptyReason = useMemo(() => {
    if (!rangeActive || periodLeads.length || periodWeeks.length) return null;
    if (!coverage.leads && !coverage.web) return "None of the loaded sheets have a date column, so no period can be applied.";
    const extent = coverage.leads || coverage.web;
    return `Nothing falls in ${range.label.toLowerCase()}. Your data runs from ${prettyDate(extent.min)} to ${prettyDate(extent.max)}.`;
  }, [rangeActive, periodLeads.length, periodWeeks.length, coverage, range.label]);

  return {
    rangeKey, setRangeKey: selectRangeKey, custom, setCustom, grain, setGrain, grainWord: GRAIN_WORD[grain] || grain,
    site, setSite, pipeline, setPipeline, includeUndated, setIncludeUndated,
    range, rangeActive, bounds, previous, coverage, emptyReason,
    periodLeads, periodWeeks, weeks, previousLeads, undated, excludedByPeriod,
    stageCounts, advanced, conversion, previousConversion, pipelineValue, wonValue, wonCount,
    sources, sourcePie, topSource: sources[0], fileNames, funnel, funnelByPipeline,
    pipelines, pipelineBreakdown, leadTrend, seoTrend, seo, siteBreakdown, sites: SITES,
    emailStats, socialStats, landingStats, costStats, channelContribution, modulesConnected,
  };
}
