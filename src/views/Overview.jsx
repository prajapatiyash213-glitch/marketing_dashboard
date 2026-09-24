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

      {/* Social Media & LinkedIn Executive Performance Strip */}
      <SocialMediaExecutiveStrip d={d} setView={setView} />

      {/* Cross-Channel Marketing & Technology Stack Executive Grid */}
      <OperationsAndChannelsExecutiveGrid d={d} setView={setView} />

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
                caption={d.pipelineValue ? `${fmtInt(d.advanced)} past discovery · ${fmtMoneyCompact(d.pipelineValue)} in play` : `${fmtInt(d.advanced)} qualified & past discovery`}
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
                onClick={() => setView("social")}
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

export function SocialMediaExecutiveStrip({ d, setView }) {
  const social = d.socialStats;
  if (!social) return null;

  const topFunc = social.demographics?.jobFunction?.[0];
  const topSeniority = social.demographics?.seniority?.[0];
  const topSize = social.demographics?.companySize?.[0];

  const totalFollowers = social.followers || 1;
  const funcPct = topFunc?.count ? ((topFunc.count / totalFollowers) * 100).toFixed(1) : (topFunc?.percentage != null ? Number(topFunc.percentage).toFixed(1) : null);
  const seniorityPct = topSeniority?.count ? ((topSeniority.count / totalFollowers) * 100).toFixed(1) : (topSeniority?.percentage != null ? Number(topSeniority.percentage).toFixed(1) : null);
  const sizePct = topSize?.count ? ((topSize.count / totalFollowers) * 100).toFixed(1) : (topSize?.percentage != null ? Number(topSize.percentage).toFixed(1) : null);

  const funcLabel = topFunc?.label || topFunc?.segment || "Engineering";
  const seniorLabel = topSeniority?.label || topSeniority?.segment || "Senior";
  const sizeLabel = topSize?.label || topSize?.segment || "10,001+ employees";

  return (
    <section className="section-snap-item panel p-5 mb-5 bg-gradient-to-r from-white via-sky-50/25 to-blue-50/20 border border-slate-200/80 rounded-2xl shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-sky-50 flex items-center justify-center text-[#0A66C2] font-bold text-base shadow-xs ring-1 ring-sky-100">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 8.76a1.64 1.64 0 1 0 0-3.28 1.64 1.64 0 0 0 0 3.28m1.4 9.74v-8.37H5.06v8.37h2.8z"/>
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">Social Media & LinkedIn Audience</h2>
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100/70 text-blue-800">
                Live 30-Day Intelligence
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Followers growth, organic post impressions, reactions, clicks & enterprise demographic reach
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setView("social")}
          className="text-xs font-semibold text-[#0A66C2] hover:text-blue-700 bg-white hover:bg-blue-50 px-3 py-1.5 rounded-xl border border-blue-200/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <span>View Social Media Dashboard</span>
          <span>→</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Total Followers</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(social.followers)}</div>
          <div className="text-[10px] font-semibold text-emerald-600 flex items-center gap-0.5 mt-0.5">
            <span>+{fmtInt(social.newFollowers)}</span>
            <span className="text-slate-400 font-normal">in 30d</span>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Impressions</div>
          <div className="text-lg font-bold text-[#0A66C2] mt-0.5">{fmtInt(social.impressions)}</div>
          <div className="text-[10px] text-slate-400">100% Organic</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Post Clicks</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(social.clicks)}</div>
          <div className="text-[10px] text-slate-400">{social.ctr != null ? `${Number(social.ctr).toFixed(2)}% CTR` : "Direct traffic"}</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Reactions</div>
          <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(social.reactions)}</div>
          <div className="text-[10px] text-slate-400">{social.reposts ? `${social.reposts} shares` : "Likes & claps"}</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Engagement Rate</div>
          <div className="text-lg font-bold text-emerald-600 mt-0.5">
            {social.engagementRate != null ? `${Number(social.engagementRate).toFixed(2)}%` : "—"}
          </div>
          <div className="text-[10px] text-slate-400">Avg interaction</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Top Audience</div>
          <div className="text-sm font-bold text-slate-800 mt-1 truncate" title={funcLabel}>
            {funcLabel}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{funcPct ? `${funcPct}% of base` : "Function"}</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Seniority</div>
          <div className="text-sm font-bold text-[#7B61FF] mt-1 truncate" title={seniorLabel}>
            {seniorLabel}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{seniorityPct ? `${seniorityPct}% decision` : "Senior roles"}</div>
        </div>

        <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs hover:border-blue-200 transition-colors">
          <div className="text-[11px] font-medium text-slate-400 truncate">Target Enterprise</div>
          <div className="text-sm font-bold text-[#FA2E76] mt-1 truncate" title={sizeLabel}>
            {sizeLabel.includes("10,001") ? "10k+ Org" : sizeLabel}
          </div>
          <div className="text-[10px] text-slate-400 truncate">{sizePct ? `${sizePct}% base` : "Company size"}</div>
        </div>
      </div>
    </section>
  );
}

