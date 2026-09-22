import { Panel, EmptyState, Kpi, KpiBand, Delta, StagePill } from "../components/primitives.jsx";
import { FunnelPanel, SourcePanel, LeadTrendPanel } from "./charts.jsx";
import { LeadTable } from "../components/LeadTable.jsx";
import { Dropzone } from "../components/Dropzone.jsx";
import { SampleSheetsSection } from "../components/SampleSheetsSection.jsx";
import { fmtInt, fmtMoneyCompact, pct } from "../lib/numbers.js";
import { STAGES } from "../lib/stages.js";
import { FUNNEL_COLORS } from "../lib/palette.js";
import { FIELD_LABELS } from "../lib/fieldMap.js";

export function KpiRow({ d }) {
  return (
    <KpiBand>
      <Kpi
        figure={fmtInt(d.periodLeads.length)}
        label="Leads in this period"
        detail={d.pipelineValue ? `${fmtMoneyCompact(d.pipelineValue)} of recorded value` : "No value column found"}
        delta={d.previousLeads ? <Delta current={d.periodLeads.length} previous={d.previousLeads.length} /> : null}
      />
      <Kpi
        figure={`${d.conversion.toFixed(1)}%`}
        label="Moved past discovery"
        detail={`${fmtInt(d.advanced)} qualified, in proposal or won`}
        accent="#0E5A63"
        delta={d.previousConversion != null ? <Delta current={d.conversion} previous={d.previousConversion} /> : null}
      />
      <Kpi
        figure={d.topSource ? d.topSource.name : "—"}
        label="Strongest channel"
        detail={d.topSource
          ? `${fmtInt(d.topSource.value)} leads · ${pct(d.topSource.value, d.periodLeads.length, 0)}% of the period`
          : "Add a source column to see this"}
      />
      <Kpi
        figure={d.seo.peak.views ? fmtInt(d.seo.peak.views) : "—"}
        label="Peak weekly views"
        detail={d.seo.views
          ? `Week of ${d.seo.peak.label} · ${d.seo.efficiency.toFixed(2)}% of visits became leads`
          : "Load the SEO matrix to see traffic"}
        accent="#C0863A"
        delta={d.seo.previousViews ? <Delta current={d.seo.views} previous={d.seo.previousViews} /> : null}
      />
    </KpiBand>
  );
}

