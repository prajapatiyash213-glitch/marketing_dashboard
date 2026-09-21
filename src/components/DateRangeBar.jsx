import { RANGE_PRESETS } from "../lib/dates.js";
import { siteById } from "../lib/segments.js";

/**
 * Period, site and pipeline in one strip. Everything on screen answers to these
 * three controls, so they stay pinned to the top rather than living in a panel.
 */
export function DateRangeBar({
  rangeKey, setRangeKey, custom, setCustom, grain, setGrain,
  site, setSite, pipeline, setPipeline,
  sites = [], pipelines = [], undated = 0, includeUndated, setIncludeUndated,
}) {
  const showUndatedToggle = undated > 0 && rangeKey !== "all";

  return (
    <div className="no-print w-full space-y-2.5 pt-1">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100/70 rounded-xl border border-slate-200/60" role="group" aria-label="Date range">
          {RANGE_PRESETS.map(({ key, label }) => {
            const on = rangeKey === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={on}
                className={`text-xs px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
                  on
                    ? "bg-gradient-to-r from-[#FA2E76] to-[#E91E63] text-white shadow-sm font-semibold"
                    : "text-slate-600 hover:text-slate-900 hover:bg-white/80"
                }`}
                onClick={() => setRangeKey(key)}
              >
                {label}
              </button>
            );
          })}
        </div>

        {rangeKey === "custom" && (
          <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-sm">
            <label className="sr-only" htmlFor="from">From</label>
            <input id="from" type="date" className="text-xs text-slate-700 bg-transparent outline-none cursor-pointer" value={custom.from}
              onChange={(e) => setCustom({ ...custom, from: e.target.value })} />
            <span className="text-xs text-slate-400 font-medium">to</span>
            <label className="sr-only" htmlFor="to">To</label>
            <input id="to" type="date" className="text-xs text-slate-700 bg-transparent outline-none cursor-pointer" value={custom.to}
              onChange={(e) => setCustom({ ...custom, to: e.target.value })} />
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <label className="text-xs font-medium text-slate-400" htmlFor="grain">Group by</label>
          <select id="grain" className="field !py-1.5 !px-3 !text-xs !rounded-xl font-medium" value={grain} onChange={(e) => setGrain(e.target.value)}>
            <option value="day">Day</option>
            <option value="week">Week</option>
            <option value="month">Month</option>
            <option value="quarter">Quarter</option>
            <option value="year">Year</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 pt-0.5">
        {sites.length > 1 && (
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-slate-100/70 rounded-xl border border-slate-200/60">
            <span className="px-2 text-xs font-semibold text-slate-400">Site:</span>
            <button className={`text-xs px-3 py-1 rounded-lg font-medium transition-all cursor-pointer ${site === "All" ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setSite("All")}>All</button>
            {sites.map((s) => {
              const on = site === s.id;
              return (
                <button key={s.id} className={`text-xs px-3 py-1 rounded-lg font-medium transition-all cursor-pointer flex items-center gap-1.5 ${on ? "bg-white text-slate-900 shadow-sm font-semibold" : "text-slate-500 hover:text-slate-800"}`} onClick={() => setSite(s.id)}>
                  <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                  {siteById(s.id).label}
                </button>
              );
            })}
          </div>
        )}

        {pipelines.length > 1 && (
          <div className="flex items-center gap-2 bg-slate-100/70 px-3 py-1 rounded-xl border border-slate-200/60">
            <label className="text-xs font-semibold text-slate-400" htmlFor="pipeline">Pipeline:</label>
            <select id="pipeline" className="text-xs font-medium text-slate-700 bg-transparent outline-none cursor-pointer" value={pipeline} onChange={(e) => setPipeline(e.target.value)}>
              <option value="All">All pipelines</option>
              {pipelines.map((p) => <option key={p.name} value={p.name}>{p.name} ({p.count})</option>)}
            </select>
          </div>
        )}

        {showUndatedToggle && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-xs text-slate-500 hover:text-slate-700 font-medium">
            <input type="checkbox" className="rounded text-[#FA2E76] focus:ring-[#FA2E76]" checked={includeUndated} onChange={(e) => setIncludeUndated(e.target.checked)} />
            Include {undated} undated lead{undated === 1 ? "" : "s"}
          </label>
        )}
      </div>
    </div>
  );
}
