import { useMemo, useState } from "react";
import { Panel, Kpi, KpiBand } from "../components/primitives.jsx";
import { downloadSampleSheet } from "../lib/sampleTemplates.js";
import { EXACT_SAMPLE_DROPOFFS, formatDropoffRecord } from "../lib/dropoffData.js";

export function WebsiteDropoffsView({ d, setView }) {
  const [visitorBrandFilter, setVisitorBrandFilter] = useState("All");
  const [ownerFilter, setOwnerFilter] = useState("All");
  const [visitorSearch, setVisitorSearch] = useState("");
  const [visitorJourneyFilter, setVisitorJourneyFilter] = useState("All");
  const [connectFilter, setConnectFilter] = useState("All"); // "All" | "connected" | "pending"
  const [exitPageFilter, setExitPageFilter] = useState("All");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "cards"
  const [expandedRow, setExpandedRow] = useState(null);
  const [copiedEmail, setCopiedEmail] = useState(null);

  const dropoffStats = d?.dropoffStats;
  const currentSite = d?.site || "All";
  const rangeKey = d?.rangeKey || "all";
  const rangeLabel = d?.range?.label || "All time";

  // Base records from dashboard context (reacts automatically to global Site and Timeframe)
  const baseRecords = useMemo(() => {
    if (dropoffStats?.records) return dropoffStats.records;
    return EXACT_SAMPLE_DROPOFFS.map(formatDropoffRecord);
  }, [dropoffStats]);

  const allPortfolioRecords = useMemo(() => {
    if (dropoffStats?.allRecords) return dropoffStats.allRecords;
    return EXACT_SAMPLE_DROPOFFS.map(formatDropoffRecord);
  }, [dropoffStats]);

  // Copy email helper
  const handleCopyEmail = (email, e) => {
    if (e) e.stopPropagation();
    if (!email) return;
    navigator.clipboard?.writeText(email);
    setCopiedEmail(email);
    setTimeout(() => setCopiedEmail(null), 2000);
  };

  // Unique list of owners from base records
  const ownersList = useMemo(() => {
    const set = new Set();
    for (const r of baseRecords) {
      if (r.ownership && String(r.ownership).trim()) {
        set.add(String(r.ownership).trim());
      }
    }
    return Array.from(set).sort();
  }, [baseRecords]);

  // Filtered visitor leads based on in-view interactive filters
  const filteredVisitors = useMemo(() => {
    let list = baseRecords;

    // Brand filter (if not already constrained by global site)
    if (visitorBrandFilter !== "All") {
      list = list.filter((r) => r.brand?.toLowerCase() === visitorBrandFilter.toLowerCase());
    }

    // Ownership filter
    if (ownerFilter !== "All") {
      list = list.filter((r) => r.ownership?.toLowerCase() === ownerFilter.toLowerCase());
    }

    // Journey depth filter
    if (visitorJourneyFilter === "multi") {
      list = list.filter((r) => (r.pages?.length || 1) > 1);
    } else if (visitorJourneyFilter === "single") {
      list = list.filter((r) => (r.pages?.length || 1) <= 1);
    }

    // Connect outreach status filter
    if (connectFilter === "connected") {
      list = list.filter((r) => r.hasConnect || r.dateOfConnect || r.comments);
    } else if (connectFilter === "pending") {
      list = list.filter((r) => !r.hasConnect && !r.dateOfConnect && !r.comments);
    }

    // Exit page filter
    if (exitPageFilter !== "All") {
      list = list.filter((r) => r.lastPage === exitPageFilter || (r.pages && r.pages.includes(exitPageFilter)));
    }

    // Search query
    if (visitorSearch.trim()) {
      const q = visitorSearch.toLowerCase();
      list = list.filter(
        (r) =>
          r.name?.toLowerCase().includes(q) ||
          r.company?.toLowerCase().includes(q) ||
          r.title?.toLowerCase().includes(q) ||
          r.email?.toLowerCase().includes(q) ||
          r.pageVisited?.toLowerCase().includes(q) ||
          r.brand?.toLowerCase().includes(q) ||
          r.ownership?.toLowerCase().includes(q)
      );
    }
    return list;
  }, [baseRecords, visitorBrandFilter, ownerFilter, visitorJourneyFilter, connectFilter, exitPageFilter, visitorSearch]);

  // Dynamic counts derived from the active view scope
  const totalInScope = baseRecords.length;
  const portfolioTotal = allPortfolioRecords.length;
  const acoeCount = baseRecords.filter((r) => r.brand?.toLowerCase() === "acoe" || r.siteId === "automationcoe.com").length;
  const tecnoprismCount = baseRecords.filter((r) => r.brand?.toLowerCase() === "tecnoprism" || r.siteId === "tecnoprism.com").length;
  const multiPageCount = baseRecords.filter((r) => (r.pages?.length || 0) > 1).length;
  const connectedCount = baseRecords.filter((r) => r.hasConnect || r.dateOfConnect || r.comments).length;
  const pendingCount = totalInScope - connectedCount;

  // Compute top exit pages dynamically for active scope
  const exitPageCounts = useMemo(() => {
    const counts = new Map();
    for (const r of baseRecords) {
      const page = r.lastPage || "Unknown";
      counts.set(page, (counts.get(page) || 0) + 1);
    }
    return Array.from(counts, ([url, count]) => ({ url, count }))
      .sort((a, b) => b.count - a.count);
  }, [baseRecords]);

  // Clear all local filters
  const resetLocalFilters = () => {
    setVisitorBrandFilter("All");
    setOwnerFilter("All");
    setVisitorJourneyFilter("All");
    setConnectFilter("All");
    setExitPageFilter("All");
    setVisitorSearch("");
  };

  const hasActiveLocalFilters =
    visitorBrandFilter !== "All" ||
    ownerFilter !== "All" ||
    visitorJourneyFilter !== "All" ||
    connectFilter !== "All" ||
    exitPageFilter !== "All" ||
    visitorSearch.trim() !== "";

  return (
    <div className="space-y-6">
      {/* Dynamic KPI Band - Strictly Updates on Site & Timeframe */}
      <KpiBand>
        <Kpi
          figure={String(totalInScope)}
          label={currentSite === "All" ? "Total Drop-off Leads" : currentSite === "automationcoe.com" ? "ACOE Drop-offs" : "Tecnoprism Drop-offs"}
          detail={currentSite !== "All" ? `Filtered from ${portfolioTotal} total leads` : "Across all websites"}
          accent="#FA2E76"
        />
        <Kpi
          figure={String(multiPageCount)}
          label="Multi-Page Journeys"
          detail={totalInScope ? `${Math.round((multiPageCount / totalInScope) * 100)}% explored 2+ URLs` : "0%"}
          accent="#00C2FF"
        />
        <Kpi
          figure={String(Math.max(0, totalInScope - multiPageCount))}
          label="Single-Page Exits"
          detail={totalInScope ? `${Math.round((Math.max(0, totalInScope - multiPageCount) / totalInScope) * 100)}% immediate exit` : "0%"}
          accent="#FF9F43"
        />
        <Kpi
          figure={String(connectedCount)}
          label="Connects Sent"
          detail={totalInScope ? `${Math.round((connectedCount / totalInScope) * 100)}% outreach sent` : "0%"}
          accent="#10B981"
        />
        <Kpi
          figure={String(pendingCount)}
          label="Pending Outreach"
          detail="Requires SDR follow-up"
          accent="#7B61FF"
        />
      </KpiBand>

      {/* Interactive Leakage Explorer & Visual Filter Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Top Exit Pages (Interactive - click to filter table!) */}
        <div className="lg:col-span-8">
          <Panel
            title="Interactive Exit Page Breakdown"
            note="Click any URL to filter the visitor list to leads who dropped off at that point"
            right={
              exitPageFilter !== "All" && (
                <button
                  type="button"
                  onClick={() => setExitPageFilter("All")}
                  className="text-xs font-bold text-[#FA2E76] hover:underline cursor-pointer flex items-center gap-1"
                >
                  Clear Exit Filter ✕
                </button>
              )
            }
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
              {exitPageCounts.slice(0, 6).map((item) => {
                const isSelected = exitPageFilter === item.url;
                const pct = Math.round((item.count / (totalInScope || 1)) * 100);
                return (
                  <div
                    key={item.url}
                    onClick={() => setExitPageFilter(isSelected ? "All" : item.url)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? "bg-pink-50 border-[#FA2E76] shadow-sm ring-1 ring-[#FA2E76]"
                        : "bg-slate-50/80 hover:bg-white hover:border-slate-300 border-slate-200/80"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <span className="font-mono text-xs font-bold text-slate-800 truncate" title={item.url}>
                        {item.url}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
                        isSelected ? "bg-[#FA2E76] text-white" : "bg-rose-100 text-rose-800"
                      }`}>
                        {item.count} leads ({pct}%)
                      </span>
                    </div>
                    {/* Progress visual bar */}
                    <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isSelected ? "bg-[#FA2E76]" : "bg-indigo-500"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Panel>
        </div>

        {/* Quick Filter & Outreach Readiness Panel */}
        <div className="lg:col-span-4 flex flex-col gap-4">
          <Panel title="Outreach &amp; Engagement Status" note="Click to filter by SDR connect status">
            <div className="space-y-2.5 pt-1">
              <div
                onClick={() => setConnectFilter(connectFilter === "connected" ? "All" : "connected")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  connectFilter === "connected"
                    ? "bg-emerald-50 border-emerald-500 ring-1 ring-emerald-500"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-black text-sm">
                    ✓
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Connect Sent</span>
                    <span className="text-[10px] text-slate-500 block">Outreach initiated by Pinali</span>
                  </div>
                </div>
                <span className="text-lg font-black font-display text-emerald-600">{connectedCount}</span>
              </div>

              <div
                onClick={() => setConnectFilter(connectFilter === "pending" ? "All" : "pending")}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                  connectFilter === "pending"
                    ? "bg-amber-50 border-amber-500 ring-1 ring-amber-500"
                    : "bg-slate-50 hover:bg-white border-slate-200"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="h-8 w-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center font-black text-sm">
                    ⏱
                  </span>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Pending Outreach</span>
                    <span className="text-[10px] text-slate-500 block">Awaiting SDR action</span>
                  </div>
                </div>
                <span className="text-lg font-black font-display text-amber-600">{pendingCount}</span>
              </div>
            </div>
          </Panel>
        </div>
      </div>

      {/* Main Interactive Visitor Leads Directory */}
      <Panel
        title="Visitor Drop-off Leads Directory"
        note={`Showing ${filteredVisitors.length} of ${totalInScope} leads matching active filters`}
        right={
          <div className="flex flex-wrap items-center gap-2.5">
            {dropoffStats?.hasUploadedData ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Uploaded File
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                Sample Reference Sheet
              </span>
            )}

            <button
              type="button"
              onClick={() => downloadSampleSheet("dropoffs")}
              className="btn-primary !py-1 !px-2.5 !text-xs !font-bold flex items-center gap-1.5 cursor-pointer shadow-glow-pink"
              title="Download formatted sample Excel sheet for drop-offs"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Download Website_Dropoffs.xlsx
            </button>

            {/* View Mode Toggle: Grid vs Cards */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                  viewMode === "grid"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Spreadsheet Table View"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M3 3h18v18H3z" />
                  <path d="M3 9h18M3 15h18M9 3v18M15 3v18" />
                </svg>
                Table
              </button>
              <button
                type="button"
                onClick={() => setViewMode("cards")}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold flex items-center gap-1.5 ${
                  viewMode === "cards"
                    ? "bg-white text-slate-900 shadow-2xs"
                    : "text-slate-500 hover:text-slate-900"
                }`}
                title="Journey Cards View"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="3" width="7" height="7" />
                  <rect x="14" y="3" width="7" height="7" />
                  <rect x="14" y="14" width="7" height="7" />
                  <rect x="3" y="14" width="7" height="7" />
                </svg>
                Cards
              </button>
            </div>
          </div>
        }
      >
        {/* Filter and Search Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Brand Filter (only show if currentSite is All) */}
            {currentSite === "All" && (
              <div className="flex items-center rounded-xl bg-slate-100 p-0.5 text-xs font-semibold">
                {[
                  ["All Brands", totalInScope, "All"],
                  ["Tecnoprism", tecnoprismCount, "Tecnoprism"],
                  ["ACOE", acoeCount, "ACOE"],
                ].map(([label, count, key]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setVisitorBrandFilter(key)}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      visitorBrandFilter === key
                        ? "bg-white text-slate-900 shadow-2xs font-bold"
                        : "text-slate-500 hover:text-slate-800"
                    }`}
                  >
                    {label} ({count})
                  </button>
                ))}
              </div>
            )}

            {/* Journey Depth Filter */}
            <select
              value={visitorJourneyFilter}
              onChange={(e) => setVisitorJourneyFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Journey Depths</option>
              <option value="multi">Multi-Page Browsers ({multiPageCount})</option>
              <option value="single">Single Page Exit ({totalInScope - multiPageCount})</option>
            </select>

            {/* Outreach Filter */}
            <select
              value={connectFilter}
              onChange={(e) => setConnectFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Outreach Status</option>
              <option value="connected">Connect Sent ({connectedCount})</option>
              <option value="pending">Pending Outreach ({pendingCount})</option>
            </select>

            {/* Ownership Filter */}
            <select
              value={ownerFilter}
              onChange={(e) => setOwnerFilter(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl px-2.5 py-1 text-xs text-slate-700 font-medium focus:outline-none"
            >
              <option value="All">All Ownership</option>
              {ownersList.map((owner) => {
                const cnt = baseRecords.filter((r) => r.ownership?.toLowerCase() === owner.toLowerCase()).length;
                return (
                  <option key={owner} value={owner}>
                    Owner: {owner} ({cnt})
                  </option>
                );
              })}
            </select>

            {/* Active Exit Filter Badge */}
            {exitPageFilter !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-pink-100 text-pink-800 border border-pink-200">
                Exit: {exitPageFilter}
                <button
                  type="button"
                  onClick={() => setExitPageFilter("All")}
                  className="hover:text-black font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Active Owner Filter Badge */}
            {ownerFilter !== "All" && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                Owner: {ownerFilter}
                <button
                  type="button"
                  onClick={() => setOwnerFilter("All")}
                  className="hover:text-black font-extrabold cursor-pointer"
                >
                  ✕
                </button>
              </span>
            )}

            {/* Reset Filters Button */}
            {hasActiveLocalFilters && (
              <button
                type="button"
                onClick={resetLocalFilters}
                className="text-xs text-rose-600 hover:text-rose-800 font-bold underline cursor-pointer ml-1"
              >
                Clear all filters
              </button>
            )}
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
              placeholder="Search visitor, company, email, URL..."
              value={visitorSearch}
              onChange={(e) => setVisitorSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200/80 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-[#FA2E76] w-64"
            />
          </div>
        </div>

        {/* ================================================================= */}
        {/* VIEW 1: INTERACTIVE JOURNEY CARDS VIEW                            */}
        {/* ================================================================= */}
        {viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {!filteredVisitors.length ? (
              <div className="col-span-2 p-12 text-center text-slate-400 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-sm font-semibold">No drop-off leads match your current selection.</p>
                <button
                  type="button"
                  onClick={resetLocalFilters}
                  className="mt-3 btn-secondary !py-1 !px-3 !text-xs"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              filteredVisitors.map((r, i) => {
                const pages = r.pages || (r.pageVisited ? r.pageVisited.split(/[\r\n;]+/).map((s) => s.trim()).filter(Boolean) : []);
                const isCopied = copiedEmail === r.email;

                return (
                  <div
                    key={r.id || i}
                    className="p-4 rounded-2xl bg-white border border-slate-200 shadow-2xs hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Visitor & Company Header */}
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-700 flex items-center justify-center font-black text-sm border border-slate-300/80">
                            {r.name ? r.name.charAt(0) : "V"}
                          </div>
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-sm leading-tight">
                              {r.name || [r.firstName, r.lastName].filter(Boolean).join(" ") || "Visitor"}
                            </h4>
                            <p className="text-xs text-slate-500 leading-tight mt-0.5 line-clamp-1" title={r.title}>
                              {r.title || "Visitor"}
                            </p>
                            <p className="text-[11px] font-bold text-indigo-700 leading-tight mt-0.5">
                              {r.company || "—"}
                            </p>
                          </div>
                        </div>

                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                          r.brand?.toLowerCase() === "tecnoprism"
                            ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                            : "bg-purple-50 text-purple-700 border border-purple-200"
                        }`}>
                          {r.brand || "—"}
                        </span>
                      </div>

                      {/* Email Bar with Quick Copy */}
                      <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 mb-3 text-xs">
                        <span className="font-mono text-slate-700 truncate mr-2" title={r.email}>
                          {r.email || "No email recorded"}
                        </span>
                        {r.email && (
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button
                              type="button"
                              onClick={(e) => handleCopyEmail(r.email, e)}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            >
                              {isCopied ? "✓ Copied!" : "Copy"}
                            </button>
                            <a
                              href={`mailto:${r.email}`}
                              className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FA2E76] text-white hover:bg-pink-600 cursor-pointer"
                            >
                              Email
                            </a>
                          </div>
                        )}
                      </div>

                      {/* Visual Journey Path Breadcrumbs */}
                      <div className="mb-3">
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-500 mb-1">
                          <span>Pages Visited ({pages.length})</span>
                          <span className="text-[10px] text-rose-600 font-extrabold">Exited on Last URL</span>
                        </div>

                        <div className="space-y-1">
                          {pages.map((p, pIdx) => {
                            const isExit = pIdx === pages.length - 1;
                            return (
                              <div
                                key={pIdx}
                                className={`flex items-center gap-2 p-1.5 rounded-lg font-mono text-[11px] border ${
                                  isExit
                                    ? "bg-rose-50/80 border-rose-200 text-rose-900 font-semibold"
                                    : "bg-slate-50 border-slate-200/60 text-slate-600"
                                }`}
                              >
                                <span className="text-slate-400 text-[10px] w-3">{pIdx + 1}.</span>
                                <span className="truncate">{p}</span>
                                {isExit && (
                                  <span className="ml-auto text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-rose-200 text-rose-800 shrink-0">
                                    Drop-off
                                  </span>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata & Follow-up Row */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                      <div className="flex items-center gap-1.5">
                        <span>Lead Date: <strong className="text-slate-800">{r.leadDate || "—"}</strong></span>
                        <span>•</span>
                        <span>Owner: <strong className="text-slate-800">{r.ownership || "Pinali"}</strong></span>
                      </div>

                      {r.dateOfConnect || r.comments ? (
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          ✓ Connect: {r.dateOfConnect || "Sent"}
                        </span>
                      ) : (
                        <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          Pending Outreach
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* VIEW 2: FULL DATA GRID (EXACT SPREADSHEET TABLE)                  */
          /* ================================================================= */
          <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#1E293B] text-slate-200 text-[11px] font-bold">
                <tr>
                  <th className="p-3 w-8 text-center">#</th>
                  <th className="p-3">Visitor Name &amp; Title</th>
                  <th className="p-3">Company</th>
                  <th className="p-3">Email Address</th>
                  <th className="p-3 min-w-[300px]">Pages Visited &amp; Exit Journey</th>
                  <th className="p-3 text-center">Brand</th>
                  <th className="p-3">Ownership</th>
                  <th className="p-3 text-center">Lead Date</th>
                  <th className="p-3">Stage / Source</th>
                  <th className="p-3">Date of Connect &amp; Comments</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {!filteredVisitors.length ? (
                  <tr>
                    <td colSpan={11} className="p-12 text-center text-slate-400">
                      <p className="font-semibold text-sm">No drop-off visitor records match your current filters.</p>
                      <button
                        type="button"
                        onClick={resetLocalFilters}
                        className="mt-3 btn-secondary !py-1 !px-3 !text-xs cursor-pointer"
                      >
                        Reset Filters
                      </button>
                    </td>
                  </tr>
                ) : (
                  filteredVisitors.map((r, i) => {
                    const pages = r.pages || (r.pageVisited ? r.pageVisited.split(/[\r\n;]+/).map((s) => s.trim()).filter(Boolean) : []);
                    const isExpanded = expandedRow === r.id || expandedRow === i;
                    const isCopied = copiedEmail === r.email;

                    return (
                      <tr key={r.id || i} className="hover:bg-slate-50/90 transition-colors">
                        {/* Row Index */}
                        <td className="p-3 text-center text-slate-400 font-mono text-[10px]">
                          {i + 1}
                        </td>

                        {/* Visitor Name & Title */}
                        <td className="p-3">
                          <span className="font-extrabold text-slate-900 block text-xs">
                            {r.name || [r.firstName, r.lastName].filter(Boolean).join(" ") || "Visitor"}
                          </span>
                          {r.title && (
                            <span className="text-[11px] text-slate-500 font-normal block leading-tight mt-0.5 line-clamp-1" title={r.title}>
                              {r.title}
                            </span>
                          )}
                        </td>

                        {/* Company */}
                        <td className="p-3">
                          <span className="font-semibold text-slate-800 block text-xs">
                            {r.company || "—"}
                          </span>
                          {r.companyForEmails && r.companyForEmails !== r.company && (
                            <span className="text-[10px] text-slate-400 block mt-0.5">
                              for emails: {r.companyForEmails}
                            </span>
                          )}
                        </td>

                        {/* Email Address with Copy Action */}
                        <td className="p-3 font-mono text-[11px]">
                          {r.email ? (
                            <div className="flex items-center gap-1.5">
                              <a
                                href={`mailto:${r.email}`}
                                className="text-indigo-600 hover:text-indigo-800 hover:underline"
                              >
                                {r.email}
                              </a>
                              <button
                                type="button"
                                onClick={(e) => handleCopyEmail(r.email, e)}
                                className="text-slate-400 hover:text-slate-700 cursor-pointer p-0.5"
                                title="Copy email"
                              >
                                {isCopied ? (
                                  <span className="text-emerald-600 font-bold text-[10px]">✓</span>
                                ) : (
                                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Pages Visited & Exit Journey */}
                        <td className="p-3">
                          {pages.length === 0 ? (
                            <span className="text-slate-400 font-mono text-[11px]">—</span>
                          ) : pages.length === 1 ? (
                            <div className="flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                              <span className="font-mono text-[11px] text-slate-800 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 font-medium">
                                {pages[0]}
                              </span>
                            </div>
                          ) : (
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                  {pages.length} URLs
                                </span>
                                <button
                                  type="button"
                                  onClick={() => setExpandedRow(isExpanded ? null : (r.id || i))}
                                  className="text-[10px] font-bold text-slate-600 hover:text-slate-900 underline cursor-pointer"
                                >
                                  {isExpanded ? "Collapse path" : "Expand full path"}
                                </button>
                              </div>

                              {isExpanded ? (
                                <div className="space-y-1 pt-1">
                                  {pages.map((p, pIdx) => {
                                    const isExit = pIdx === pages.length - 1;
                                    return (
                                      <div
                                        key={pIdx}
                                        className={`flex items-center gap-1.5 font-mono text-[10px] p-1 rounded border ${
                                          isExit
                                            ? "bg-rose-50 text-rose-900 border-rose-200 font-bold"
                                            : "bg-slate-50 text-slate-700 border-slate-200"
                                        }`}
                                      >
                                        <span className="text-slate-400 w-3">{pIdx + 1}.</span>
                                        <span className="truncate">{p}</span>
                                        {isExit && (
                                          <span className="ml-auto text-[9px] font-black uppercase text-rose-700 shrink-0">
                                            [Exit]
                                          </span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 font-mono text-[10px] text-slate-600">
                                  <span className="truncate max-w-[180px] bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                                    {pages[0]}
                                  </span>
                                  <span className="text-slate-400 font-bold shrink-0">+{pages.length - 1} more</span>
                                  <span className="text-rose-600 font-bold text-[9px] ml-1 bg-rose-50 px-1 rounded border border-rose-200 truncate max-w-[120px]" title={`Exit: ${r.lastPage}`}>
                                    Exit: {r.lastPage}
                                  </span>
                                </div>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Brand */}
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold tracking-wide uppercase ${
                            r.brand?.toLowerCase() === "tecnoprism"
                              ? "bg-cyan-50 text-cyan-700 border border-cyan-200"
                              : "bg-purple-50 text-purple-700 border border-purple-200"
                          }`}>
                            {r.brand || "—"}
                          </span>
                        </td>

                        {/* Ownership */}
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <span className="h-5 w-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-black text-[10px]">
                              {r.ownership ? r.ownership[0].toUpperCase() : "P"}
                            </span>
                            <span className="font-medium text-slate-700 text-xs">
                              {r.ownership || "Pinali"}
                            </span>
                          </div>
                        </td>

                        {/* Lead Date */}
                        <td className="p-3 text-center font-mono text-[11px] text-slate-600">
                          {r.leadDate || "—"}
                        </td>

                        {/* Stage / Source */}
                        <td className="p-3">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            {r.leadStage || "Discovery"}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {r.leadSource || "Inbound - Direct"}
                          </span>
                        </td>

                        {/* Date of Connect & Comments */}
                        <td className="p-3">
                          {r.dateOfConnect || r.comments ? (
                            <div>
                              {r.dateOfConnect && (
                                <span className="font-semibold text-slate-800 text-[11px] block">
                                  {r.dateOfConnect}
                                </span>
                              )}
                              {r.comments && (
                                <span className="text-[10px] text-slate-500 italic block mt-0.5">
                                  "{r.comments}"
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="p-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                            {r.leadStatus || "New"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}