export function PipelineView({ d, allUndated }) {
  return (
    <>
      <KpiRow d={d} />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <FunnelPanel data={d.funnelByPipeline} fileNames={d.pipelineBreakdown.map((p) => p.name)} empty={!d.periodLeads.length} />
        <Panel title="Stage breakdown" note={`Recorded value by stage · ${d.range.label}`}>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-hairline">
                {["Stage", "Leads", "Share", "Value"].map((h, i) => (
                  <th key={h} className="px-2 py-2 text-xs font-semibold text-muted" style={{ textAlign: i ? "right" : "left" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {STAGES.map((s) => {
                const rows = d.periodLeads.filter((l) => l.stage === s);
                const value = rows.reduce((a, l) => a + (l.value || 0), 0);
                const share = d.periodLeads.length ? (rows.length / d.periodLeads.length) * 100 : 0;
                return (
                  <tr key={s} className="border-b border-hair">
                    <td className="px-2 py-2.5"><StagePill stage={s} /></td>
                    <td className="tnum px-2 py-2.5 text-right">{fmtInt(rows.length)}</td>
                    <td className="px-2 py-2.5">
                      <div className="flex items-center justify-end gap-2">
                        <span className="tnum text-xs text-muted">{share.toFixed(0)}%</span>
                        <span className="inline-block h-1.5 w-[70px] bg-hair">
                          <span className="block h-1.5" style={{ width: `${share}%`, background: FUNNEL_COLORS[s] }} />
                        </span>
                      </div>
                    </td>
                    <td className={`tnum px-2 py-2.5 text-right ${value ? "text-ink" : "text-faint"}`}>
                      {value ? fmtMoneyCompact(value) : "—"}
                    </td>
                  </tr>
                );
              })}
              <tr>
                <td className="px-2 py-2.5 text-sm font-semibold">Closed won value</td>
                <td colSpan={2} />
                <td className="tnum px-2 py-2.5 text-right font-semibold text-won">
                  {d.wonValue ? fmtMoneyCompact(d.wonValue) : "—"}
                </td>
              </tr>
            </tbody>
          </table>
        </Panel>
      </div>
      <div className="mt-4">
        <LeadTrendPanel data={d.leadTrend} grainWord={d.grainWord} allUndated={allUndated} />
      </div>
    </>
  );
}

export function LeadsView({ d, filters, setFilters, statuses, onExportCsv, onExportXlsx }) {
  return (
    <Panel
      title="Every lead, in one table"
      note={`${fmtInt(d.periodLeads.length)} rows in ${d.range.label.toLowerCase()}`}
      bodyClass="p-5 overflow-x-auto"
    >
      <LeadTable
        leads={d.periodLeads}
        fileNames={d.fileNames}
        statuses={statuses}
        filters={filters}
        setFilters={setFilters}
        onExportCsv={onExportCsv}
        onExportXlsx={onExportXlsx}
      />
    </Panel>
  );
}

/** Shows which column was chosen for each field, flagging the guesses. */
function MappingSummary({ mapping }) {
  if (!mapping || !mapping.map) return null;
  const entries = Object.entries(mapping.map);
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
      {entries.map(([field, info]) => {
        if (!info) return null;
        const label = FIELD_LABELS[field] || (field.charAt(0).toUpperCase() + field.slice(1));
        return (
          <span key={field} className={info.confidence === "guess" ? "text-warn" : "text-muted"}>
            {label} → <span className="text-ink2">{info.header || "—"}</span>
            {info.confidence === "guess" && " (guess)"}
          </span>
        );
      })}
      {mapping.undated > 0 && <span className="text-warn">{mapping.undated} rows without a readable date</span>}
      {mapping.map?.date && mapping.dayFirst && !mapping.dayFirst.certain && (
        <span className="text-warn">dates read as day-first — check if this sheet is US-formatted</span>
      )}
    </div>
  );
}

export function SourcesView({ files, onFiles, busy, onClear, hasData }) {
  return (
    <>
      <SampleSheetsSection />

      <Panel
        title="Files in this session"
        note="Nothing is uploaded — parsing happens in your browser"
        right={<button className="btn" onClick={onClear} disabled={!hasData}>Clear all</button>}
      >
      {!files.length ? <EmptyState height={120}>No files loaded yet.</EmptyState> : (
        <ul className="space-y-3">
          {files.map((f) => (
            <li key={f.name} className="border-b border-hair pb-3">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-block h-1.5 w-1.5" style={{ background: f.seoCount ? "#C0863A" : "#0E5A63" }} />
                    {f.name}
                  </div>
                  <div className="mt-1 text-xs text-muted">
                    {f.sheets.map((s) => {
                      if (s.kind === "seo") return `${s.sheet} — ${fmtInt(s.count)} weeks`;
                      if (s.kind === "leads") return `${s.sheet} — ${fmtInt(s.count)} leads`;
                      if (s.label) return `${s.sheet} — ${fmtInt(s.count)} rows, read as ${s.label.toLowerCase()}`;
                      return `${s.sheet} — not recognised`;
                    }).join(" · ")}
                  </div>
                </div>
                <div className="tnum text-sm text-ink2">
                  {f.seoCount ? `${f.seoCount} weeks` : f.leadCount ? `${fmtInt(f.leadCount)} leads` : `${fmtInt(f.channelCount || 0)} rows`}
                </div>
              </div>
              {f.sheets.filter((s) => s.mapping).map((s) => <MappingSummary key={s.sheet} mapping={s.mapping} />)}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-4"><Dropzone onFiles={onFiles} busy={busy} /></div>

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Sheets are matched by their contents, not their names. A sheet with three or more week columns is read as the
        SEO matrix; anything with a name, company or email column is read as leads. Re-dropping a file replaces its
        rows instead of duplicating them. Fields marked <span className="text-warn">(guess)</span> were matched on a
        partial header and are worth a look before anyone quotes the numbers.
      </p>
    </Panel>
    </>
  );
}
