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

/** Comprehensive Website & SEO analytics across all 11 metrics. */
export function WebsitesView({ d, onLoadExactSeo }) {
  const [tableMode, setTableMode] = useState("unpivoted"); // "unpivoted" | "horizontal"
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

  return (
    <>
      <SiteCompareStrip sites={sites} />

      {/* 11-Metric Executive KPI Band */}
      <div className="mb-5 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="panel p-3.5 border-l-4 border-l-[#00C2FF] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">GA4 Views</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(d.seo.views)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{d.periodWeeks.length} weeks in period</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#7B61FF] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Users</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(d.seo.users)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Unique visitors</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#FA2E76] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Bounce Rate</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{bounceDisplay}</div>
          <div className="text-[11px] text-slate-400 mt-1">Period average</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#FF9F43] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">SEMrush AS</div>
          <div className="text-2xl font-black text-[#FF9F43] font-display mt-1">{latest.as ?? "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Authority Score</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#10B981] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Domain Auth</div>
          <div className="text-2xl font-black text-[#10B981] font-display mt-1">{latest.da ?? "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">DAPA Checker</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#6C5CE7] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Top 20 Keywords</div>
          <div className="text-2xl font-black text-[#6C5CE7] font-display mt-1">{latest.keywords ?? "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Ranked queries</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#0E7C86] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Inbound Leads</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(d.seo.webLeads)}</div>
          <div className="text-[11px] text-slate-400 mt-1">{d.seo.efficiency.toFixed(2)}% visit conversion</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-sky-400 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Downloads</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(d.seo.downloads)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Resource fills</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-indigo-400 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Page Authority</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{latest.pa ?? "—"}</div>
          <div className="text-[11px] text-slate-400 mt-1">Homepage PA</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-amber-500 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Backlinks</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1" title={latest.raw_backlinks || ""}>
            {latest.backlinks != null ? fmtInt(latest.backlinks) : "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">{latest.raw_backlinks || "Total indexed links"}</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-pink-500 flex flex-col justify-between col-span-2">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Search Visibility</div>
          <div className="text-2xl font-black text-[#FA2E76] font-display mt-1" title={latest.raw_aiSearch || ""}>
            {latest.aiSearch != null ? fmtInt(latest.aiSearch) : "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1 truncate">{latest.raw_aiSearch || "AI query referrals"}</div>
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
            <h2 className="text-base font-bold text-slate-800">Weekly SEO Matrix</h2>
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
                    ? "bg-white text-[#FA2E76] shadow-xs"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                Original Matrix (11×45)
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
          /* Horizontal Original Spreadsheet Matrix matching uploaded file */
          <div className="mt-4 overflow-x-auto section-scroll rounded-xl border border-slate-200/80 max-h-[520px]">
            <table className="w-full text-left text-xs border-collapse min-w-[1400px]">
              <thead>
                <tr className="bg-[#BAE6FD] text-slate-800 text-[11px] font-bold border-b border-sky-300 sticky top-0 shadow-xs">
                  {EXACT_SEO_RAW_MATRIX[0].map((h, i) => (
                    <th
                      key={i}
                      className={`p-2.5 whitespace-nowrap border-r border-sky-300 ${
                        i === 0 ? "sticky left-0 bg-[#A5F3FC] z-20" : ""
                      }`}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {EXACT_SEO_RAW_MATRIX.slice(1).map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-sky-50/50 transition-colors">
                    {row.map((cell, cIdx) => (
                      <td
                        key={cIdx}
                        className={`p-2 text-slate-700 whitespace-nowrap border-r border-slate-100 ${
                          cIdx === 0
                            ? "sticky left-0 bg-slate-50 font-bold z-10 border-r-2 border-r-slate-200"
                            : cIdx === 1
                            ? "font-semibold text-slate-800 bg-slate-50/60"
                            : "text-right"
                        } ${
                          cell && String(cell).includes("%") ? "bg-amber-50/20" : ""
                        }`}
                      >
                        {cell || "—"}
                      </td>
                    ))}
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
