import { useState } from "react";
import { Panel, EmptyState, Kpi, KpiBand, Delta } from "../components/primitives.jsx";
import { ModuleTile, FunnelFlow, CoverageBar, RankedBars, Sparkline } from "../components/visuals.jsx";
import {
  LeadTrendPanel,
  MainPerformanceChart,
  TrafficDonutChart,
  GradientStatCards,
  RecentActivitiesPanel,
  OrderStatusTable,
} from "./charts.jsx";
import { fmtInt, fmtMoneyCompact, pct } from "../lib/numbers.js";
import { MODULES, CATEGORICAL } from "../lib/palette.js";
import { pipelineColor } from "../lib/segments.js";

/**
 * Modern Lector SaaS overview matching the reference UI mockup:
 * - Row 1: Dual-wave Performance Chart (lg:8) + Traffic Donut Chart (lg:4)
 * - Row 2: 4 Gradient Metric Cards (Revenue, Page Views, Bounce Rate, Closed Won)
 * - Row 3: Recent Activities Stream (lg:4) + Order Status Table (lg:8)
 * - Expandable Deep-dive: Detailed Pipeline & Attribution Breakdown
 */
export function OverviewView({ d, allUndated, setView }) {
  const [showDeepDive, setShowDeepDive] = useState(false);
  const { modulesConnected: on } = d;

  return (
    <>
      {/* Row 1: Dual-wave Performance Area Chart + Traffic Donut Chart */}
      <section className="section-snap-item grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
        <div className="lg:col-span-8 flex flex-col">
          <MainPerformanceChart d={d} allUndated={allUndated} onViewPipeline={() => setView("pipeline")} />
        </div>
        <div className="lg:col-span-4 flex flex-col">
          <TrafficDonutChart sources={d.sources} total={d.periodLeads.length} />
        </div>
      </section>

      {/* Row 2: 4 Horizontal Gradient Stat Cards */}
      <section className="section-snap-item mb-5">
        <GradientStatCards d={d} />
      </section>

      {/* Website & SEO Executive Performance Strip (Visible directly in Overview) */}
      <WebsiteSeoExecutiveStrip d={d} setView={setView} />

      {/* Row 3: Recent Activities Timeline + Order Status Deals Table */}
      <section className="section-snap-item grid grid-cols-1 lg:grid-cols-12 gap-5 mb-6 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <RecentActivitiesPanel leads={d.periodLeads} onViewAll={() => setView("leads")} />
        </div>
        <div className="lg:col-span-8 flex flex-col">
          <OrderStatusTable leads={d.periodLeads} onViewAll={() => setView("leads")} />
        </div>
      </section>

      {/* Optional Deep Dive: Funnels, Breakdown, and Channels */}
      <div className="mt-8 pt-6 border-t border-slate-200/80">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-700">Detailed Pipeline & Channel Breakdown</h3>
            <p className="text-xs text-slate-400">Funnel movement, multi-channel attribution, and subject coverage</p>
          </div>
          <button
            type="button"
            onClick={() => setShowDeepDive(!showDeepDive)}
            className="text-xs font-semibold text-[#FA2E76] bg-pink-50 hover:bg-pink-100 px-3.5 py-1.5 rounded-xl transition-colors cursor-pointer"
          >
            {showDeepDive ? "Hide deep dive ▲" : "Show deep dive analytics ▼"}
          </button>
        </div>

        {showDeepDive && (
          <div className="space-y-5 animate-in fade-in duration-200">
            {/* Module cards strip */}
            <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <ModuleTile
                module="pipeline"
                connected={on.pipeline}
                headline={fmtInt(d.periodLeads.length)}
                caption={`${fmtInt(d.advanced)} past discovery · ${fmtMoneyCompact(d.pipelineValue)} in play`}
                spark={d.leadTrend.map((r) => r.leads)}
                change={d.previousLeads?.length ? ((d.periodLeads.length - d.previousLeads.length) / d.previousLeads.length) * 100 : null}
                hint="Drop a lead sheet with a name or company column."
                onClick={() => setView("pipeline")}
              />
              <ModuleTile
                module="web"
                connected={on.web}
                headline={fmtInt(d.seo.views)}
                caption={`${fmtInt(d.seo.webLeads)} web leads · ${d.seo.efficiency.toFixed(2)}% of visits convert`}
                spark={d.seoTrend.map((r) => r.views)}
                change={d.seo.previousViews ? ((d.seo.views - d.seo.previousViews) / d.seo.previousViews) * 100 : null}
                hint="Drop the weekly SEO matrix for each site."
                onClick={() => setView("websites")}
              />
              <ModuleTile
                module="email"
                connected={on.email}
                headline={d.emailStats ? `${d.emailStats.ctr?.toFixed(1)}%` : "—"}
                caption={d.emailStats ? `${fmtInt(d.emailStats.sent)} sent across ${d.emailStats.campaigns} campaigns · ${fmtInt(d.emailStats.leads)} leads` : ""}
                spark={d.emailStats?.trend.map((r) => r.ctr || 0)}
                change={d.emailStats?.previousCtr ? ((d.emailStats.ctr - d.emailStats.previousCtr) / d.emailStats.previousCtr) * 100 : null}
                hint="A sheet with campaign and emails-sent columns switches this on."
                onClick={() => setView("email")}
              />
              <ModuleTile
                module="social"
                connected={on.social}
                headline={d.socialStats ? fmtInt(d.socialStats.impressions) : "—"}
                caption={d.socialStats ? `${d.socialStats.engagementRate?.toFixed(1)}% engagement · ${fmtInt(d.socialStats.leads)} leads` : ""}
                spark={d.socialStats?.platforms.map((p) => p.impressions)}
                hint="A sheet with platform and impressions columns switches this on."
                onClick={() => setView("channels")}
              />
              <ModuleTile
                module="landing"
                connected={on.landing}
                headline={d.landingStats ? `${d.landingStats.conversionRate?.toFixed(1)}%` : "—"}
                caption={d.landingStats ? `${fmtInt(d.landingStats.sessions)} sessions · ${fmtInt(d.landingStats.conversions)} conversions` : ""}
                spark={d.landingStats?.pages.map((p) => p.sessions)}
                hint="Export GA4 landing pages with sessions and conversions."
                onClick={() => setView("channels")}
              />
              <ModuleTile
                module="cost"
                connected={on.cost}
                headline={
                  d.costStats
                    ? d.costStats.factor !== 1
                      ? `₹${Math.round(d.costStats.periodInrTotal || 0).toLocaleString("en-IN")}`
                      : `₹${Math.round(d.costStats.totalInrMonthly || 0).toLocaleString("en-IN")}/mo`
                    : "—"
                }
                caption={
                  d.costStats
                    ? `${d.costStats.activeCount || d.costStats.tools} active · $${Math.round((d.costStats.factor !== 1 ? d.costStats.periodUsdTotal : d.costStats.totalUsdMonthly) || 0)} USD`
                    : ""
                }
                spark={d.costStats?.categories.map((c) => c.value)}
                hint="Exact software subscriptions and SaaS costs."
                onClick={() => setView("costs")}
              />
            </section>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="How leads move" note="Each bar is that stage's share of every lead in the period">
                {d.periodLeads.length === 0
                  ? <EmptyState height={260}>No leads fall inside this period.</EmptyState>
                  : <FunnelFlow stages={d.funnel} total={d.periodLeads.length} />}
              </Panel>

              <Panel title="Where leads come from" note="Longest bar is the biggest source">
                {!d.sources.length
                  ? <EmptyState height={260}>No source column was found in these files.</EmptyState>
                  : <RankedBars rows={d.sources.slice(0, 8)} colorFor={(_, i) => CATEGORICAL[i % CATEGORICAL.length]} />}
              </Panel>

              <Panel title="Pipelines side by side" note="Every business line in one place">
                {!d.pipelineBreakdown.length ? <EmptyState height={220}>No pipelines detected yet.</EmptyState> : (
                  <table className="w-full border-collapse text-sm">
                    <thead>
                      <tr className="border-b border-hairline">
                        {["Pipeline", "Leads", "Past discovery", "Won", "Value"].map((h, i) => (
                          <th key={h} className="px-2 py-2 text-xs font-semibold text-muted" style={{ textAlign: i ? "right" : "left" }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {d.pipelineBreakdown.map((p, i) => (
                        <tr key={p.name} className="border-b border-hair">
                          <td className="px-2 py-2.5">
                            <span className="flex items-center gap-2">
                              <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ background: pipelineColor(p.name, i) }} />
                              <span className="truncate text-ink font-medium">{p.name}</span>
                            </span>
                          </td>
                          <td className="tnum px-2 py-2.5 text-right font-medium">{fmtInt(p.leads)}</td>
                          <td className="tnum px-2 py-2.5 text-right">{p.conversion != null ? `${p.conversion.toFixed(0)}%` : "—"}</td>
                          <td className="tnum px-2 py-2.5 text-right font-medium text-emerald-600">{fmtInt(p.won)}</td>
                          <td className="tnum px-2 py-2.5 text-right font-semibold">{p.value ? fmtMoneyCompact(p.value) : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </Panel>

              <Panel title="Which channel produced the leads" note="Counted from each channel's own sheet, so totals may overlap">
                {!d.channelContribution.length ? (
                  <EmptyState height={220}>
                    Load an email, social or landing page sheet to compare channels against the website.
                  </EmptyState>
                ) : (
                  <>
                    <RankedBars rows={d.channelContribution.map((r) => ({ name: r.label, value: r.value }))}
                      colorFor={(name) => {
                        const key = { "Website & SEO": "web", Email: "email", Social: "social", "Landing pages": "landing" }[name];
                        return MODULES[key]?.color || CATEGORICAL[0];
                      }} />
                    <p className="mt-4 text-xs leading-relaxed text-muted">
                      Read this as separate counts, not a split of one number. A visitor who arrives from an email and then
                      fills in a landing page form appears in both rows. Deduplicating needs GA4 UTM stitching, which is on
                      the roadmap in the README.
                    </p>
                  </>
                )}
              </Panel>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <LeadTrendPanel data={d.leadTrend} grainWord={d.grainWord} allUndated={allUndated} />
              <Panel title="What each subject covers" note="Bars show where you actually have data; the outline is your selected period">
                <CoverageBar coverage={d.coverage} bounds={d.bounds} range={d.range} />
                <p className="mt-4 text-xs leading-relaxed text-muted">
                  If a panel looks empty, check here first: it usually means the selected period sits outside that
                  subject&apos;s bars.
                </p>
              </Panel>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export function SiteCompareStrip({ sites }) {
  const displaySites = (sites || []).filter((s) => s.id !== "unassigned" && s.label?.toLowerCase() !== "unassigned");
  if (!displaySites.length) return null;
  return (
    <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {displaySites.map((s) => (
        <div key={s.id} className="panel p-4" style={{ borderLeft: `3px solid ${s.color}` }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium text-ink">{s.label}</div>
              <div className="mt-1 tnum font-display text-2xl" style={{ color: s.color }}>{fmtInt(s.views)}</div>
              <div className="text-xs text-muted">views over {s.weeks} weeks</div>
            </div>
            <Sparkline values={s.spark} color={s.color} width={110} height={34} />
          </div>
          <dl className="mt-3 grid grid-cols-4 gap-2 border-t border-hair pt-3 text-xs">
            {[
              ["Web leads", fmtInt(s.webLeads)],
              ["Convert", s.efficiency != null ? `${s.efficiency.toFixed(2)}%` : "—"],
              ["Bounce", s.bounce != null ? `${s.bounce.toFixed(0)}%` : "—"],
              ["Links", fmtInt(s.backlinks)],
            ].map(([label, value]) => (
              <div key={label}>
                <dt className="text-faint">{label}</dt>
                <dd className="tnum mt-0.5 text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ))}
    </div>
  );
}

export function WebsiteSeoExecutiveStrip({ d, setView }) {
  const latest = d.seo.latest || {};
  const bounceDisplay = d.seo.avgBounce != null ? `${d.seo.avgBounce.toFixed(1)}%` : (latest.bounce != null ? `${latest.bounce}%` : "—");

  return (
    <section className="section-snap-item panel p-5 mb-5 bg-gradient-to-r from-white via-cyan-50/20 to-blue-50/20 border border-slate-200/80 rounded-2xl shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center text-[#00C2FF] font-bold text-base shadow-xs">
            🌐
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Website & SEO Overview</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-100/70 text-cyan-800">
                {d.rangePreset?.label || "Selected Period"}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Live traffic, bounce rates, authority scores, rankings, backlinks & AI search
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setView("websites")}
          className="text-xs font-semibold text-[#00C2FF] hover:text-cyan-700 bg-white hover:bg-cyan-50 px-3 py-1.5 rounded-xl border border-cyan-200/80 transition-all shadow-xs cursor-pointer"
        >
          View Full Weekly Matrix & Deep Dive →
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">GA4 Views</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(d.seo.views)}</div>
          <div className="text-[10px] text-slate-400">Period total</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">Total Users</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(d.seo.users)}</div>
          <div className="text-[10px] text-slate-400">Unique visitors</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">Bounce Rate</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{bounceDisplay}</div>
          <div className="text-[10px] text-slate-400">Period average</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">SEMrush Score</div>
          <div className="text-lg font-bold text-[#7B61FF] mt-0.5">{latest.as ?? "—"}</div>
          <div className="text-[10px] text-slate-400">Authority Score</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">Domain Auth</div>
          <div className="text-lg font-bold text-[#0E7C86] mt-0.5">{latest.da ?? "—"}</div>
          <div className="text-[10px] text-slate-400">DAPA Checker</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">Top 20 KW</div>
          <div className="text-lg font-bold text-[#FF9F43] mt-0.5">{latest.keywords ?? "—"}</div>
          <div className="text-[10px] text-slate-400">Ranked queries</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">Backlinks</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5" title={latest.raw_backlinks || ""}>
            {latest.backlinks != null ? fmtInt(latest.backlinks) : "—"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{latest.raw_backlinks ? "DF/NF detail" : "Indexed"}</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
          <div className="text-[11px] font-medium text-slate-400 truncate">AI Search</div>
          <div className="text-lg font-bold text-[#FA2E76] mt-0.5" title={latest.raw_aiSearch || ""}>
            {latest.aiSearch != null ? fmtInt(latest.aiSearch) : "—"}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{latest.raw_aiSearch ? "AI Queries" : "Indexed"}</div>
        </div>
      </div>
    </section>
  );
}
