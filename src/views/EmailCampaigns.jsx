import { useMemo, useState } from "react";
import { Panel, EmptyState, Kpi, KpiBand } from "../components/primitives.jsx";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { fmtInt, fmtMoneyCompact } from "../lib/numbers.js";
import { MODULES } from "../lib/palette.js";
import { prettyDate } from "../lib/dates.js";
import { downloadSampleSheet } from "../lib/sampleTemplates.js";
import { downloadBlob, toCsv } from "../lib/exporters.js";

const AXIS = { fontSize: 11, fill: "#94A3B8" };
const GRID = "#F1F5F9";

function formatTime(d) {
  if (!d || !(d instanceof Date) || isNaN(d.getTime())) return "";
  const hours = d.getUTCHours();
  const mins = d.getUTCMinutes();
  const ampm = hours >= 12 ? "pm" : "am";
  const h12 = hours % 12 || 12;
  const mm = mins < 10 ? `0${mins}` : mins;
  return `${h12}:${mm}${ampm}`;
}

function EmailTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const fullName = payload[0]?.payload?.fullName || label;
  const list = payload[0]?.payload?.list;
  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 p-3 text-xs shadow-xl backdrop-blur-sm max-w-xs">
      <div className="font-bold text-slate-800 border-b border-slate-100 pb-1 mb-1.5">
        <div>{fullName}</div>
        {list && <div className="text-[10px] text-slate-400 font-normal mt-0.5">{list}</div>}
      </div>
      {payload.map((p) => (
        <div key={p.dataKey || p.name} className="flex items-center justify-between gap-4 py-0.5">
          <span className="flex items-center gap-1.5 text-slate-500">
            <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
            {p.name}:
          </span>
          <span className="font-bold text-slate-800">
            {typeof p.value === "number" && (p.name.includes("Rate") || p.name.includes("CTR") || p.name.includes("%"))
              ? `${p.value.toFixed(2)}%`
              : fmtInt(p.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function EmailCampaignsView({ d }) {
  const { emailStats: email } = d;
  const [search, setSearch] = useState("");
  const [selectedAudience, setSelectedAudience] = useState("All");
  const [sortBy, setSortBy] = useState("date"); // 'date' | 'campaign' | 'sent' | 'openRate' | 'clickRate' | 'ctor' | 'bounceRate'
  const [sortAsc, setSortAsc] = useState(false);
  const [activeModalCampaign, setActiveModalCampaign] = useState(null);

  const rawRows = useMemo(() => email?.byCampaign || [], [email]);

  const audiences = useMemo(() => {
    if (!rawRows.length) return ["All"];
    const set = new Set(rawRows.map((r) => r.list).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rawRows]);

  const filteredRows = useMemo(() => {
    if (!rawRows.length) return [];
    let list = rawRows;
    if (selectedAudience !== "All") {
      list = list.filter((r) => r.list === selectedAudience);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.campaign?.toLowerCase().includes(q) ||
          r.list?.toLowerCase().includes(q) ||
          r.utm?.toLowerCase().includes(q)
      );
    }
    return list.slice().sort((a, b) => {
      let valA = a[sortBy];
      let valB = b[sortBy];
      if (sortBy === "date") {
        valA = a.date ? a.date.getTime() : 0;
        valB = b.date ? b.date.getTime() : 0;
      }
      valA = valA ?? 0;
      valB = valB ?? 0;
      return sortAsc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [rawRows, selectedAudience, search, sortBy, sortAsc]);

  const chartData = useMemo(() => {
    if (!rawRows.length) return [];
    return rawRows.slice(0, 8).map((r) => ({
      name: r.campaign?.length > 20 ? `${r.campaign.slice(0, 18)}…` : r.campaign,
      fullName: r.campaign,
      sent: r.sent || 0,
      delivered: r.delivered || 0,
      opens: r.opens || 0,
      clicks: r.clicks || 0,
      bounces: r.bounces || 0,
      openRate: r.openRate != null ? Number(r.openRate.toFixed(2)) : 0,
      clickRate: (r.clickRate != null ? r.clickRate : r.ctr) != null ? Number(((r.clickRate != null ? r.clickRate : r.ctr) || 0).toFixed(2)) : 0,
      ctor: r.ctor != null ? Number(r.ctor.toFixed(2)) : 0,
      bounceRate: r.bounceRate != null ? Number(r.bounceRate.toFixed(2)) : 0,
    }));
  }, [rawRows]);

  const handleExportCsv = () => {
    if (!filteredRows.length) return;
    const exportData = filteredRows.map((r) => ({
      "Started Date": r.date ? prettyDate(r.date) : "—",
      "Started Time": r.date ? formatTime(r.date) : "—",
      "Campaign": r.campaign,
      "Mailing List": r.list || "General",
      "Sent": r.sent || 0,
      "Open Rate": r.openRate != null ? `${r.openRate.toFixed(2)}%` : "0%",
      "Unique Opens": r.opens || 0,
      "Click Rate": (r.clickRate ?? r.ctr) != null ? `${(r.clickRate ?? r.ctr).toFixed(2)}%` : "0%",
      "Unique Clicks": r.clicks || 0,
      "Click to Open Rate": r.ctor != null ? `${r.ctor.toFixed(2)}%` : "0%",
      "Unique Bounce Rate": r.bounceRate != null ? `${r.bounceRate.toFixed(2)}%` : "0%",
      "Unique Bounces": r.bounces || 0,
      "Complaint Rate": r.complaintRate != null ? `${r.complaintRate.toFixed(2)}%` : "0%",
      "Unique Complaints": r.complaints || 0,
      "Unsub Rate": r.unsubRate != null ? `${r.unsubRate.toFixed(2)}%` : "0%",
      "Unique Unsubs": r.unsubscribes || 0,
      "Leads Generated": r.leads || 0,
    }));
    downloadBlob(new Blob([toCsv(exportData)], { type: "text/csv;charset=utf-8;" }), "email-campaigns.csv");
  };

  if (!email || !rawRows.length) {
    return (
      <div className="space-y-6">
        <Panel
          title="Email Marketing Campaigns"
          note="Broadcasts, sequences, open rate metrics, and sales conversion attribution"
          right={
            <button
              type="button"
              onClick={() => downloadSampleSheet("email")}
              className="btn-primary !py-2 !px-3.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer shadow-glow-pink"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Email_Campaigns.xlsx
            </button>
          }
        >
          <EmptyState height={180}>
            No email campaign records were found for the selected period. Drop a sheet containing email marketing
            columns (Started, Campaign, Mailing List, Sent, Open Rate, Click Rate, Click to Open Rate, Unique Bounce Rate) or download the sample sheet above.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const deliveryRate = email.sent > 0 ? (email.delivered / email.sent) * 100 : 100;

  return (
    <div className="space-y-6">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-800 font-display">Email Marketing Campaigns</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Deliverability, unique open and click rates, CTOR, bounce rates, and unsubscribes
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="btn !py-2 !px-3.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 shadow-xs"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export CSV
          </button>
          <button
            type="button"
            onClick={() => downloadSampleSheet("email")}
            className="btn-primary !py-2 !px-3.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer shadow-glow-pink"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Sample Template
          </button>
        </div>
      </div>

      {/* KPI Band matching exact metrics */}
      <KpiBand>
        <Kpi
          figure={fmtInt(email.sent)}
          label="Total Sent"
          detail={`${email.campaigns} campaigns (${deliveryRate.toFixed(1)}% delivered)`}
          accent={MODULES.email.color}
        />
        <Kpi
          figure={`${email.openRate?.toFixed(2)}%`}
          label="Avg Open Rate"
          detail={`${fmtInt(email.opens)} Unique Opens`}
          accent="#10B981"
        />
        <Kpi
          figure={`${(email.ctr ?? email.clickRate ?? 0).toFixed(2)}%`}
          label="Avg Click Rate"
          detail={`${fmtInt(email.clicks)} Unique Clicks`}
          accent="#00C2FF"
        />
        <Kpi
          figure={`${(email.ctor ?? (email.opens ? (email.clicks / email.opens) * 100 : 0)).toFixed(2)}%`}
          label="Click to Open (CTOR)"
          detail={`${email.leads ? fmtInt(email.leads) + ' leads' : 'Engagement ratio'}`}
          accent="#7B61FF"
        />
        <Kpi
          figure={`${(email.bounceRate ?? (email.sent ? ((email.bounces || 0) / email.sent) * 100 : 0)).toFixed(2)}%`}
          label="Unique Bounce Rate"
          detail={`${fmtInt(email.bounces || 0)} Unique Bounces`}
          accent="#FA2E76"
        />
      </KpiBand>

      {/* Dual Performance Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <Panel
            title="Campaign Open Rate vs Click Rate (%)"
            note="Performance rates compared per broadcast"
          >
            <div className="h-[340px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={chartData} margin={{ top: 12, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS}
                    height={70}
                    angle={-22}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} unit="%" />
                  <Tooltip content={<EmailTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 16 }} />
                  <Bar dataKey="openRate" name="Open Rate %" fill="#10B981" radius={[4, 4, 0, 0]} maxBarSize={28} />
                  <Line type="monotone" dataKey="clickRate" name="Click Rate %" stroke="#00C2FF" strokeWidth={2.5} dot={{ r: 3.5, fill: "#00C2FF" }} />
                  <Line type="monotone" dataKey="ctor" name="Click to Open (CTOR) %" stroke="#7B61FF" strokeWidth={2} strokeDasharray="3 3" dot={{ r: 3, fill: "#7B61FF" }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>

        <div className="lg:col-span-5">
          <Panel
            title="Volume Distribution: Delivered vs Bounces"
            note="Deliverability volume breakdown per campaign"
          >
            <div className="h-[340px] w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 12, right: 15, left: -15, bottom: 25 }}>
                  <CartesianGrid stroke={GRID} vertical={false} strokeDasharray="3 3" />
                  <XAxis
                    dataKey="name"
                    tick={AXIS}
                    height={70}
                    angle={-22}
                    textAnchor="end"
                    interval={0}
                    tickLine={false}
                    axisLine={{ stroke: "#E2E8F0" }}
                  />
                  <YAxis tick={AXIS} tickLine={false} axisLine={false} />
                  <Tooltip content={<EmailTooltip />} />
                  <Legend verticalAlign="top" align="right" wrapperStyle={{ fontSize: 11, paddingBottom: 16 }} />
                  <Bar dataKey="delivered" name="Delivered" fill="#7B61FF" radius={[4, 4, 0, 0]} maxBarSize={22} />
                  <Bar dataKey="bounces" name="Bounces" fill="#FA2E76" radius={[4, 4, 0, 0]} maxBarSize={22} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Panel>
        </div>
      </div>

      {/* Exact Campaigns Data Table (Styled after Mail/Marketing UI Screenshot) */}
      <Panel
        title={`All Campaigns (${filteredRows.length})`}
        note="Exact campaign breakdown with Started, Mailing List, Open & Click Rates, CTOR, Bounces, Complaints, and Unsubs"
        right={
          <div className="flex flex-wrap items-center gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search campaigns..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="field !py-1.5 !pl-8 !pr-3 !text-xs w-48 rounded-xl bg-slate-50 border-slate-200"
              />
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>

            {/* Audience Dropdown Filter */}
            {audiences.length > 2 && (
              <select
                value={selectedAudience}
                onChange={(e) => setSelectedAudience(e.target.value)}
                className="field !py-1.5 !text-xs rounded-xl bg-slate-50 border-slate-200"
              >
                {audiences.map((a) => (
                  <option key={a} value={a}>
                    {a === "All" ? "All Audiences" : a}
                  </option>
                ))}
              </select>
            )}
          </div>
        }
      >
        <div className="overflow-x-auto border border-slate-200/80 rounded-xl">
          <table className="w-full border-collapse text-left text-xs bg-white">
            <thead>
              <tr className="border-b border-slate-200 bg-[#F1F5F5] font-bold text-[#2C5E58] tracking-tight">
                <th
                  onClick={() => {
                    setSortBy("date");
                    setSortAsc(sortBy === "date" ? !sortAsc : false);
                  }}
                  className="p-3.5 cursor-pointer select-none whitespace-nowrap"
                >
                  Started {sortBy === "date" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("campaign");
                    setSortAsc(sortBy === "campaign" ? !sortAsc : true);
                  }}
                  className="p-3.5 cursor-pointer select-none"
                >
                  Campaign <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Mailing List)</span> {sortBy === "campaign" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("sent");
                    setSortAsc(sortBy === "sent" ? !sortAsc : false);
                  }}
                  className="p-3.5 text-right cursor-pointer select-none whitespace-nowrap"
                >
                  Sent {sortBy === "sent" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("openRate");
                    setSortAsc(sortBy === "openRate" ? !sortAsc : false);
                  }}
                  className="p-3.5 text-right cursor-pointer select-none whitespace-nowrap"
                >
                  Open Rate <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Unique Opens)</span> {sortBy === "openRate" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("clickRate");
                    setSortAsc(sortBy === "clickRate" ? !sortAsc : false);
                  }}
                  className="p-3.5 text-right cursor-pointer select-none whitespace-nowrap"
                >
                  Click Rate <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Unique Clicks)</span> {sortBy === "clickRate" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("ctor");
                    setSortAsc(sortBy === "ctor" ? !sortAsc : false);
                  }}
                  className="p-3.5 text-right cursor-pointer select-none whitespace-nowrap"
                >
                  Click to Open <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">Rate</span> {sortBy === "ctor" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th
                  onClick={() => {
                    setSortBy("bounceRate");
                    setSortAsc(sortBy === "bounceRate" ? !sortAsc : false);
                  }}
                  className="p-3.5 text-right cursor-pointer select-none whitespace-nowrap"
                >
                  Unique Bounce Rate <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Unique Bounces)</span> {sortBy === "bounceRate" ? (sortAsc ? "↑" : "↓") : ""}
                </th>
                <th className="p-3.5 text-right whitespace-nowrap">
                  Complaint Rate <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Unique Complaints)</span>
                </th>
                <th className="p-3.5 text-right whitespace-nowrap">
                  Unsub Rate <br />
                  <span className="font-normal text-[11px] text-[#4A7C76]">(Unique Unsubs)</span>
                </th>
                <th className="p-3.5 text-center w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredRows.map((r, i) => {
                const clickRateVal = r.clickRate != null ? r.clickRate : r.ctr;
                const ctorVal = r.ctor != null ? r.ctor : (r.opens ? (r.clicks / r.opens) * 100 : 0);
                const bounceRateVal = r.bounceRate != null ? r.bounceRate : (r.sent ? ((r.bounces || 0) / r.sent) * 100 : 0);
                const complaintRateVal = r.complaintRate != null ? r.complaintRate : 0;
                const unsubRateVal = r.unsubRate != null ? r.unsubRate : (r.delivered ? ((r.unsubscribes || 0) / r.delivered) * 100 : 0);

                return (
                  <tr key={r.id || `${r.campaign}-${i}`} className="hover:bg-slate-50/80 transition-colors">
                    {/* Started Date & Time */}
                    <td className="p-3.5 align-top whitespace-nowrap">
                      <div className="font-medium text-slate-800 text-xs">
                        {r.date ? prettyDate(r.date) : (r.started?.split(" ")[0] || "—")}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {r.date ? formatTime(r.date) : (r.started?.split(" ")[1] || "")}
                      </div>
                    </td>

                    {/* Campaign & Mailing List */}
                    <td className="p-3.5 align-top">
                      <button
                        type="button"
                        onClick={() => setActiveModalCampaign(r)}
                        className="text-left font-semibold text-[#0D9488] hover:text-[#0F766E] hover:underline text-xs cursor-pointer block max-w-[280px] truncate"
                      >
                        {r.campaign}
                      </button>
                      <div className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[260px]">
                        {r.list || "General"}
                      </div>
                    </td>

                    {/* Sent */}
                    <td className="p-3.5 align-top text-right text-slate-700 font-semibold whitespace-nowrap">
                      {fmtInt(r.sent)}
                    </td>

                    {/* Open Rate (Unique Opens) */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        {r.openRate != null ? `${r.openRate.toFixed(2)}%` : "0.00%"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtInt(r.opens || 0)}
                      </div>
                    </td>

                    {/* Click Rate (Unique Clicks) */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        {clickRateVal != null ? `${clickRateVal.toFixed(2)}%` : "0.00%"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtInt(r.clicks || 0)}
                      </div>
                    </td>

                    {/* Click to Open Rate */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap font-semibold text-slate-700">
                      {ctorVal != null ? `${ctorVal.toFixed(2)}%` : "0.00%"}
                    </td>

                    {/* Unique Bounce Rate (Unique Bounces) */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        {bounceRateVal != null ? `${bounceRateVal.toFixed(2)}%` : "0.00%"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtInt(r.bounces || 0)}
                      </div>
                    </td>

                    {/* Complaint Rate (Unique Complaints) */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        {complaintRateVal != null ? `${complaintRateVal.toFixed(2)}%` : "0.00%"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtInt(r.complaints || 0)}
                      </div>
                    </td>

                    {/* Unsub Rate (Unique Unsubs) */}
                    <td className="p-3.5 align-top text-right whitespace-nowrap">
                      <div className="font-semibold text-slate-800 text-xs">
                        {unsubRateVal != null ? `${unsubRateVal.toFixed(2)}%` : "0.00%"}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {fmtInt(r.unsubscribes || 0)}
                      </div>
                    </td>

                    {/* Magnifying Glass Action Button */}
                    <td className="p-3.5 align-top text-center whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setActiveModalCampaign(r)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-800 hover:bg-slate-100/80 transition-all shadow-xs cursor-pointer"
                        title="View Campaign Details"
                      >
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="11" cy="11" r="8" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {/* Campaign Details Inspection Modal */}
      {activeModalCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="panel max-w-lg w-full bg-white rounded-2xl shadow-2xl p-6 border border-slate-100 relative">
            <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0D9488] bg-teal-50 px-2 py-0.5 rounded-md border border-teal-100">
                  Campaign Audit
                </span>
                <h3 className="text-base font-bold text-slate-800 mt-1">{activeModalCampaign.campaign}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Mailing List: {activeModalCampaign.list || "General Audience"}</p>
              </div>
              <button
                type="button"
                onClick={() => setActiveModalCampaign(null)}
                className="rounded-xl p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 my-5">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Total Sent</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(activeModalCampaign.sent)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Delivered</div>
                <div className="text-lg font-bold text-slate-800 mt-0.5">{fmtInt(activeModalCampaign.delivered || activeModalCampaign.sent)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Unique Opens</div>
                <div className="text-lg font-bold text-emerald-600 mt-0.5">
                  {fmtInt(activeModalCampaign.opens)} ({activeModalCampaign.openRate != null ? `${activeModalCampaign.openRate.toFixed(1)}%` : "0%"})
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Unique Clicks</div>
                <div className="text-lg font-bold text-[#00C2FF] mt-0.5">
                  {fmtInt(activeModalCampaign.clicks)} ({((activeModalCampaign.clickRate ?? activeModalCampaign.ctr) || 0).toFixed(1)}%)
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">CTOR</div>
                <div className="text-lg font-bold text-purple-600 mt-0.5">
                  {activeModalCampaign.ctor != null ? `${activeModalCampaign.ctor.toFixed(1)}%` : "0%"}
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Unique Bounces</div>
                <div className="text-lg font-bold text-rose-500 mt-0.5">
                  {fmtInt(activeModalCampaign.bounces || 0)} ({((activeModalCampaign.bounceRate) || 0).toFixed(1)}%)
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Complaints</div>
                <div className="text-lg font-bold text-slate-700 mt-0.5">{fmtInt(activeModalCampaign.complaints || 0)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Unsubscribes</div>
                <div className="text-lg font-bold text-slate-700 mt-0.5">
                  {fmtInt(activeModalCampaign.unsubscribes || 0)} ({((activeModalCampaign.unsubRate) || 0).toFixed(2)}%)
                </div>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <div className="text-[11px] text-slate-400">Leads Captured</div>
                <div className="text-lg font-bold text-emerald-700 mt-0.5">{fmtInt(activeModalCampaign.leads || 0)}</div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setActiveModalCampaign(null)}
                className="btn-primary !py-2 !px-4 !text-xs !font-bold cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
