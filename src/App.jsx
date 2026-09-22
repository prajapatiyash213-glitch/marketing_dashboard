import { useMemo, useState, lazy, Suspense } from "react";
import { AuthProvider, useAuth } from "./auth/AuthContext.jsx";
import { SignIn } from "./auth/SignIn.jsx";
import { DataProvider, useData } from "./state/DataContext.jsx";
import { useDashboard } from "./state/useDashboard.js";
import { Sidebar, AccountMenu, NAV } from "./components/Shell.jsx";
import { DateRangeBar } from "./components/DateRangeBar.jsx";
import { Dropzone } from "./components/Dropzone.jsx";
import { SampleSheetsSection } from "./components/SampleSheetsSection.jsx";
import { ErrorBoundary } from "./components/ErrorBoundary.jsx";
const ViewRouter = lazy(() => import("./views/ViewRouter.jsx"));
import { prettyDate } from "./lib/dates.js";
import { fmtInt } from "./lib/numbers.js";
import { STAGES } from "./lib/stages.js";
import { leadRows, toCsv, buildWorkbook, downloadBlob } from "./lib/exporters.js";
import { EXACT_SEO_DATA } from "./lib/exactSeoData.js";

function Dashboard() {
  const data = useData();
  const effectiveWeeks = data.weeks || [];
  const d = useDashboard({ leads: data.leads, weeks: effectiveWeeks, channels: data.channels });
  const [view, setView] = useState("overview");
  const [filters, setFilters] = useState({ file: "All", stage: "All", status: "All", query: "" });

  const channelRows = Object.values(data.channels || {}).reduce((n, r) => n + r.length, 0);
  const hasData = data.leads.length > 0 || data.weeks.length > 0 || channelRows > 0;
  const statuses = useMemo(
    () => Array.from(new Set(data.leads.map((l) => l.status).filter((s) => s && s !== "—"))).sort(),
    [data.leads]
  );

  const exportCsv = (rows) =>
    downloadBlob(new Blob([toCsv(leadRows(rows))], { type: "text/csv;charset=utf-8;" }), "leads-filtered.csv");

  const exportXlsx = (rows) => {
    const funnel = STAGES.map((s) => ({ Stage: s, Leads: d.stageCounts[s] }));
    const out = buildWorkbook({ leads: rows, weeks: d.periodWeeks, funnel });
    downloadBlob(
      new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      "dashboard-export.xlsx"
    );
  };

  const allUndated = data.leads.length > 0 && d.undated === data.leads.length;

  const contextLine = d.rangeActive
    ? `${d.range.label}: ${prettyDate(d.range.from)} to ${prettyDate(d.range.to)}`
    : `All time: ${prettyDate(d.bounds.min)} to ${prettyDate(d.bounds.max)}`;

  const viewProps = {
    d,
    allUndated,
    filters,
    setFilters,
    statuses,
    onExportCsv: exportCsv,
    onExportXlsx: exportXlsx,
    files: data.files,
    onFiles: data.importFiles,
    busy: data.busy,
    onClear: data.clearAll,
    hasData,
    setView,
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-canvas">
      <Sidebar
        view={view}
        setView={setView}
        footer={data.isSample ? "Showing sample data" : hasData ? `${data.files.length} file${data.files.length === 1 ? "" : "s"} loaded` : "No files loaded"}
      />

      <div className="flex flex-1 flex-col h-screen min-w-0 overflow-hidden">
        <header className="no-print shrink-0 z-20 flex flex-wrap items-center gap-3 border-b border-hairline bg-panel px-5 py-3 shadow-xs">
          <div className="md:hidden flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-r from-[#FA2E76] to-[#7B61FF] text-white shadow-xs shrink-0">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="36 10" />
                <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
                <circle cx="12" cy="12" r="2.2" fill="#FDE047" />
              </svg>
            </div>
            <span className="font-display text-base font-extrabold text-[#FA2E76] tracking-tight">OmniScope<span className="text-[#7B61FF]">.</span></span>
            <label className="sr-only" htmlFor="section">Section</label>
            <select id="section" className="field !py-1 text-xs" value={view} onChange={(e) => setView(e.target.value)}>
              {NAV.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
            </select>
          </div>
          <h1 className="hidden text-base font-semibold md:block">{NAV.find(([k]) => k === view)[1]}</h1>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <AccountMenu />
          </div>

          {hasData && (
            <DateRangeBar
              rangeKey={d.rangeKey} setRangeKey={d.setRangeKey}
              custom={d.custom} setCustom={d.setCustom}
              grain={d.grain} setGrain={d.setGrain}
              site={d.site} setSite={d.setSite}
              pipeline={d.pipeline} setPipeline={d.setPipeline}
              sites={d.sites.filter((s) => data.weeks.some((w) => w.site === s.id) || data.leads.some((l) => l.site === s.id))}
              pipelines={d.pipelines}
              undated={d.undated}
              includeUndated={d.includeUndated} setIncludeUndated={d.setIncludeUndated}
            />
          )}
        </header>

        <main className="flex-1 section-scroll section-snap-container p-5 focus:outline-none">
          {hasData && (
            <p className="mb-4 text-xs text-muted">
              {contextLine}
              {d.excludedByPeriod > 0 && ` · ${fmtInt(d.excludedByPeriod)} undated lead${d.excludedByPeriod === 1 ? "" : "s"} excluded`}
              {d.range.swapped && " · dates were the wrong way round, so they have been swapped"}
              {d.rangeKey === "custom" && !d.custom.from && !d.custom.to && " · pick two dates to narrow the view"}
              {d.site !== "All" && ` · ${d.site}`}
              {d.pipeline !== "All" && ` · ${d.pipeline} pipeline`}
              {data.isSample && " · sample data"}
            </p>
          )}

          {d.emptyReason && (
            <div className="mb-4 flex flex-wrap items-center gap-3 border border-hairline bg-panel px-5 py-3 text-sm">
              <span className="text-ink2">{d.emptyReason}</span>
              <button className="btn" onClick={() => d.setRangeKey("all")}>Show all time</button>
            </div>
          )}

          {data.problems.length > 0 && (
            <div role="alert" className="mb-4 border border-warn bg-[#FBF3EC] px-5 py-3 text-sm" style={{ color: "#6E4718" }}>
              {data.problems.map((p, i) => <div key={i}>{p}</div>)}
              <button className="mt-2 cursor-pointer border-none bg-transparent p-0 text-xs underline" onClick={data.dismissProblems}>
                Dismiss
              </button>
            </div>
          )}

          {!hasData ? (
            <div className="mx-auto max-w-5xl">
              <div className="mb-6"><Dropzone onFiles={data.importFiles} busy={data.busy} large /></div>
              <SampleSheetsSection />
            </div>
          ) : (
            <ErrorBoundary title="This view could not be displayed">
              <Suspense fallback={<p className="text-sm text-muted">Loading this view…</p>}>
                <ViewRouter view={view} {...viewProps} />
              </Suspense>
            </ErrorBoundary>
          )}
        </main>
      </div>
    </div>
  );
}

function Gate() {
  const { user, restoring } = useAuth();
  if (restoring) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted">Checking your session…</p>
      </div>
    );
  }
  if (!user) return <SignIn />;
  return (
    <DataProvider>
      <Dashboard />
    </DataProvider>
  );
}

export default function App() {
  return (
    <ErrorBoundary title="The dashboard could not start">
      <AuthProvider>
        <Gate />
      </AuthProvider>
    </ErrorBoundary>
  );
}
