import { useMemo, useState, useCallback } from "react";
import { FixedSizeList } from "react-window";
import { StagePill, EmptyState } from "./primitives.jsx";
import { fmtInt } from "../lib/numbers.js";
import { STAGES } from "../lib/stages.js";
import { shortFile } from "./primitives.jsx";
import { prettyDate } from "../lib/dates.js";

function formatLeadDate(lead) {
  if (!lead) return "—";
  const currentYear = new Date().getUTCFullYear();
  const isWebsiteVisitors = /website\s*visitors/i.test(lead.file || "") || /website\s*visitors/i.test(lead.sheet || "");
  const isWebsiteTabNoYear = /leads?\s*sheet/i.test(lead.file || "") && /website/i.test(lead.sheet || "") && lead.hasYear === false;
  const hasNoExplicitYear = lead.hasYear === false || isWebsiteVisitors || isWebsiteTabNoYear;

  if (hasNoExplicitYear) {
    if (lead.date) return prettyDate(lead.date, { withYear: false });
    if (lead.dateText) return lead.dateText.replace(/\s+\b(?:19|20)\d{2}\b/g, "").trim();
  }

  if (lead.date && lead.date.getUTCFullYear() > currentYear) {
    const fixedDate = new Date(Date.UTC(currentYear, lead.date.getUTCMonth(), lead.date.getUTCDate()));
    return prettyDate(fixedDate, { withYear: true });
  }
  if (lead.dateText && /\b202[7-9]\b/.test(lead.dateText)) {
    return lead.dateText.replace(/\b202[7-9]\b/, String(currentYear));
  }

  return lead.dateText || (lead.date ? prettyDate(lead.date) : "no date");
}

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
export function LeadTable({ leads, fileNames, statuses, filters, setFilters, onExportCsv, onExportXlsx, onRemoveDuplicates }) {
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

  const getLeadKey = useCallback((l) => {
    const em = (l.email || "").toLowerCase().trim();
    if (em && em.includes("@") && !["na", "n/a", "-"].includes(em)) return `email:${em}`;
    const nm = (l.name || "").toLowerCase().trim();
    const co = (l.company || "").toLowerCase().trim();
    if (nm && co && nm !== "na" && co !== "na" && nm !== "-" && co !== "-") {
      return `name:${nm}::${co}`;
    }
    return null;
  }, []);

  const { duplicateKeys, firstOccurrenceIds, duplicateCount, uniqueCount } = useMemo(() => {
    const counts = new Map();
    const firstIds = new Set();
    const dupKeys = new Set();

    for (const l of leads) {
      const key = getLeadKey(l);
      if (key) {
        const leadId = l.id || `${l.file}::${l.name}::${l.email}`;
        if (!counts.has(key)) {
          counts.set(key, 1);
          firstIds.add(leadId);
        } else {
          counts.set(key, counts.get(key) + 1);
          dupKeys.add(key);
        }
      }
    }

    let dupsCount = 0;
    for (const l of leads) {
      const key = getLeadKey(l);
      if (key && dupKeys.has(key)) {
        dupsCount++;
      }
    }

    const unique = leads.length - dupsCount + dupKeys.size;
    return { duplicateKeys: dupKeys, firstOccurrenceIds: firstIds, duplicateCount: dupsCount, uniqueCount: unique };
  }, [leads, getLeadKey]);

  const rows = useMemo(() => {
    const q = filters.query.trim().toLowerCase();
    const dupFilter = filters.duplicates || "All";
    const out = leads.filter((l) => {
      if (filters.file !== "All" && l.file !== filters.file) return false;
      if (filters.stage !== "All" && l.stage !== filters.stage) return false;
      if (filters.status !== "All" && l.status !== filters.status) return false;
      if (q && !`${l.name} ${l.company} ${l.title} ${l.email}`.toLowerCase().includes(q)) return false;

      const key = getLeadKey(l);
      const isDup = key && duplicateKeys.has(key);
      const leadId = l.id || `${l.file}::${l.name}::${l.email}`;
      const isFirst = firstOccurrenceIds.has(leadId);

      if (dupFilter === "Unique" && isDup && !isFirst) return false;
      if (dupFilter === "Duplicates" && !isDup) return false;
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
  }, [leads, filters, sort, getLeadKey, duplicateKeys, firstOccurrenceIds]);

  const toggleSort = useCallback((key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  }, []);

  const filtersActive = filters.file !== "All" || filters.stage !== "All" || filters.status !== "All" || filters.query || (filters.duplicates && filters.duplicates !== "All");

  const Row = ({ index, style }) => {
    const l = rows[index];
    const key = getLeadKey(l);
    const isDup = key && duplicateKeys.has(key);

    return (
      <div style={style} className="row-hover flex items-center border-b border-hair px-3 text-sm" role="row">
        <div style={{ width: columns[0].width }} className="min-w-0 pr-3">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="truncate text-ink font-semibold">{l.name}</span>
            {isDup && (
              <span
                title="Duplicate entry detected in dataset"
                className="inline-flex items-center px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 rounded border border-amber-200/80 shrink-0"
              >
                Duplicate
              </span>
            )}
          </div>
          {l.title && <div className="truncate text-xs text-faint">{l.title}</div>}
        </div>
        <div style={{ width: columns[1].width }} className="truncate pr-3 text-ink2">{l.company}</div>
        <div style={{ width: columns[2].width }} className="pr-3"><StagePill stage={l.stage} /></div>
        <div style={{ width: columns[3].width }} className="truncate pr-3 text-ink2">{l.source}</div>
        <div style={{ width: columns[4].width }} className="truncate pr-3 text-ink2">{l.status}</div>
        <div style={{ width: columns[5].width }} className={`pr-3 text-xs ${l.date ? "text-ink2" : "text-faint"}`}>
          {formatLeadDate(l)}
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

        <label className="sr-only" htmlFor="f-dups">Filter duplicates</label>
        <select
          id="f-dups"
          className="field font-medium text-slate-700"
          value={filters.duplicates || "All"}
          onChange={(e) => setFilters({ ...filters, duplicates: e.target.value })}
        >
          <option value="All">All Leads ({leads.length})</option>
          <option value="Unique">Unique Only ({uniqueCount})</option>
          <option value="Duplicates">Duplicates Only ({duplicateCount})</option>
        </select>

        {duplicateCount > 0 && (
          <div className="inline-flex items-center gap-2 px-2.5 py-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200/80 rounded-lg">
            <span>⚠️</span>
            <span>{duplicateCount} duplicate entries</span>
            {onRemoveDuplicates && (
              <button
                type="button"
                onClick={onRemoveDuplicates}
                className="px-2 py-0.5 text-[10px] font-bold text-white bg-amber-600 hover:bg-amber-700 rounded shadow-xs cursor-pointer transition-colors"
                title="Permanently remove all duplicate entries from dataset"
              >
                Remove Duplicates
              </button>
            )}
          </div>
        )}

        {filtersActive && (
          <button className="btn border-none bg-transparent text-accent"
            onClick={() => setFilters({ file: "All", stage: "All", status: "All", query: "", duplicates: "All" })}>
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