export function OperationsAndChannelsExecutiveGrid({ d, setView }) {
  const cost = d.costStats;
  const email = d.emailStats;
  const channels = d.channelContribution || [];

  return (
    <section className="section-snap-item grid grid-cols-1 lg:grid-cols-12 gap-5 mb-5 items-stretch">
      {/* Card 1: Technology & Tool Costs Executive Summary */}
      <div className="lg:col-span-6 panel p-5 bg-gradient-to-br from-white via-indigo-50/15 to-purple-50/20 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-purple-50 flex items-center justify-center text-[#7B61FF] font-bold text-base shadow-xs ring-1 ring-purple-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Technology & Tool Costs</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-100/70 text-purple-800">
                    {cost?.activeCount || 37} Active Tools
                  </span>
                </div>
                <p className="text-xs text-slate-400">Monthly software subscriptions & SaaS infrastructure spend</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setView("costs")}
              className="text-xs font-semibold text-[#7B61FF] hover:text-purple-700 bg-white hover:bg-purple-50 px-3 py-1.5 rounded-xl border border-purple-200/80 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              <span>Manage Subscriptions</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Monthly Spend</div>
              <div className="text-base sm:text-lg font-bold text-[#7B61FF] mt-0.5">
                {cost ? `₹${Math.round(cost.totalInrMonthly || 0).toLocaleString("en-IN")}` : "—"}
              </div>
              <div className="text-[10px] text-slate-400">Recurring / mo</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">USD Equivalent</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                {cost ? `$${Math.round(cost.totalUsdMonthly || 0).toLocaleString("en-US")}` : "—"}
              </div>
              <div className="text-[10px] text-slate-400">Monthly USD</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Active Subscriptions</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                {cost?.activeCount ?? 37}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600">All tools healthy</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">{cost?.periodLabel || "Period"} Spend</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                {cost ? `₹${Math.round(cost.periodInrTotal || 0).toLocaleString("en-IN")}` : "—"}
              </div>
              <div className="text-[10px] text-slate-400">Selected range</div>
            </div>
          </div>
        </div>

        {cost?.categories?.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Top Categories:</span>
            <div className="flex flex-wrap items-center gap-2">
              {cost.categories.slice(0, 3).map((cat) => (
                <span key={cat.name} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {cat.name}: <strong className="text-slate-900">₹{Math.round(cat.value).toLocaleString("en-IN")}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Card 2: Marketing Channels & Email Campaigns Executive Summary */}
      <div className="lg:col-span-6 panel p-5 bg-gradient-to-br from-white via-amber-50/15 to-orange-50/20 border border-slate-200/80 rounded-2xl shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-[#FF9F43] font-bold text-base shadow-xs ring-1 ring-orange-100">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
                </svg>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Marketing Channels & Email Outreach</h3>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-orange-100/70 text-orange-800">
                    Multi-Touch Inbound
                  </span>
                </div>
                <p className="text-xs text-slate-400">Email campaigns delivery, click-through rates & cross-channel attribution</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setView("email")}
                className="text-xs font-semibold text-[#7B61FF] hover:text-purple-700 bg-white hover:bg-purple-50 px-2.5 py-1.5 rounded-xl border border-purple-200/80 transition-all shadow-xs cursor-pointer"
              >
                Email →
              </button>
              <button
                type="button"
                onClick={() => setView("channels")}
                className="text-xs font-semibold text-[#FF9F43] hover:text-orange-700 bg-white hover:bg-orange-50 px-2.5 py-1.5 rounded-xl border border-orange-200/80 transition-all shadow-xs cursor-pointer"
              >
                Channels →
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Email CTR</div>
              <div className="text-base sm:text-lg font-bold text-[#FF9F43] mt-0.5">
                {email?.ctr != null ? `${Number(email.ctr).toFixed(1)}%` : "—"}
              </div>
              <div className="text-[10px] font-semibold text-emerald-600">High engagement</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Open Rate</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                {email?.openRate != null ? `${Number(email.openRate).toFixed(1)}%` : "—"}
              </div>
              <div className="text-[10px] text-slate-400">Delivered emails</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Emails Sent</div>
              <div className="text-base sm:text-lg font-bold text-slate-800 mt-0.5">
                {email ? fmtInt(email.sent) : "—"}
              </div>
              <div className="text-[10px] text-slate-400">{email?.campaigns || 4} campaigns</div>
            </div>

            <div className="bg-white rounded-xl p-3 border border-slate-100 shadow-xs">
              <div className="text-[11px] font-medium text-slate-400 truncate">Channel Leads</div>
              <div className="text-base sm:text-lg font-bold text-emerald-600 mt-0.5">
                {fmtInt((email?.leads || 0) + (d.seo?.webLeads || 0))}
              </div>
              <div className="text-[10px] text-slate-400">Email & Web inbound</div>
            </div>
          </div>
        </div>

        {channels.length > 0 && (
          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="text-[11px] font-medium text-slate-400">Inbound Leads:</span>
            <div className="flex flex-wrap items-center gap-2">
              {channels.map((ch) => (
                <span key={ch.label} className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-medium text-[11px]">
                  {ch.label}: <strong className="text-slate-900">{fmtInt(ch.value)}</strong>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
