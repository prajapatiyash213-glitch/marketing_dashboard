import { useMemo, useState } from "react";
import { Panel, EmptyState, Kpi, KpiBand } from "../components/primitives.jsx";
import { RankedBars } from "../components/visuals.jsx";
import { CATEGORICAL } from "../lib/palette.js";
import { downloadSampleSheet } from "../lib/sampleTemplates.js";

/** Formats currency exactly with its appropriate symbol without currency conversion or estimation. */
function fmtMoneyExact(amount, currency) {
  if (amount == null || !Number.isFinite(amount)) return "—";
  const symbol = currency === "USD" ? "$" : "₹";
  return `${symbol}${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function TechnologyCostsView({ d }) {
  const { costStats: cost } = d;
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const rows = cost?.rows || [];

  const categories = useMemo(() => {
    if (!rows.length) return ["All"];
    const set = new Set(rows.map((r) => r.category).filter(Boolean));
    return ["All", ...Array.from(set).sort()];
  }, [rows]);

  const filteredRows = useMemo(() => {
    if (!rows.length) return [];
    let list = rows;
    if (statusFilter !== "All") {
      list = list.filter((r) => String(r.status || "Active").toLowerCase() === statusFilter.toLowerCase());
    }
    if (selectedCategory !== "All") {
      list = list.filter((r) => r.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.tool?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.owner?.toLowerCase().includes(q) ||
          r.cycle?.toLowerCase().includes(q) ||
          r.status?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [rows, statusFilter, selectedCategory, search]);

  const activeRows = useMemo(() => rows.filter((r) => String(r.status || "Active").toLowerCase() === "active"), [rows]);
  const cancelledRows = useMemo(() => rows.filter((r) => String(r.status || "").toLowerCase() === "cancelled"), [rows]);
  const adhocRows = useMemo(() => rows.filter((r) => {
    const s = String(r.status || "").toLowerCase();
    const c = String(r.cycle || "").toLowerCase();
    return s === "ad hoc" || s === "adhoc" || c === "irregular";
  }), [rows]);

  const inrCategoryData = useMemo(() => {
    const map = new Map();
    const factor = cost?.factor ?? 1;
    for (const r of activeRows.filter((r) => r.currency !== "USD")) {
      const cat = r.category || "Uncategorised";
      const val = (r.monthlyCost ?? (r.cycle?.toLowerCase() === "monthly" ? r.costPerCycle : 0) ?? 0) * factor;
      map.set(cat, (map.get(cat) || 0) + val);
    }
    return Array.from(map, ([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [activeRows, cost?.factor]);

  const cycleCounts = useMemo(() => {
    const map = new Map();
    for (const r of rows) {
      const c = r.cycle || "Monthly";
      map.set(c, (map.get(c) || 0) + 1);
    }
    return Array.from(map, ([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
  }, [rows]);

  if (!cost) {
    return (
      <div className="space-y-6">
        <Panel
          title="Technology & Tool Costs"
          note="Analyze software subscriptions and exact billing commitments"
          right={
            <button
              type="button"
              onClick={() => downloadSampleSheet("cost")}
              className="btn-primary !py-2 !px-3.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer shadow-glow-pink"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Tools_And_Costs.xlsx
            </button>
          }
        >
          <EmptyState height={140}>
            No tool spend or software cost sheets have been loaded yet.
          </EmptyState>
        </Panel>
      </div>
    );
  }

  const factor = cost.factor ?? 1;
  const isScaled = factor !== 1;

  const currentInr = isScaled ? cost.periodInrTotal : cost.totalInrMonthly;
  const currentUsd = isScaled ? cost.periodUsdTotal : cost.totalUsdMonthly;

  return (
    <div className="space-y-6">
      {/* Top Exact KPI Band */}
      <KpiBand>
        <Kpi
          figure={`₹${currentInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Total (INR, active)"
          detail={`Across ${activeRows.filter((r) => r.currency !== "USD").length} active INR subscriptions`}
          accent="#6C5CE7"
        />
        <Kpi
          figure={`$${currentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
          label="Total (USD, active)"
          detail={`Across ${activeRows.filter((r) => r.currency === "USD").length} active USD subscription`}
          accent="#00C2FF"
        />
        <Kpi
          figure={String(activeRows.length)}
          label="Active subscriptions"
          detail="Active recurring tools"
          accent="#10B981"
        />
        <Kpi
          figure={String(adhocRows.length)}
          label="Ad hoc / Irregular"
          detail="On-demand usage tools"
          accent="#FF9F43"
        />
        <Kpi
          figure={String(cancelledRows.length)}
          label="Cancelled"
          detail="Terminated subscriptions"
          accent="#FA2E76"
        />
      </KpiBand>

      {/* Visual Breakdowns: Exact Category Spend & Billing Cycles */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-7">
          <Panel
            title="Spend by Category (INR, Active)"
            note="Totals from active recurring software"
          >
            <RankedBars
              rows={inrCategoryData}
              colorFor={(_, i) => CATEGORICAL[(i + 1) % CATEGORICAL.length]}
              format={(v) => `₹${v.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            />
          </Panel>
        </div>

        <div className="lg:col-span-5 flex flex-col gap-4">
          <Panel
            title="Billing Cycle Distribution"
            note="Payment frequencies across all subscriptions"
          >
            <div className="grid grid-cols-2 gap-3">
              {cycleCounts.map(({ name, count }) => (
                <div key={name} className="p-3 bg-slate-50/90 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-semibold text-slate-700 block">{name}</span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">Cadence</span>
                  </div>
                  <span className="text-base font-extrabold text-[#6C5CE7] font-display">
                    {count} {count === 1 ? "tool" : "tools"}
                  </span>
                </div>
              ))}
            </div>
          </Panel>

          <Panel title="Data Status Breakdown" note="Subscription life-cycle stages">
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-emerald-500 inline-block" />
                <span className="font-semibold text-slate-700">Active: {activeRows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-amber-500 inline-block" />
                <span className="font-semibold text-slate-700">Ad hoc: {adhocRows.length}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-rose-500 inline-block" />
                <span className="font-semibold text-slate-700">Cancelled: {cancelledRows.length}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Exact Table (Matching the user's Excel sheet) */}
      <Panel
        title="Technology & Tool Subscriptions"
        note={`${filteredRows.length} of ${rows.length} records shown`}
        right={
          <button
            type="button"
            onClick={() => downloadSampleSheet("cost")}
            className="btn !py-1.5 !px-3 !text-xs !font-bold text-slate-700 hover:text-[#FA2E76] flex items-center gap-1.5 cursor-pointer"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Download Tools_And_Costs.xlsx
          </button>
        }
      >
        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Tabs */}
            <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
              {[
                ["All", rows.length],
                ["Active", activeRows.length],
                ["Ad hoc", adhocRows.length],
                ["Cancelled", cancelledRows.length],
              ].map(([status, count]) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                    statusFilter === status
                      ? "bg-white text-slate-800 shadow-2xs font-bold"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {status} ({count})
                </button>
              ))}
            </div>

            {/* Category Dropdown */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
            >
              {categories.map((c) => (
                <option key={c} value={c}>
                  Category: {c}
                </option>
              ))}
            </select>
          </div>

          {/* Search Box */}
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
              placeholder="Search tools, owner..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#6C5CE7] w-52"
            />
          </div>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-[#1E293B] text-slate-200 text-[11px] font-bold">
              <tr>
                <th className="p-3">Tool</th>
                <th className="p-3">Category</th>
                <th className="p-3">Owner</th>
                <th className="p-3 text-right">Monthly Cost</th>
                <th className="p-3">Billing Cycle</th>
                <th className="p-3 text-center">Seats</th>
                <th className="p-3">Renewal</th>
                <th className="p-3 text-right">Cost per Cycle</th>
                <th className="p-3 text-center">Currency</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {!filteredRows.length ? (
                <tr>
                  <td colSpan={10} className="p-8 text-center text-slate-400">
                    No tools match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredRows.map((r, i) => {
                  const isCancelled = String(r.status || "").toLowerCase() === "cancelled";
                  const isAdhoc = String(r.status || "").toLowerCase() === "ad hoc" || String(r.status || "").toLowerCase() === "adhoc";

                  return (
                    <tr
                      key={r.id || `${r.tool}-${i}`}
                      className={`hover:bg-slate-50/90 transition-colors ${
                        isCancelled ? "bg-slate-50/60 text-slate-400 italic" : ""
                      }`}
                    >
                      {/* Tool */}
                      <td className="p-3 font-bold text-slate-800">
                        <div className="flex items-center gap-2">
                          <span
                            className={`h-6 w-6 rounded-lg flex items-center justify-center font-black text-[11px] shrink-0 ${
                              isCancelled
                                ? "bg-slate-200 text-slate-500"
                                : "bg-indigo-50 text-[#6C5CE7]"
                            }`}
                          >
                            {r.tool ? r.tool.charAt(0).toUpperCase() : "T"}
                          </span>
                          <span className={isCancelled ? "line-through text-slate-400" : "text-slate-800"}>
                            {r.tool}
                          </span>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3">
                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-100 text-slate-700">
                          {r.category || "—"}
                        </span>
                      </td>

                      {/* Owner */}
                      <td className="p-3 text-slate-600 font-mono text-[11px] max-w-[220px] truncate" title={r.owner || ""}>
                        {r.owner || "—"}
                      </td>

                      {/* Monthly Cost */}
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {fmtMoneyExact(isScaled ? r.periodCost : r.monthlyCost, r.currency)}
                      </td>

                      {/* Billing Cycle */}
                      <td className="p-3 font-medium text-slate-700">
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold ${
                          r.cycle === "Annual"
                            ? "bg-purple-50 text-[#6C5CE7] border border-purple-200/60"
                            : r.cycle === "2 Years"
                            ? "bg-blue-50 text-blue-700 border border-blue-200/60"
                            : r.cycle === "Irregular"
                            ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                            : "bg-slate-100 text-slate-700"
                        }`}>
                          {r.cycle || "Monthly"}
                        </span>
                      </td>

                      {/* Seats */}
                      <td className="p-3 text-center font-mono font-semibold text-slate-700">
                        {r.seats != null && r.seats !== "" ? r.seats : "—"}
                      </td>

                      {/* Renewal */}
                      <td className="p-3 text-slate-600 font-mono text-[11px]">
                        {r.renewal || "—"}
                      </td>

                      {/* Cost per Cycle */}
                      <td className="p-3 text-right font-mono font-bold text-slate-800">
                        {fmtMoneyExact(r.costPerCycle, r.currency)}
                      </td>

                      {/* Currency */}
                      <td className="p-3 text-center">
                        {r.currency ? (
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              r.currency === "USD"
                                ? "bg-cyan-50 text-cyan-700 border border-cyan-200/60"
                                : "bg-violet-50 text-violet-700 border border-violet-200/60"
                            }`}
                          >
                            {r.currency}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>

                      {/* Status */}
                      <td className="p-3 text-center">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCancelled
                              ? "bg-rose-50 text-rose-600 border border-rose-200/60"
                              : isAdhoc
                              ? "bg-amber-50 text-amber-700 border border-amber-200/60"
                              : "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                          }`}
                        >
                          {r.status || "Active"}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>

            {/* Exact Totals Footer Rows */}
            <tfoot className="border-t-2 border-slate-300 bg-slate-50 text-xs font-bold text-slate-900">
              <tr>
                <td colSpan={3} className="p-3 text-right text-slate-600 uppercase tracking-wide text-[11px]">
                  Total (INR, active)
                </td>
                <td className="p-3 text-right font-mono text-sm font-black text-slate-900 bg-amber-50/60">
                  ₹{currentInr.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={6} className="p-3 text-slate-400 font-normal text-[11px]">
                  Sum of active INR subscriptions
                </td>
              </tr>
              <tr>
                <td colSpan={3} className="p-3 text-right text-slate-600 uppercase tracking-wide text-[11px]">
                  Total (USD, active)
                </td>
                <td className="p-3 text-right font-mono text-sm font-black text-slate-900 bg-amber-50/60">
                  ${currentUsd.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td colSpan={6} className="p-3 text-slate-400 font-normal text-[11px]">
                  Sum of active USD subscriptions (Apollo.io)
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Panel>
    </div>
  );
}
