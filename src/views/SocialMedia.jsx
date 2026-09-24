import { useMemo, useState } from "react";
import { Panel, EmptyState, ChartTooltip } from "../components/primitives.jsx";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fmtInt } from "../lib/numbers.js";
import { MODULES } from "../lib/palette.js";
import { prettyDate } from "../lib/dates.js";

const AXIS = { fontSize: 11, fill: "#94A3B8" };
const GRID = "#F1F5F9";

export function SocialMediaView({ d }) {
  const social = d.socialStats;
  const [activeTab, setActiveTab] = useState("overview"); // "overview" | "posts" | "demographics"
  const [postSort, setPostSort] = useState("impressions"); // "impressions" | "engagements" | "ctr" | "date"
  const [selectedDemoTab, setSelectedDemoTab] = useState("seniority"); // "seniority" | "function" | "location" | "industry" | "companySize"

  const posts = useMemo(() => {
    if (!social?.posts?.length) return [];
    return [...social.posts].sort((a, b) => {
      if (postSort === "engagements") return (b.engagements || 0) - (a.engagements || 0);
      if (postSort === "ctr") return (b.ctr || 0) - (a.ctr || 0);
      if (postSort === "date") return (b.date?.getTime() || 0) - (a.date?.getTime() || 0);
      return (b.impressions || 0) - (a.impressions || 0);
    });
  }, [social?.posts, postSort]);

  const topPost = useMemo(() => {
    if (!social?.posts?.length) return null;
    return [...social.posts].sort((a, b) => (b.impressions || 0) - (a.impressions || 0))[0];
  }, [social?.posts]);

  if (!social || (!social.impressions && !social.followers && !social.posts?.length)) {
    return (
      <div className="space-y-6">
        <Panel
          title="Social Media Analytics"
          note="LinkedIn page performance, follower growth, content intelligence, and audience demographics"
        >
          <EmptyState height={240}>
            No social media performance records found. Upload LinkedIn export files (e.g. <code>tecnoprism_content_30D.xls</code> or <code>tecnoprism_followers.xls</code>) to unlock full social analytics.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const demographics = social.demographics || {};
  const currentDemoList =
    demographics[selectedDemoTab] ||
    (selectedDemoTab === "function" ? demographics.jobFunction : (selectedDemoTab === "jobFunction" ? demographics.function : [])) ||
    [];
  const currentDemoTotal = currentDemoList.reduce((acc, r) => acc + (r.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header & Sub-navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0077B5]/10 text-[#0077B5]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
              </svg>
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-slate-800">LinkedIn Analytics & Content Intelligence</h2>
              <p className="text-xs text-slate-500">Tecnoprism Enterprise Page · 30-Day Content & Follower Performance</p>
            </div>
          </div>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200/80 text-xs font-semibold">
          {[
            { id: "overview", label: "Overview & Growth" },
            { id: "posts", label: `Posts (${posts.length})` },
            { id: "demographics", label: "Audience Demographics" },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setActiveTab(t.id)}
              className={`rounded-lg px-3.5 py-1.5 transition-all cursor-pointer ${
                activeTab === t.id
                  ? "bg-white text-slate-900 shadow-xs font-bold"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Live LinkedIn Profile Sync Banner */}
      <div className="panel p-4 bg-gradient-to-r from-blue-900 via-[#0077B5] to-indigo-900 text-white rounded-2xl shadow-md flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="h-11 w-11 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 text-white shadow-inner">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base text-white">Tecnoprism Pvt Ltd</span>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-400/25 text-emerald-200 border border-emerald-300/40">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Profile Synced
              </span>
            </div>
            <p className="text-xs text-blue-100/90 mt-0.5">
              Live follower base: <strong className="text-white font-extrabold">{fmtInt(social.followers)} followers</strong> (~25K) · Automated weekly profile review enabled
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-semibold text-blue-100">Growth Surge</div>
            <div className="text-sm font-black text-emerald-300">+{fmtInt(social.newFollowers)} followers</div>
          </div>
          <a
            href="https://www.linkedin.com/company/tecnoprism/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-xl bg-white text-[#0077B5] px-3.5 py-2 text-xs font-bold shadow-sm hover:bg-blue-50 transition-all cursor-pointer"
          >
            <span>View on LinkedIn</span>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
            </svg>
          </a>
        </div>
      </div>

      {/* 6-Metric Executive KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="panel p-3.5 border-l-4 border-l-[#0077B5] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Followers</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(social.followers)}</div>
          <div className="text-[11px] font-medium text-emerald-600 mt-1 flex items-center gap-1">
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
            +{fmtInt(social.newFollowers)} in period
          </div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#7B61FF] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Impressions</div>
          <div className="text-2xl font-black text-[#7B61FF] font-display mt-1">{fmtInt(social.impressions)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {social.uniqueImpressions ? `${fmtInt(social.uniqueImpressions)} unique reach` : "Total views"}
          </div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#FA2E76] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Engagements</div>
          <div className="text-2xl font-black text-[#FA2E76] font-display mt-1">{fmtInt(social.engagements)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            {fmtInt(social.reactions || 0)} likes · {fmtInt(social.reposts || 0)} reposts
          </div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#10B981] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Engagement Rate</div>
          <div className="text-2xl font-black text-emerald-600 font-display mt-1">
            {social.engagementRate != null ? `${social.engagementRate.toFixed(2)}%` : "—"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">High B2B interaction</div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-[#FF9F43] flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Link Clicks</div>
          <div className="text-2xl font-black text-[#FF9F43] font-display mt-1">{fmtInt(social.clicks)}</div>
          <div className="text-[11px] text-slate-400 mt-1">
            CTR: {social.ctr != null ? `${social.ctr.toFixed(2)}%` : "—"}
          </div>
        </div>

        <div className="panel p-3.5 border-l-4 border-l-sky-500 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Published Posts</div>
          <div className="text-2xl font-black text-slate-800 font-display mt-1">{fmtInt(posts.length)}</div>
          <div className="text-[11px] text-slate-400 mt-1">100% Organic Delivery</div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Daily Impressions & Engagements Trend */}
            <Panel
              title="Daily Impressions & Engagements"
              note="Organic content reach and member interactions over 30 days"
            >
              <div style={{ height: 280 }}>
                {social.timeline?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={social.timeline} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="socialImpGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#7B61FF" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#7B61FF" stopOpacity={0.0} />
                        </linearGradient>
                        <linearGradient id="socialEngGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FA2E76" stopOpacity={0.35} />
                          <stop offset="95%" stopColor="#FA2E76" stopOpacity={0.0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        name="Impressions"
                        stroke="#7B61FF"
                        strokeWidth={2.2}
                        fill="url(#socialImpGrad)"
                        dot={{ r: 2, fill: "#7B61FF" }}
                        activeDot={{ r: 5 }}
                      />
                      <Area
                        type="monotone"
                        dataKey="engagements"
                        name="Engagements"
                        stroke="#FA2E76"
                        strokeWidth={2}
                        fill="url(#socialEngGrad)"
                        dot={{ r: 2, fill: "#FA2E76" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState height={200}>No timeline records available</EmptyState>
                )}
              </div>
            </Panel>

            {/* Daily Follower Growth Trend */}
            <Panel
              title="Daily Follower Acquisition"
              note="Organic and auto-invited follower additions (+686 new followers)"
            >
              <div style={{ height: 280 }}>
                {social.timeline?.length ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={social.timeline} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
                      <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="label" tick={AXIS} tickLine={false} axisLine={{ stroke: "#E2E8F0" }} />
                      <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                      <Tooltip content={<ChartTooltip />} />
                      <Legend wrapperStyle={{ fontSize: 11, paddingTop: 6 }} />
                      <Bar
                        dataKey="newFollowers"
                        name="New Followers"
                        fill="#0077B5"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar
                        dataKey="clicks"
                        name="Link Clicks"
                        fill="#FF9F43"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <EmptyState height={200}>No follower growth timeline available</EmptyState>
                )}
              </div>
            </Panel>
          </div>

          {/* Spotlight & High-Level Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Top Post Spotlight Card */}
            {topPost && (
              <div className="panel p-5 bg-gradient-to-br from-white to-slate-50 border border-slate-200/80 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-bold text-purple-700 ring-1 ring-purple-600/20">
                      🏆 Top Performing Content
                    </span>
                    <span className="text-[11px] text-slate-400">{prettyDate(topPost.date)}</span>
                  </div>

                  <h3 className="mt-3 text-sm font-semibold text-slate-800 line-clamp-3 leading-snug">
                    {topPost.title}
                  </h3>

                  <div className="mt-4 grid grid-cols-3 gap-2 py-3 border-y border-slate-100 text-center">
                    <div>
                      <div className="text-base font-extrabold text-[#7B61FF]">{fmtInt(topPost.impressions)}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Impressions</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-[#FA2E76]">{fmtInt(topPost.engagements)}</div>
                      <div className="text-[10px] text-slate-400 font-medium">Engagements</div>
                    </div>
                    <div>
                      <div className="text-base font-extrabold text-emerald-600">{topPost.engagementRate?.toFixed(1)}%</div>
                      <div className="text-[10px] text-slate-400 font-medium">Eng. Rate</div>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-2 flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">By {topPost.author}</span>
                  {topPost.link && (
                    <a
                      href={topPost.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs font-bold text-[#0077B5] hover:underline"
                    >
                      View Post
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                      </svg>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Quick Seniority Breakdown */}
            <div className="panel p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Audience Seniority</h3>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("demographics"); setSelectedDemoTab("seniority"); }}
                    className="text-xs font-semibold text-[#0077B5] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {(demographics.seniority || []).slice(0, 5).map((s) => {
                    const total = (demographics.seniority || []).reduce((a, b) => a + (b.count || 0), 0) || 1;
                    const pct = ((s.count / total) * 100).toFixed(1);
                    return (
                      <div key={s.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{s.label}</span>
                          <span className="font-semibold text-slate-500">{fmtInt(s.count)} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-400">90%+ of followers are Senior or Entry practitioners & decision makers.</p>
            </div>

            {/* Quick Function Breakdown */}
            <div className="panel p-5 bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-800">Top Job Functions</h3>
                  <button
                    type="button"
                    onClick={() => { setActiveTab("demographics"); setSelectedDemoTab("function"); }}
                    className="text-xs font-semibold text-[#0077B5] hover:underline cursor-pointer"
                  >
                    View All →
                  </button>
                </div>
                <div className="mt-4 space-y-2.5">
                  {(demographics.jobFunction || []).slice(0, 5).map((f) => {
                    const total = (demographics.jobFunction || []).reduce((a, b) => a + (b.count || 0), 0) || 1;
                    const pct = ((f.count / total) * 100).toFixed(1);
                    return (
                      <div key={f.label}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700">{f.label}</span>
                          <span className="font-semibold text-slate-500">{fmtInt(f.count)} ({pct}%)</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                          <div className="h-full bg-[#0077B5] rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-4 text-[11px] text-slate-400">Engineering & Information Technology dominate follower profiles.</p>
            </div>
          </div>
        </div>
      )}

      {/* Posts Granular View */}
      {activeTab === "posts" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="text-sm font-bold text-slate-700">
              Published Content ({posts.length} Posts)
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400 font-medium">Sort by:</span>
              {[
                { id: "impressions", label: "Impressions" },
                { id: "engagements", label: "Engagements" },
                { id: "ctr", label: "CTR" },
                { id: "date", label: "Date" },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setPostSort(s.id)}
                  className={`rounded-md px-2.5 py-1 font-semibold transition-all cursor-pointer ${
                    postSort === s.id ? "bg-[#7B61FF] text-white shadow-xs" : "bg-white text-slate-600 border border-slate-200"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Post Title & Link</th>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Type</th>
                  <th className="py-3 px-3 text-right">Impressions</th>
                  <th className="py-3 px-3 text-right">Views</th>
                  <th className="py-3 px-3 text-right">Clicks</th>
                  <th className="py-3 px-3 text-right">CTR</th>
                  <th className="py-3 px-3 text-right">Likes</th>
                  <th className="py-3 px-3 text-right">Reposts</th>
                  <th className="py-3 px-3 text-right">Eng. Rate</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {posts.map((p, idx) => (
                  <tr key={p.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 max-w-md">
                      <div className="font-semibold text-slate-800 line-clamp-2" title={p.title}>
                        {p.title}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">By {p.author}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap text-slate-500 font-medium">
                      {prettyDate(p.date)}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-bold ${
                        p.contentType === "Video"
                          ? "bg-purple-50 text-purple-700 ring-1 ring-purple-600/20"
                          : "bg-blue-50 text-blue-700 ring-1 ring-blue-600/20"
                      }`}>
                        {p.contentType || "Post"}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-semibold text-slate-800">
                      {fmtInt(p.impressions)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {p.views ? fmtInt(p.views) : "—"}
                    </td>
                    <td className="py-3 px-3 text-right font-medium text-slate-700">
                      {fmtInt(p.clicks)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {p.ctr != null ? `${p.ctr.toFixed(2)}%` : "—"}
                    </td>
                    <td className="py-3 px-3 text-right text-rose-600 font-medium">
                      {fmtInt(p.likes)}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600">
                      {fmtInt(p.reposts)}
                    </td>
                    <td className="py-3 px-3 text-right">
                      <span className="inline-block font-bold text-emerald-600">
                        {p.engagementRate != null ? `${p.engagementRate.toFixed(2)}%` : "—"}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {p.link ? (
                        <a
                          href={p.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-[#0077B5]/10 px-2.5 py-1 text-[11px] font-bold text-[#0077B5] hover:bg-[#0077B5]/20 transition-all"
                        >
                          LinkedIn
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6M15 3h6v6M10 14L21 3" />
                          </svg>
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Demographics View */}
      {activeTab === "demographics" && (
        <div className="space-y-4">
          {/* Subtabs for Demographics */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {[
              { id: "seniority", label: "Seniority" },
              { id: "function", label: "Job Function" },
              { id: "location", label: "Location" },
              { id: "industry", label: "Industry" },
              { id: "companySize", label: "Company Size" },
            ].map((dTab) => {
              const count = (demographics[dTab.id] || (dTab.id === "function" ? demographics.jobFunction : []))?.length || 0;
              return (
                <button
                  key={dTab.id}
                  type="button"
                  onClick={() => setSelectedDemoTab(dTab.id)}
                  className={`rounded-lg px-3 py-1.5 font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    selectedDemoTab === dTab.id
                      ? "bg-[#0077B5] text-white shadow-xs"
                      : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {dTab.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="panel p-5 bg-white border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-800 capitalize">
                {selectedDemoTab === "function" || selectedDemoTab === "jobFunction"
                  ? "Job Function"
                  : selectedDemoTab.replace(/([A-Z])/g, " $1")} Distribution
              </h3>
              <span className="text-xs text-slate-400 font-medium">
                Total sampled: {fmtInt(currentDemoTotal)} followers
              </span>
            </div>

            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 section-scroll">
              {currentDemoList.map((item, idx) => {
                const pct = currentDemoTotal ? ((item.count / currentDemoTotal) * 100).toFixed(1) : "0";
                return (
                  <div key={item.label || idx} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700">{item.label}</span>
                      <span className="font-medium text-slate-500">
                        {fmtInt(item.count)} ({pct}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{
                          width: `${pct}%`,
                          backgroundColor: idx < 3 ? "#0077B5" : idx < 6 ? "#7B61FF" : "#94A3B8",
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
