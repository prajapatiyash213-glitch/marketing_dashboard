import { useState, useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, ComposedChart, AreaChart, Area,
} from "recharts";
import { Panel, EmptyState, ChartTooltip, CHART_SERIES, AXIS, shortFile } from "../components/primitives.jsx";
import { Sparkline } from "../components/visuals.jsx";
import { fmtInt, pct, fmtMoneyCompact } from "../lib/numbers.js";
import { useWeeklyUpdates } from "../lib/weeklyUpdates.js";

const GRID = "#F1F5F9";
const LINE = "#E2E8F0";

export function FunnelPanel({ data, fileNames, empty }) {
  return (
    <Panel title="Funnel by source file" note="Where each file's leads sit in this period">
      {empty ? <EmptyState height={280}>No leads fall inside this period.</EmptyState> : (
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="stage" tick={AXIS} tickLine={false} axisLine={{ stroke: LINE }} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: "rgba(14,90,99,0.06)" }} content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
                formatter={(v) => <span style={{ color: "#3A4C5C" }}>{shortFile(v)}</span>} />
              {fileNames.map((f, i) => (
                <Bar key={f} dataKey={f} stackId="funnel" fill={CHART_SERIES[i % CHART_SERIES.length]} maxBarSize={54} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function SourcePanel({ pie, total }) {
  return (
    <Panel title="Lead distribution by channel" note="Share of leads in this period">
      {!pie.length ? <EmptyState height={240}>No source or lead type column was found in these files.</EmptyState> : (
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <div style={{ width: 210, height: 240 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" nameKey="name" innerRadius={52} outerRadius={90}
                  paddingAngle={1} stroke="#FFFFFF" strokeWidth={2}>
                  {pie.map((_, i) => <Cell key={i} fill={CHART_SERIES[i % CHART_SERIES.length]} />)}
                </Pie>
                <Tooltip content={<ChartTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <ul className="min-w-0 flex-1 space-y-2">
            {pie.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between gap-3 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <span className="inline-block h-2.5 w-2.5 shrink-0" style={{ background: CHART_SERIES[i % CHART_SERIES.length] }} />
                  <span className="truncate text-ink2">{d.name}</span>
                </span>
                <span className="tnum text-ink">
                  {fmtInt(d.value)}<span className="ml-2 text-xs text-faint">{pct(d.value, total, 0)}%</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Panel>
  );
}

export function LeadTrendPanel({ data, grainWord, allUndated }) {
  return (
    <Panel title={`Leads by ${grainWord}`} note="New leads and how many of them closed">
      {!data.length ? (
        <EmptyState height={260}>
          {allUndated
            ? "None of these sheets have a date column, so there is nothing to plot over time."
            : "No dated leads fall inside this period."}
        </EmptyState>
      ) : (
        <div style={{ height: 260 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <defs>
                <linearGradient id="leadFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={CHART_SERIES[0]} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={CHART_SERIES[0]} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: LINE }} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Area type="monotone" dataKey="leads" name="New leads" stroke={CHART_SERIES[0]} strokeWidth={2} fill="url(#leadFill)" dot={{ r: 3, fill: CHART_SERIES[0] }} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="won" name="Closed won" stroke="#2E7D5B" strokeWidth={1.8} dot={{ r: 3, fill: "#2E7D5B" }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function TrafficPanel({ data, grainWord, has }) {
  return (
    <Panel title={`Traffic by ${grainWord}`} note="Views, users and web leads from the SEO matrix">
      {!has ? (
        <EmptyState height={280}>Drop a sheet with weekly columns such as 3-Jul and 10-Jul to chart traffic here.</EmptyState>
      ) : (
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: LINE }} />
              <YAxis tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Line type="monotone" dataKey="views" name="Views" stroke={CHART_SERIES[0]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
              <Line type="monotone" dataKey="users" name="Total users" stroke={CHART_SERIES[2]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
              <Line type="monotone" dataKey="seoLeads" name="Web leads" stroke={CHART_SERIES[4]} strokeWidth={1.5} strokeDasharray="4 3" dot={{ r: 2.5 }} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function BacklinkPanel({ data, has }) {
  return (
    <Panel title="Backlinks and domain authority" note="Off-page growth across the period">
      {!has ? <EmptyState height={280}>No backlink or domain authority rows were found in the matrix.</EmptyState> : (
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 4, right: 4, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: LINE }} />
              <YAxis yAxisId="l" tick={AXIS} tickLine={false} axisLine={false} />
              <YAxis yAxisId="r" orientation="right" domain={["auto", "auto"]} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip />} />
              <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
              <Bar yAxisId="l" dataKey="backlinks" name="Backlinks" fill={CHART_SERIES[1]} maxBarSize={26} />
              <Line yAxisId="r" type="monotone" dataKey="da" name="Domain authority" stroke={CHART_SERIES[3]} strokeWidth={2} dot={{ r: 2.5 }} activeDot={{ r: 4.5 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function BouncePanel({ data, grainWord, has }) {
  return (
    <Panel title={`Bounce rate by ${grainWord}`} note="Averaged across the weeks inside each bucket">
      {!has ? <EmptyState height={240}>No bounce rate rows were found in the matrix.</EmptyState> : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 4, right: 8, left: -18, bottom: 0 }}>
              <CartesianGrid stroke={GRID} vertical={false} />
              <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: LINE }} />
              <YAxis domain={["auto", "auto"]} tick={AXIS} tickLine={false} axisLine={false} />
              <Tooltip content={<ChartTooltip suffix={{ bounce: "%" }} />} />
              <Area type="monotone" dataKey="bounce" name="Bounce rate" stroke={CHART_SERIES[3]} strokeWidth={2} fill={CHART_SERIES[3]} fillOpacity={0.1} dot={{ r: 3, fill: CHART_SERIES[3] }} activeDot={{ r: 5 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </Panel>
  );
}

export function MainPerformanceChart({ d, allUndated, onViewPipeline }) {
  const { leadTrend, grain, setGrain } = d;

  // leadTrend may have pre-populated zero buckets but no actual dated leads plotted.
  const hasPlottedData = leadTrend.some((b) => b.leads > 0 || b.won > 0);
  const undatedCount = d.periodLeads.filter((l) => !l.date).length;
  const showEmptyChart = !hasPlottedData;

  const PERIOD_TABS = [
    { key: "day", label: "DAILY" },
    { key: "week", label: "WEEKLY" },
    { key: "month", label: "MONTHLY" },
    { key: "year", label: "YEARLY" },
  ];

  return (
    <div className="panel p-6">
      {/* Top row: Title + period pill selector + chart legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">Leads Dashboard</h2>
          <p className="text-xs text-slate-400 mt-0.5">Overview of {d.range.label}</p>
        </div>

        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
          <div className="flex items-center gap-1 p-1 bg-slate-100/70 rounded-xl">
            {PERIOD_TABS.map((tab) => {
              const on = grain === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setGrain(tab.key)}
                  className={`text-[11px] font-bold tracking-wider px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    on
                      ? "bg-white text-[#FA2E76] shadow-sm"
                      : "text-slate-400 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {!showEmptyChart && (
            <div className="hidden sm:flex items-center gap-4 text-xs font-semibold">
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#7B61FF]" /> Online Leads
              </span>
              <span className="flex items-center gap-1.5 text-slate-600">
                <span className="h-2.5 w-2.5 rounded-full bg-[#10B981]" /> Qualified Leads
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main chart grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-5 items-center">
        {/* Left Stats Callout */}
        <div className="lg:col-span-3 flex flex-col justify-between py-1">
          <div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight font-display">
              {fmtInt(d.periodLeads.length)}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-1">Total Leads Captured</div>
          </div>

          <div className="mt-5">
            <div className="text-xl sm:text-2xl font-extrabold text-emerald-600">
              {fmtInt(d.advanced || 0)}
            </div>
            <div className="text-xs font-medium text-slate-400 mt-0.5">Qualified Leads</div>
          </div>

          <div className="mt-6">
            <button
              onClick={onViewPipeline}
              className="btn-primary !py-2.5 !px-5 !text-xs !font-bold !rounded-xl cursor-pointer shadow-glow-pink"
            >
              View Pipeline
            </button>
          </div>
        </div>

        {/* Center / Right Area Chart */}
        <div className="lg:col-span-9 h-[260px]">
          {showEmptyChart ? (
            <EmptyState height={260}>
              {allUndated || undatedCount === d.periodLeads.length
                ? "These leads don't have a date column — add a date field to your sheet to see the trend chart."
                : leadTrend.length === 0
                  ? "No dated leads fall inside this period."
                  : "All leads in this period are undated — add a date field to your sheet to see the trend chart."}
            </EmptyState>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={leadTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="wavePink" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#FA2E76" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="waveEmerald" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#059669" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#F1F5F9" vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                <YAxis tick={{ fontSize: 11, fill: "#94A3B8" }} tickLine={false} axisLine={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area
                  type="monotone"
                  dataKey="leads"
                  name="New leads"
                  stroke="#7B61FF"
                  strokeWidth={2.5}
                  fill="url(#wavePink)"
                  dot={{ r: 3, fill: "#7B61FF", strokeWidth: 1.5, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#FA2E76", strokeWidth: 2, stroke: "#fff" }}
                />
                <Area
                  type="monotone"
                  dataKey="qualified"
                  name="Qualified leads"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  fill="url(#waveEmerald)"
                  dot={{ r: 3, fill: "#10B981", strokeWidth: 1.5, stroke: "#fff" }}
                  activeDot={{ r: 6, fill: "#059669", strokeWidth: 2, stroke: "#fff" }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Bottom 4 Mini Metric Badges (matching reference icons) */}
      <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center text-[#FA2E76] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Deals Won</div>
            <div className="text-sm font-bold text-slate-800 truncate">{fmtInt(d.wonCount)} {d.wonValue ? `(${fmtMoneyCompact(d.wonValue)})` : ""}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#7B61FF] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Qualified Leads</div>
            <div className="text-sm font-bold text-slate-800 truncate">{fmtInt(d.advanced)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-sky-50 flex items-center justify-center text-[#00C2FF] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Web Visits</div>
            <div className="text-sm font-bold text-slate-800 truncate">{fmtInt(d.seo.views)}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-50 flex items-center justify-center text-[#FF9F43] shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
              <polyline points="17 6 23 6 23 12" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="text-xs text-slate-400 font-medium">Conversion Rate</div>
            <div className="text-sm font-bold text-slate-800 truncate">{d.conversion.toFixed(1)}%</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function TrafficDonutChart({ sources, total }) {
  const topSources = sources.slice(0, 4);
  const colors = ["#7B61FF", "#FA2E76", "#FF9F43", "#00C2FF"];

  return (
    <div className="panel p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Traffic</h2>
          <p className="text-xs text-slate-400 mt-0.5">Top Channels</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {fmtInt(total)} leads
        </span>
      </div>

      {!topSources.length ? (
        <EmptyState height={200}>No source channel data found.</EmptyState>
      ) : (
        <>
          <div className="my-auto py-2 flex items-center justify-center">
            <div style={{ width: 185, height: 185 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topSources}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    stroke="#FFFFFF"
                    strokeWidth={3}
                  >
                    {topSources.map((_, i) => (
                      <Cell key={i} fill={colors[i % colors.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<ChartTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Bottom percentages matching mockup */}
          <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
            {topSources.slice(0, 3).map((s, i) => (
              <div key={s.name} className="px-1 min-w-0">
                <div className="text-lg font-black" style={{ color: colors[i % colors.length] }}>
                  {pct(s.value, total, 0)}%
                </div>
                <div className="text-[11px] font-semibold text-slate-500 truncate mt-0.5" title={s.name}>
                  ● {s.name}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function GradientStatCards() {
  const [updates] = useWeeklyUpdates();

  const c1 = updates[0] || {};
  const c2 = updates[1] || {};
  const c3 = updates[2] || {};
  const c4 = updates[3] || {};

  return (
    <div className="panel p-5 sm:p-6">
      {/* Top Header: Weekly Updates */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-base font-bold text-slate-800">Weekly Updates</h2>
          <p className="text-xs text-slate-400 mt-0.5">Execution roadmap, traffic push & operational milestones</p>
        </div>
      </div>

      {/* 2x2 Grid of Execution Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 01: Sales Team Moving To Execution */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex items-start justify-between min-h-[135px] bg-gradient-to-r from-[#2952E3] to-[#5946DF]">
          <div className="flex items-start gap-4 sm:gap-5 flex-1 pr-3 z-10">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none select-none">
              01
            </span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {c1.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed mt-1.5 max-w-xl">
                {c1.description}
              </p>
            </div>
          </div>
          {c1.metric && (
            <div className="shrink-0 text-right pl-2 z-10">
              <span className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {c1.metric}
              </span>
              {c1.metricLabel && (
                <div className="text-[11px] sm:text-xs font-bold text-white/95 mt-1 tracking-tight">
                  {c1.metricLabel}
                </div>
              )}
            </div>
          )}
          {/* Decorative corner watermark */}
          <div className="absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Card 02: The Next 45 Days Are The Primary Email Push */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex items-start justify-between min-h-[135px] bg-gradient-to-r from-[#F96D27] to-[#ED3865]">
          <div className="flex items-start gap-4 sm:gap-5 flex-1 pr-3 z-10">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none select-none">
              02
            </span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {c2.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed mt-1.5 max-w-xl">
                {c2.description}
              </p>
            </div>
          </div>
          {c2.metric && (
            <div className="shrink-0 text-right pl-2 z-10">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {c2.metric}
              </div>
              {c2.metricLabel && (
                <div className="text-[11px] sm:text-xs font-bold text-white/95 mt-1 tracking-tight">
                  {c2.metricLabel}
                </div>
              )}
            </div>
          )}
          <div className="absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Card 03: Three-stage Email Nurture Chain */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex items-start justify-between min-h-[135px] bg-gradient-to-r from-[#0091FF] to-[#0062DF]">
          <div className="flex items-start gap-4 sm:gap-5 flex-1 pr-3 z-10">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none select-none">
              03
            </span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {c3.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed mt-1.5 max-w-xl">
                {c3.description}
              </p>
            </div>
          </div>
          {c3.metric && (
            <div className="shrink-0 text-right pl-2 z-10">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {c3.metric}
              </div>
              {c3.metricLabel && (
                <div className="text-[11px] sm:text-xs font-bold text-white/95 mt-1 tracking-tight">
                  {c3.metricLabel}
                </div>
              )}
            </div>
          )}
          <div className="absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>

        {/* Card 04: LinkedIn Page Renamed */}
        <div className="rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden flex items-start justify-between min-h-[135px] bg-gradient-to-r from-[#00B488] to-[#058296]">
          <div className="flex items-start gap-4 sm:gap-5 flex-1 pr-3 z-10">
            <span className="text-3xl sm:text-4xl font-black tracking-tight text-white leading-none select-none">
              04
            </span>
            <div className="flex-1">
              <h3 className="text-base sm:text-lg font-bold text-white tracking-tight leading-snug">
                {c4.title}
              </h3>
              <p className="text-xs sm:text-[13px] text-white/90 leading-relaxed mt-1.5 max-w-xl">
                {c4.description}
              </p>
            </div>
          </div>
          {c4.metric && (
            <div className="shrink-0 text-right pl-2 z-10">
              <div className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-none">
                {c4.metric}
              </div>
              {c4.metricLabel && (
                <div className="text-[11px] sm:text-xs font-bold text-white/95 mt-1 tracking-tight">
                  {c4.metricLabel}
                </div>
              )}
            </div>
          )}
          <div className="absolute -bottom-10 -right-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />
        </div>
      </div>
    </div>
  );
}

export function RecentActivitiesPanel({ leads, onViewAll }) {
  const activities = useMemo(() => {
    if (!leads || !leads.length) return [];
    // Sort so most recent leads come first
    const sorted = [...leads].sort((a, b) => (b.date?.getTime() || 0) - (a.date?.getTime() || 0));
    return sorted.slice(0, 5).map((l, idx) => {
      let type = "Lead Inbound";
      let bgColor = "bg-cyan-50 text-[#00C2FF]";
      let time = "Just now";

      if (l.stage === "Closed Won") {
        type = "Deal Closed Won";
        bgColor = "bg-emerald-50 text-[#10B981]";
      } else if (l.stage === "Proposal") {
        type = "Proposal Sent";
        bgColor = "bg-pink-50 text-[#FA2E76]";
      } else if (l.stage === "Qualified") {
        type = "Meeting Scheduled";
        bgColor = "bg-purple-50 text-[#7B61FF]";
      } else if (l.status?.toLowerCase().includes("follow") || l.stage === "Discovery") {
        type = "Follow-up Scheduled";
        bgColor = "bg-amber-50 text-[#FF9F43]";
      }

      if (idx === 0) time = "42 mins ago";
      else if (idx === 1) time = "2 hours ago";
      else if (idx === 2) time = "1 day ago";
      else if (idx === 3) time = "2 days ago";
      else time = "3 days ago";

      return {
        id: l.id || idx,
        type,
        bgColor,
        name: l.name,
        company: l.company,
        value: l.value ? fmtMoneyCompact(l.value) : null,
        time: l.dateText ? l.dateText : time,
      };
    });
  }, [leads]);

  return (
    <div className="panel p-6 flex flex-col justify-between h-full">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
        <div>
          <h2 className="text-base font-bold text-slate-800">Recent Activities</h2>
          <p className="text-xs text-slate-400 mt-0.5">Live activity stream</p>
        </div>
        <button
          type="button"
          onClick={onViewAll}
          className="text-xs font-semibold text-[#FA2E76] hover:underline cursor-pointer"
        >
          View all
        </button>
      </div>

      {!activities.length ? (
        <EmptyState height={240}>No recent activity in this period.</EmptyState>
      ) : (
        <div className="relative flex-1">
          {/* Vertical connecting line */}
          <div className="absolute left-[17px] top-3 bottom-5 w-0.5 bg-slate-100" />

          <div className="space-y-4 max-h-[350px] section-scroll pr-1.5 overscroll-contain">
            {activities.map((act) => (
              <div key={act.id} className="relative flex items-start gap-3.5 group">
                <div className={`h-9 w-9 rounded-full ${act.bgColor} flex items-center justify-center shrink-0 z-10 border-2 border-white shadow-sm ring-1 ring-slate-100`}>
                  {act.type.includes("Won") ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  ) : act.type.includes("Proposal") ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  ) : act.type.includes("Meeting") ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  ) : act.type.includes("Follow") ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="8.5" cy="7" r="4" />
                      <line x1="20" y1="8" x2="20" y2="14" />
                      <line x1="23" y1="11" x2="17" y2="11" />
                    </svg>
                  )}
                </div>

                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold text-slate-800">{act.type}</span>
                    <span className="text-[11px] font-medium text-slate-400 shrink-0">{act.time}</span>
                  </div>
                  <div className="text-xs text-slate-600 font-medium truncate mt-0.5">
                    {act.company} <span className="text-slate-400">({act.name})</span>
                  </div>
                  {act.value && (
                    <div className="text-[11px] font-semibold text-[#FA2E76] mt-0.5">
                      {act.value} deal value
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderStatusTable({ leads, onViewAll }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 5;

  const filtered = useMemo(() => {
    if (!leads) return [];
    if (!search.trim()) return leads;
    const q = search.toLowerCase();
    return leads.filter(
      (l) =>
        l.name?.toLowerCase().includes(q) ||
        l.company?.toLowerCase().includes(q) ||
        l.pipeline?.toLowerCase().includes(q) ||
        l.stage?.toLowerCase().includes(q) ||
        l.source?.toLowerCase().includes(q)
    );
  }, [leads, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentLeads = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const stageBadgeClasses = {
    "Closed Won": "bg-emerald-50 text-emerald-600 border border-emerald-200/60",
    "Proposal": "bg-pink-50 text-pink-600 border border-pink-200/60",
    "Qualified": "bg-sky-50 text-sky-600 border border-sky-200/60",
    "Discovery": "bg-purple-50 text-purple-600 border border-purple-200/60",
    "Closed Lost": "bg-slate-100 text-slate-500 border border-slate-200",
  };

  return (
    <div className="panel p-6 flex flex-col justify-between">
      {/* Table Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
        <div>
          <h2 className="text-base font-bold text-slate-800">Order Status</h2>
          <p className="text-xs text-slate-400 mt-0.5">Deals and pipeline activity overview</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Search deals..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#FA2E76] focus:ring-1 focus:ring-[#FA2E76] w-36 sm:w-48 transition-all"
            />
          </div>

          <button
            type="button"
            onClick={onViewAll}
            className="text-xs font-semibold text-[#FA2E76] hover:underline cursor-pointer"
          >
            All Leads →
          </button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto section-scroll mt-4 rounded-xl border border-slate-200/70 overscroll-contain">
        <table className="w-full text-left text-xs border-collapse">
          <thead className="bg-[#1E293B] text-slate-200 text-[11px] uppercase tracking-wider font-bold">
            <tr>
              <th className="p-3 text-center w-10">
                <input type="checkbox" className="rounded accent-[#FA2E76] cursor-pointer" />
              </th>
              <th className="p-3">Client Name</th>
              <th className="p-3">Deal ID</th>
              <th className="p-3">Pipeline</th>
              <th className="p-3">Source</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-center w-12">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 bg-white">
            {!currentLeads.length ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-slate-400">
                  No deals match your search criteria.
                </td>
              </tr>
            ) : (
              currentLeads.map((lead, idx) => {
                const dealId = `#DL-${8400 + ((page - 1) * pageSize + idx) * 17}`;
                const badgeClass = stageBadgeClasses[lead.stage] || "bg-slate-100 text-slate-600";
                return (
                  <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3 text-center">
                      <input type="checkbox" className="rounded accent-[#FA2E76] cursor-pointer" />
                    </td>
                    <td className="p-3 min-w-[140px]">
                      <div className="font-bold text-slate-800 truncate">{lead.name}</div>
                      <div className="text-[11px] text-slate-400 truncate">{lead.company}</div>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-slate-500">{dealId}</td>
                    <td className="p-3 text-slate-600 font-medium truncate max-w-[120px]">
                      {lead.pipeline || "General"}
                    </td>
                    <td className="p-3 text-slate-500 text-xs truncate max-w-[120px]">
                      {lead.source || "Direct / Inbound"}
                    </td>
                    <td className="p-3 text-center">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${badgeClass}`}>
                        {lead.stage || "Lead"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        type="button"
                        onClick={onViewAll}
                        title="View details"
                        className="text-slate-400 hover:text-[#FA2E76] transition-colors p-1 rounded-md"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="1" />
                          <circle cx="19" cy="12" r="1" />
                          <circle cx="5" cy="12" r="1" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 text-xs text-slate-500">
        <div>
          Showing {filtered.length === 0 ? 0 : (page - 1) * pageSize + 1} to{" "}
          {Math.min(page * pageSize, filtered.length)} of {filtered.length} entries
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ‹
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map((p) => {
            const active = page === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`h-7 w-7 rounded-lg flex items-center justify-center font-bold text-xs transition-all ${
                  active
                    ? "bg-[#FA2E76] text-white shadow-sm"
                    : "border border-slate-200 text-slate-600 hover:bg-slate-100"
                }`}
              >
                {p}
              </button>
            );
          })}
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            className="h-7 w-7 rounded-lg flex items-center justify-center border border-slate-200 text-slate-500 hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          >
            ›
          </button>
        </div>
      </div>
    </div>
  );
}
