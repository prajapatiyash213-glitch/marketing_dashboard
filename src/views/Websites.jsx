import { useState } from "react";
import { Panel, EmptyState, Kpi, KpiBand, Delta, ChartTooltip, AXIS } from "../components/primitives.jsx";
import { SiteCompareStrip } from "./Overview.jsx";
import { TrafficPanel, BacklinkPanel, BouncePanel } from "./charts.jsx";
import { downloadSampleSheet } from "../lib/sampleTemplates.js";
import { EXACT_SEO_RAW_MATRIX } from "../lib/exactSeoData.js";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { fmtInt } from "../lib/numbers.js";
import { MODULES } from "../lib/palette.js";
import { getSeoMetricHealth } from "../lib/seoHealth.js";
import { useData } from "../state/DataContext.jsx";

/** Comprehensive Website & SEO analytics across all 11 metrics. */
export function WebsitesView({ d, onLoadExactSeo }) {
  const [tableMode, setTableMode] = useState("unpivoted"); // "unpivoted" | "horizontal"
  const { syncLiveGoogleSheet, syncingGoogleSheet, googleSheetMeta } = useData();
  const [sheetSyncFeedback, setSheetSyncFeedback] = useState(null);

  const handleSyncSheet = async () => {
    try {
      const res = await syncLiveGoogleSheet();
      setSheetSyncFeedback({
        type: "success",
        message: `Synced ${res?.weeksCount || 14} weeks from Google Sheets! Latest: ${res?.latestWeek || "2-Oct"}`,
      });
      setTimeout(() => setSheetSyncFeedback(null), 4000);
    } catch (e) {
      setSheetSyncFeedback({
        type: "error",
        message: "Sync failed: " + (e?.message || "Network error"),
      });
      setTimeout(() => setSheetSyncFeedback(null), 4000);
    }
  };

  const sites = d.siteBreakdown || [];
  const latest = d.seo?.latest || {};
  const bounceDisplay = d.seo?.avgBounce != null ? `${d.seo.avgBounce.toFixed(1)}%` : (latest.bounce != null ? `${latest.bounce}%` : "—");

  if (!sites.length && !d.periodWeeks?.length && !d.weeks?.length) {
    return (
      <div className="space-y-6">
        <Panel
          title="Website & SEO Analytics"
          note="Weekly organic traffic, keywords, domain authority, and conversion funnel"
          right={
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => downloadSampleSheet("seo")}
                className="btn !py-2 !px-3.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs"
              >
                Download SEO_Matrix_tecnoprism_com.xlsx
              </button>
            </div>
          }
        >
          <EmptyState height={200}>
            No SEO weekly matrix is loaded. Drop your SEO matrix file (or click &ldquo;Load 45-Week SEO Matrix&rdquo; above) to analyze all 11 metrics across views, users, bounce rate, backlinks, keyword rankings, and leads.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  // One row per bucket with a column per site, so the lines share an axis.
  const byLabel = new Map();
  for (const s of sites) {
    for (const row of s.trend) {
      if (!byLabel.has(row.label)) byLabel.set(row.label, { label: row.label, sort: row.sort });
      byLabel.get(row.label)[s.label] = row.views;
    }
  }
  const compare = Array.from(byLabel.values()).sort((a, b) => a.sort - b.sort);

  const trend = d.seoTrend || [];
  // Use aggregated weekly trend so multi-site weeks are cleanly merged rather than cross-comparing different sites
  const latestWeek = trend[trend.length - 1] || latest || {};
  const prevWeek = trend.length >= 2 ? trend[trend.length - 2] : null;

  // Dynamic SEO metric evaluation: Good (Green), Bad (Red), Natural (Black)
  const viewsHealth = getSeoMetricHealth("views", latestWeek.views, prevWeek?.views);
  const usersHealth = getSeoMetricHealth("users", latestWeek.users, prevWeek?.users);
  const currentBounce = latestWeek.bounce != null ? latestWeek.bounce : (d.seo?.avgBounce ?? latest.bounce);
  const bounceHealth = getSeoMetricHealth("bounce", currentBounce, prevWeek?.bounce);
  const asHealth = getSeoMetricHealth("as", latest.as, prevWeek?.as);
  const daHealth = getSeoMetricHealth("da", latest.da, prevWeek?.da);
  const keywordsHealth = getSeoMetricHealth("keywords", latest.keywords, prevWeek?.keywords);
  const leadsHealth = getSeoMetricHealth("webLeads", d.seo.webLeads, prevWeek?.seoLeads);
  const downloadsHealth = getSeoMetricHealth("downloads", d.seo.downloads, prevWeek?.downloads);
  const paHealth = getSeoMetricHealth("pa", latest.pa, prevWeek?.pa);
  const backlinksHealth = getSeoMetricHealth("backlinks", latest.backlinks, prevWeek?.backlinks);
  const aiSearchHealth = getSeoMetricHealth("aiSearch", latest.aiSearch, prevWeek?.aiSearch);

  return (
    <>
      {/* Live Google Sheets SEO Sync Banner */}
      <div className="panel p-4 bg-gradient-to-r from-emerald-900 via-teal-800 to-cyan-900 text-white rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">ACOE Website Status</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/25 text-emerald-200 border border-emerald-300/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Google Sheet Connected
              </span>
            </div>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              Source: ACOE Website Status (Google Sheets) · Live tracking: <strong className="text-white font-extrabold">{googleSheetMeta?.weeksCount || 14} weekly periods</strong> · Latest week: <strong className="text-white font-extrabold">{googleSheetMeta?.latestWeek || "2-Oct"}</strong> · {googleSheetMeta?.lastSynced ? `Synced at ${new Date(googleSheetMeta.lastSynced).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}` : "Active cloud sync"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
          {sheetSyncFeedback && (
            <div className={`text-[11px] font-bold px-2.5 py-1.5 rounded-lg border flex items-center gap-1.5 animate-in fade-in duration-200 ${
              sheetSyncFeedback.type === "success"
                ? "bg-emerald-500/30 text-emerald-100 border-emerald-400/50"
                : "bg-rose-500/30 text-rose-100 border-rose-400/50"
            }`}>
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span>{sheetSyncFeedback.message}</span>
            </div>
          )}

          <button
            type="button"
            onClick={handleSyncSheet}
            disabled={syncingGoogleSheet}
            className={`flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold border backdrop-blur-sm transition-all cursor-pointer disabled:opacity-50 ${
              sheetSyncFeedback?.type === "success"
                ? "bg-emerald-500 text-white border-emerald-300 shadow-md"
                : sheetSyncFeedback?.type === "error"
                ? "bg-rose-500 text-white border-rose-300"
                : "bg-white/20 hover:bg-white/30 active:scale-95 text-white border-white/30"
            }`}
            title="Fetch real-time traffic and SEO data directly from Google Sheets"
          >
            <svg className={`w-3.5 h-3.5 ${syncingGoogleSheet ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
            </svg>
            <span>
              {syncingGoogleSheet
                ? "Syncing sheet..."
                : sheetSyncFeedback?.type === "success"
                ? "✓ Synced!"
                : "Sync Google Sheet"}
            </span>
          </button>

          <a
            href="https://docs.google.com/spreadsheets/d/1YVysKInWrAQBa_TrU6pnsmNQ2Ds86ZGb7ogf1-uYGho/edit?usp=sharing"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-white text-teal-900 px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-teal-50 transition-all cursor-pointer"
          >
            <span>Open Sheet</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </div>

      <SiteCompareStrip sites={sites} />

      {/* Dynamic SEO Health Status Bar */}
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="font-bold text-slate-900">SEO Metric Health Evaluation:</span>
          <span className="text-slate-500 font-normal">Week-over-week performance & industry benchmarks</span>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-bold">
          <span className="inline-flex items-center gap-1.5 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Green = Good / Growing
          </span>
          <span className="inline-flex items-center gap-1.5 text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
            <span className="h-2 w-2 rounded-full bg-slate-500" />
            Black = Natural Baseline / Stable
          </span>
          <span className="inline-flex items-center gap-1.5 text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Red = Dropping / Needs Attention
          </span>
        </div>
      </div>

      {/* 11-Metric Executive KPI Band */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className={`panel p-3.5 border-l-4 ${viewsHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">GA4 Views</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${viewsHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${viewsHealth.dotClass}`} />
              {viewsHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${viewsHealth.textClass}`}>{fmtInt(d.seo.views)}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">{d.periodWeeks.length} wks in period</span>
            {viewsHealth.diffText && (
              <span className={`text-[10px] font-bold shrink-0 ${viewsHealth.status === "good" ? "text-emerald-600" : viewsHealth.status === "bad" ? "text-rose-600" : "text-slate-500"}`}>
                {viewsHealth.diffText}
              </span>
            )}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${usersHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Total Users</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${usersHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${usersHealth.dotClass}`} />
              {usersHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${usersHealth.textClass}`}>{fmtInt(d.seo.users)}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Unique visitors</span>
            {usersHealth.diffText && (
              <span className={`text-[10px] font-bold shrink-0 ${usersHealth.status === "good" ? "text-emerald-600" : usersHealth.status === "bad" ? "text-rose-600" : "text-slate-500"}`}>
                {usersHealth.diffText}
              </span>
            )}
          </div>
        </div>

        <div
          onClick={() => setView?.("dropoffs")}
          title="Click to view detailed Website Drop-offs & Exits"
          className={`panel p-3.5 border-l-4 ${bounceHealth.borderClass} flex flex-col justify-between shadow-xs transition-all cursor-pointer hover:shadow-md group`}
        >
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate group-hover:text-rose-600 transition-colors">
              Bounce Rate ➔
            </span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${bounceHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${bounceHealth.dotClass}`} />
              {bounceHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${bounceHealth.textClass}`}>{bounceDisplay}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Period average</span>
            <span className="text-[10px] font-bold text-rose-600 group-hover:underline">Drop-offs</span>
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${asHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">SEMrush AS</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${asHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${asHealth.dotClass}`} />
              {asHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${asHealth.textClass}`}>{latest.as ?? "—"}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Authority Score</span>
            {asHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{asHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${daHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Domain Auth</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${daHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${daHealth.dotClass}`} />
              {daHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${daHealth.textClass}`}>{latest.da ?? "—"}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">DAPA Checker</span>
            {daHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{daHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${keywordsHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Top 20 KW</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${keywordsHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${keywordsHealth.dotClass}`} />
              {keywordsHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${keywordsHealth.textClass}`}>{latest.keywords ?? "—"}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Ranked queries</span>
            {keywordsHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{keywordsHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${leadsHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Inbound Leads</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${leadsHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${leadsHealth.dotClass}`} />
              {leadsHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${leadsHealth.textClass}`}>{fmtInt(d.seo.webLeads)}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">{d.seo.efficiency.toFixed(2)}% conv</span>
            {leadsHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{leadsHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${downloadsHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Downloads</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${downloadsHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${downloadsHealth.dotClass}`} />
              {downloadsHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${downloadsHealth.textClass}`}>{fmtInt(d.seo.downloads)}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Resource fills</span>
            {downloadsHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{downloadsHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${paHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Page Authority</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${paHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${paHealth.dotClass}`} />
              {paHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${paHealth.textClass}`}>{latest.pa ?? "—"}</div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate">Homepage PA</span>
            {paHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{paHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${backlinksHealth.borderClass} flex flex-col justify-between shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">Backlinks</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${backlinksHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${backlinksHealth.dotClass}`} />
              {backlinksHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${backlinksHealth.textClass}`} title={latest.raw_backlinks || ""}>
            {latest.backlinks != null ? fmtInt(latest.backlinks) : "—"}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate" title={latest.raw_backlinks || "Total indexed links"}>{latest.raw_backlinks || "Total indexed links"}</span>
            {backlinksHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{backlinksHealth.diffText}</span>}
          </div>
        </div>

        <div className={`panel p-3.5 border-l-4 ${aiSearchHealth.borderClass} flex flex-col justify-between col-span-2 shadow-xs transition-all`}>
          <div className="flex items-center justify-between gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wide truncate">AI Search Visibility</span>
            <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold shrink-0 ${aiSearchHealth.badgeClass}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${aiSearchHealth.dotClass}`} />
              {aiSearchHealth.shortBadge}
            </span>
          </div>
          <div className={`text-2xl font-black font-display mt-1.5 ${aiSearchHealth.textClass}`} title={latest.raw_aiSearch || ""}>
            {latest.aiSearch != null ? fmtInt(latest.aiSearch) : "—"}
          </div>
          <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between gap-1 text-[11px] text-slate-400">
            <span className="truncate" title={latest.raw_aiSearch || "AI query referrals"}>{latest.raw_aiSearch || "AI query referrals"}</span>
            {aiSearchHealth.diffText && <span className="text-[10px] font-semibold text-slate-500 shrink-0">{aiSearchHealth.diffText}</span>}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel title="Traffic, site against site" note="Same axis, so the gap between properties is the point">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={compare} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E4E9ED" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#D5DCE3" }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                {sites.map((s) => (
                  <Line key={s.id} type="monotone" dataKey={s.label} stroke={s.color} strokeWidth={2.2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Which site feeds which pipeline" note="Web leads recorded in the matrix, next to leads in the sales sheets">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline">
                {["Site", "Views", "Web leads", "Convert", "Pipeline leads"].map((h, i) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-muted" style={{ textAlign: i ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sites.map((s) => (
                <tr key={s.id} className="border-b border-hair">
                  <td className="px-2 py-2.5">
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2.5 w-2.5" style={{ background: s.color }} />
                      {s.label}
                    </span>
                  </td>
                  <td className="tnum px-2 py-2.5 text-right">{fmtInt(s.views)}</td>
                  <td className="tnum px-2 py-2.5 text-right">{fmtInt(s.webLeads)}</td>
                  <td className="tnum px-2 py-2.5 text-right">{s.efficiency != null ? `${s.efficiency.toFixed(2)}%` : "—"}</td>
                  <td className="tnum px-2 py-2.5 text-right">{fmtInt(s.pipelineLeads)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-4 text-xs leading-relaxed text-muted">
            The last two columns come from different files, so they will rarely match exactly. Web leads are what the
            SEO sheet recorded; pipeline leads are what reached a sales sheet tagged to that site.
          </p>
        </Panel>

        <TrafficPanel data={d.seoTrend} grainWord={d.grainWord} has={d.seo.hasTraffic} />

        {/* Authority score trend panel (AS, DA, PA, Keywords) */}
        <Panel title="Authority & Search Rankings" note="SEMrush Authority Score, DAPA Domain Authority, Homepage PA & Keywords">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={d.seoTrend} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
                <CartesianGrid stroke="#E4E9ED" vertical={false} />
                <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#D5DCE3" }} />
                <YAxis tick={AXIS} tickLine={false} axisLine={false} domain={["auto", "auto"]} />
                <Tooltip content={<ChartTooltip />} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
                <Line type="monotone" dataKey="da" name="Domain Authority (DA)" stroke="#10B981" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
                <Line type="monotone" dataKey="as" name="Authority Score (AS)" stroke="#7B61FF" strokeWidth={2.2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
                <Line type="monotone" dataKey="pa" name="Page Authority (PA)" stroke="#0E7C86" strokeWidth={1.8} strokeDasharray="3 3" dot={{ r: 2 }} />
                <Line type="monotone" dataKey="keywords" name="Top 20 KW" stroke="#FF9F43" strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <BouncePanel data={d.seoTrend} grainWord={d.grainWord} has={d.seo.hasBounce} />
        <BacklinkPanel data={d.seoTrend} has={d.seo.hasBacklinks || d.seo.hasAuthority} />
      </div>

      {/* Full Weekly Matrix Table with View Switcher */}
      <div className="mt-6 panel p-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-slate-800">Weekly SEO Matrix</h2>
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                {d.periodWeeks.length} weeks active
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Exact 11 key metrics tracking across {d.periodWeeks.length} weeks in selected date range
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex rounded-xl bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setTableMode("unpivoted")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableMode === "unpivoted"
                    ? "bg-white text-slate-800 shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Weekly Rows
              </button>
              <button
                type="button"
                onClick={() => setTableMode("horizontal")}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  tableMode === "horizontal"
                    ? "bg-white text-[#FA2E76] shadow-xs font-bold"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Original Matrix (11 × {d.periodWeeks.length})
              </button>
            </div>

            <button
              type="button"
              onClick={() => downloadSampleSheet("seo")}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              📥 Download Excel (.xlsx)
            </button>
          </div>
        </div>

        {tableMode === "unpivoted" ? (
          <div className="mt-4 overflow-x-auto section-scroll rounded-xl border border-slate-200/80">
            <table className="w-full text-left text-xs border-collapse min-w-[900px]">
              <thead className="bg-[#1E293B] text-slate-200 text-[11px] uppercase tracking-wider font-bold sticky top-0">
                <tr>
                  <th className="p-3">Week</th>
                  <th className="p-3 text-right">Views</th>
                  <th className="p-3 text-right">Users</th>
                  <th className="p-3 text-right">Bounce</th>
                  <th className="p-3 text-right">Leads</th>
                  <th className="p-3 text-right">Downloads</th>
                  <th className="p-3 text-right">AS</th>
                  <th className="p-3 text-right">DA</th>
                  <th className="p-3 text-right">PA</th>
                  <th className="p-3 text-right">Top 20 KW</th>
                  <th className="p-3 text-right">Backlinks</th>
                  <th className="p-3 text-right">AI Search</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {d.periodWeeks.slice().reverse().map((w) => (
                  <tr key={`${w.site}-${w.sort}`} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 font-semibold text-slate-700 whitespace-nowrap">{w.label}</td>
                    <td className="p-3 text-right font-medium text-slate-800">{fmtInt(w.views)}</td>
                    <td className="p-3 text-right font-medium text-slate-600">{fmtInt(w.users)}</td>
                    <td className="p-3 text-right text-slate-600">{w.bounce != null ? `${w.bounce}%` : "—"}</td>
                    <td className="p-3 text-right font-medium text-[#10B981]">{fmtInt(w.seoLeads)}</td>
                    <td className="p-3 text-right text-slate-600">{fmtInt(w.downloads)}</td>
                    <td className="p-3 text-right font-semibold text-[#7B61FF]">{w.as ?? "—"}</td>
                    <td className="p-3 text-right font-semibold text-[#0E7C86]">{w.da ?? "—"}</td>
                    <td className="p-3 text-right text-slate-600">{w.pa ?? "—"}</td>
                    <td className="p-3 text-right font-medium text-[#FF9F43]">{w.keywords ?? "—"}</td>
                    <td className="p-3 text-right text-slate-700 whitespace-nowrap" title={w.raw_backlinks || ""}>
                      {w.raw_backlinks || (w.backlinks != null ? fmtInt(w.backlinks) : "—")}
                    </td>
                    <td className="p-3 text-right font-semibold text-[#FA2E76] whitespace-nowrap" title={w.raw_aiSearch || ""}>
                      {w.raw_aiSearch || (w.aiSearch != null ? fmtInt(w.aiSearch) : "—")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Horizontal Original Spreadsheet Matrix dynamically rendered from loaded weeks */
          <div className="mt-4 overflow-x-auto section-scroll rounded-xl border border-slate-200/80 max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#BAE6FD] text-slate-800 text-[11px] font-bold border-b border-sky-300 sticky top-0 shadow-xs">
                  <th className="p-2.5 whitespace-nowrap border-r border-sky-300 sticky left-0 bg-[#A5F3FC] z-20">Category</th>
                  <th className="p-2.5 whitespace-nowrap border-r border-sky-300 sticky left-[110px] bg-[#BAE6FD] z-20">Key Metrics</th>
                  {d.periodWeeks.map((w, i) => (
                    <th key={`${w.site}-${w.sort}-${i}`} className="p-2.5 text-right whitespace-nowrap border-r border-sky-300">
                      {w.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {[
                  { key: "views", label: "Traffic (GA4) - Views", fmt: (w) => fmtInt(w.views) },
                  { key: "users", label: "Traffic (GA4) - Total Users", fmt: (w) => fmtInt(w.users) },
                  { key: "bounce", label: "Bounce Rate", fmt: (w) => (w.bounce != null ? `${w.bounce}%` : "—") },
                  { key: "as", label: "Authority Score (SEMrush)", fmt: (w) => (w.as ?? "—") },
                  { key: "da", label: "Domain Authority (DAPA Checker)", fmt: (w) => (w.da ?? "—") },
                  { key: "seoLeads", label: "Leads (forms+chatbot)", fmt: (w) => fmtInt(w.seoLeads) },
                  { key: "downloads", label: "Downloads", fmt: (w) => fmtInt(w.downloads) },
                  { key: "pa", label: "Page Authority (Homepage)", fmt: (w) => (w.pa ?? "—") },
                  { key: "keywords", label: "KW Ranking (top 20)", fmt: (w) => (w.keywords ?? "—") },
                  { key: "backlinks", label: "Backlinks", fmt: (w) => (w.raw_backlinks || (w.backlinks != null ? fmtInt(w.backlinks) : "—")) },
                  { key: "aiSearch", label: "AI Search", fmt: (w) => (w.raw_aiSearch || (w.aiSearch != null ? fmtInt(w.aiSearch) : "—")) },
                ].map((rowDef, rIdx) => (
                  <tr key={rowDef.key} className="hover:bg-sky-50/50 transition-colors">
                    <td className="p-2 text-slate-700 whitespace-nowrap border-r-2 border-r-slate-200 sticky left-0 bg-slate-50 font-bold z-10">
                      {rIdx === 0 ? "Website + SEO" : ""}
                    </td>
                    <td className="p-2 font-semibold text-slate-800 bg-slate-50/60 whitespace-nowrap border-r border-slate-100 sticky left-[110px] z-10">
                      {rowDef.label}
                    </td>
                    {d.periodWeeks.map((w, cIdx) => {
                      const val = rowDef.fmt(w);
                      return (
                        <td
                          key={cIdx}
                          className={`p-2 text-slate-700 whitespace-nowrap border-r border-slate-100 text-right ${
                            val && String(val).includes("%") ? "bg-amber-50/20 font-medium" : ""
                          }`}
                        >
                          {val}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
