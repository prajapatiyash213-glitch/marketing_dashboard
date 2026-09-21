import { STAGE_COLOR } from "../lib/stages.js";
import { fmtInt } from "../lib/numbers.js";

export function Panel({ title, note, right, children, className = "", bodyClass = "p-5" }) {
  return (
    <section className={`panel flex flex-col ${className}`}>
      {(title || right) && (
        <header className="flex flex-wrap items-baseline justify-between gap-3 border-b border-hair px-5 py-3">
          <div>
            {title && <h2 className="text-sm font-semibold text-ink">{title}</h2>}
            {note && <p className="mt-0.5 text-xs text-muted">{note}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={`flex-1 ${bodyClass}`}>{children}</div>
    </section>
  );
}

export function EmptyState({ children, height = 220 }) {
  return (
    <div className="flex items-center justify-center px-6 text-center" style={{ height }}>
      <p className="max-w-xs text-sm leading-relaxed text-muted">{children}</p>
    </div>
  );
}

export function Delta({ current, previous, suffix = "vs previous period" }) {
  if (previous === null || previous === undefined || !Number.isFinite(previous) || previous === 0) return null;
  const change = ((current - previous) / previous) * 100;
  const up = change >= 0;
  return (
    <span className="tnum text-xs" style={{ color: up ? "#2E7D5B" : "#A64B4B" }}>
      {up ? "▲" : "▼"} {Math.abs(change).toFixed(1)}% <span className="text-faint">{suffix}</span>
    </span>
  );
}

export function Kpi({ figure, label, detail, accent, delta }) {
  return (
    <div className="flex-1 px-5 py-4" style={{ minWidth: 190 }}>
      <div className="tnum font-display leading-none" style={{ fontSize: 32, color: accent, letterSpacing: "-0.01em" }}>
        {figure}
      </div>
      <div className="mt-2 text-sm font-medium text-ink">{label}</div>
      <div className="mt-0.5 text-xs leading-snug text-muted">{detail}</div>
      {delta && <div className="mt-1">{delta}</div>}
    </div>
  );
}

export function KpiBand({ children }) {
  const items = Array.isArray(children) ? children.filter(Boolean) : [children];
  return (
    <div className="panel mb-4 flex flex-wrap">
      {items.map((item, i) => (
        <div key={i} className="flex flex-1" style={{ minWidth: 190 }}>
          {i > 0 && <div className="w-px bg-hair" />}
          {item}
        </div>
      ))}
    </div>
  );
}

export function StagePill({ stage }) {
  const STAGE_BADGES = {
    "Discovery": "bg-purple-50 text-purple-600 border-purple-200",
    "Qualified": "bg-sky-50 text-sky-600 border-sky-200",
    "Proposal": "bg-pink-50 text-[#FA2E76] border-pink-200",
    "Closed Won": "bg-emerald-50 text-emerald-600 border-emerald-200",
    "Closed Lost": "bg-rose-50 text-rose-500 border-rose-200",
  };
  const badgeClass = STAGE_BADGES[stage] || "bg-slate-50 text-slate-600 border-slate-200";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${badgeClass}`}>
      {stage}
    </span>
  );
}

export function ChartTooltip({ active, payload, label, suffix = {} }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-slate-100 bg-white/95 p-3 text-xs shadow-card backdrop-blur-sm" style={{ minWidth: 150 }}>
      <div className="mb-1.5 font-bold text-slate-800">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="flex items-center justify-between gap-4 text-slate-600 py-0.5">
          <span className="flex items-center gap-1.5 font-medium">
            <span className="inline-block h-2 w-2 rounded-full" style={{ background: p.color || p.fill }} />
            {p.name}
          </span>
          <span className="tnum font-bold text-slate-900">
            {typeof p.value === "number" ? fmtInt(p.value) : p.value}{suffix[p.dataKey] || ""}
          </span>
        </div>
      ))}
    </div>
  );
}

export const CHART_SERIES = ["#7B61FF", "#FA2E76", "#FF9F43", "#00C2FF", "#10B981", "#6C5CE7", "#FF5252", "#94A3B8"];
export const AXIS = { fontSize: 11, fill: "#94A3B8" };
export const shortFile = (f) => String(f).replace(/\.(xlsx|xlsm|xls|csv)$/i, "");
