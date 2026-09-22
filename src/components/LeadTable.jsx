import { useMemo, useState, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { StagePill, EmptyState } from "./primitives.jsx";
import { fmtInt } from "../lib/numbers.js";
import { STAGES } from "../lib/stages.js";
import { shortFile } from "./primitives.jsx";

const COLUMNS = [
  { key: "name", label: "Lead", width: "20%" },
  { key: "company", label: "Company", width: "20%" },
  { key: "stage", label: "Stage", width: "12%" },
  { key: "source", label: "Source", width: "13%" },
  { key: "status", label: "Status", width: "13%" },
  { key: "date", label: "Date", width: "10%" },
  { key: "value", label: "Value", width: "10%", align: "right" },
];

const ROW_HEIGHT = 46;

/**
 * Virtualised: a 60,000 row import renders the same handful of nodes as a 60 row
 * one. Sorting and filtering stay in the parent so exports match what is shown.
 */
export function LeadTable({ leads, fileNames, statuses, filters, setFilters, onExportCsv, onExportXlsx }) {
  const [sort, setSort] = useState({ key: "date", dir: "desc" });

  const hasValue = useMemo(() => leads.some((l) => l.value != null && Number.isFinite(l.value) && l.value > 0), [leads]);
  const columns = useMemo(() => {
    if (hasValue) return COLUMNS;
    return [
      { key: "name", label: "Lead", width: "24%" },
      { key: "company", label: "Company", width: "24%" },
      { key: "stage", label: "Stage", width: "13%" },
      { key: "source", label: "Source", width: "14%" },
      { key: "status", label: "Status", width: "13%" },
      { key: "date", label: "Date", width: "12%" },
    ];
  }, [hasValue]);

  const rows = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const out = leads.filter((l) => {
      if (filters.file !== "All" && l.file !== filters.file) return false;
      if (filters.stage !== "All" && l.stage !== filters.stage) return false;
      if (filters.status !== "All" && l.status !== filters.status) return false;
      if (q && !`${l.name} ${l.company} ${l.title} ${l.email}`.toLowerCase().includes(q)) return false;
      return true;
    });
    const { key, dir } = sort;
    out.sort((a, b) => {
      let cmp;
      if (key === "date") cmp = (a.date?.getTime() || 0) - (b.date?.getTime() || 0);
      else if (typeof a[key] === "number" && typeof b[key] === "number") cmp = a[key] - b[key];
      else cmp = String(a[key]).localeCompare(String(b[key]));
      return dir === "asc" ? cmp : -cmp;
    });
    return out;
  }, [leads, filters, sort]);

  const toggleSort = useCallback((key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }, []);

  const filtersActive = filters.file !== "All" || filters.stage !== "All" || filters.status !== "All" || filters.query;

  const Row = ({ index, style }) => {
    const l = rows[index];
    return (
      <div style={style} className="row-hover flex items-center border-b border-hair px-3 text-sm" role="row">
        <div style={{ width: columns[0].width }} className="min-w-0 pr-3">
          <div className="truncate text-ink">{l.name}</div>
          {l.title && <div className="truncate text-xs text-faint">{l.title}</div>}
        </div>
        <div style={{ width: columns[1].width }} className="truncate pr-3 text-ink2">{l.company}</div>
        <div style={{ width: columns[2].width }} className="pr-3"><StagePill stage={l.stage} /></div>
        <div style={{ width: columns[3].width }} className="truncate pr-3 text-ink2">{l.source}</div>
        <div style={{ width: columns[4].width }} className="truncate pr-3 text-ink2">{l.status}</div>
        <div style={{ width: columns[5].width }} className={`pr-3 text-xs ${l.date ? "text-ink2" : "text-faint"}`}>
          {l.dateText || "no date"}
        </div>
        {hasValue && (
          <div style={{ width: columns[6].width }} className={`tnum text-right ${l.value ? "text-ink" : "text-faint"}`}>
            {l.value ? fmtInt(l.value) : "—"}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      <div className="no-print mb-4 flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="q">Search leads</label>
        <input id="q" className="field min-w-[190px] flex-1" placeholder="Search a company or a person"
          value={filters.query} onChange={(e) => setFilters({ ...filters, query: e.target.value })} />
        <label className="sr-only" htmlFor="f-file">Filter by file</label>
        <select id="f-file" className="field" value={filters.file} onChange={(e) => setFilters({ ...filters, file: e.target.value })}>
          <option value="All">All files</option>
          {fileNames.map((f) => <option key={f} value={f}>{shortFile(f)}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-stage">Filter by stage</label>
        <select id="f-stage" className="field" value={filters.stage} onChange={(e) => setFilters({ ...filters, stage: e.target.value })}>
          <option value="All">All stages</option>
          {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <label className="sr-only" htmlFor="f-status">Filter by status</label>
        <select id="f-status" className="field" value={filters.status} onChange={(e) => setFilters({ ...filters, status: e.target.value })}>
          <option value="All">All statuses</option>
          {statuses.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {filtersActive && (
          <button className="btn border-none bg-transparent text-accent"
            onClick={() => setFilters({ file: "All", stage: "All", status: "All", query: "" })}>
            Reset filters
          </button>
        )}
        <div className="ml-auto flex gap-2">
          <button className="btn" onClick={() => onExportCsv(rows)} disabled={!rows.length}>Export CSV</button>
          <button className="btn btn-primary" onClick={() => onExportXlsx(rows)} disabled={!rows.length}>Export Excel</button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState>Nothing matches those filters. Widen the period or reset the filters to see the full list.</EmptyState>
      ) : (
        <div className="min-w-[860px] rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
          <div className="flex items-center bg-[#1E293B] px-3 py-2.5 text-[11px] uppercase tracking-wider font-bold" role="row">
            {columns.map((c) => (
              <div key={c.key} style={{ width: c.width }} className={c.align === "right" ? "text-right" : ""}>
                <button
                  className="text-[11px] font-bold tracking-wider uppercase transition-colors"
                  style={{ color: sort.key === c.key ? "#FA2E76" : "#E2E8F0" }}
                  onClick={() => toggleSort(c.key)}
                  aria-sort={sort.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}
                >
                  {c.label}{sort.key === c.key ? (sort.dir === "asc" ? " ↑" : " ↓") : ""}
                </button>
              </div>
            ))}
          </div>
          <FixedSizeList
            height={Math.min(560, Math.max(ROW_HEIGHT * 4, rows.length * ROW_HEIGHT))}
            itemCount={rows.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            className="scroll-thin"
          >
            {Row}
          </FixedSizeList>
          <div className="bg-slate-50 border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
            {fmtInt(rows.length)} rows · scroll inside the table
          </div>
        </div>
      )}
    </>
  );
}
