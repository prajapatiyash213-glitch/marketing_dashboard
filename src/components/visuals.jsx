import { MODULES, directionColor, NEUTRAL } from "../lib/palette.js";
import { FUNNEL_COLORS } from "../lib/palette.js";
import { fmtInt, fmtMoneyCompact } from "../lib/numbers.js";
import { prettyDate } from "../lib/dates.js";

/** Inline trend line. Decorative support for a number, so it carries no axes. */
export function Sparkline({ values = [], color = NEUTRAL, width = 88, height = 26 }) {
  if (!values.length) return null;
  if (values.length === 1) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
        <circle cx={width - 4} cy={height / 2} r="2.5" fill={color} />
      </svg>
    );
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = width / (values.length - 1);
  const points = values.map((v, i) => `${(i * step).toFixed(1)},${(height - ((v - min) / span) * (height - 4) - 2).toFixed(1)}`);
  const id = `spark-${Math.random().toString(36).slice(2, 8)}`;
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${height} ${points.join(" ")} ${width},${height}`} fill={`url(#${id})`} />
      <polyline points={points.join(" ")} fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx={width} cy={points[points.length - 1].split(",")[1]} r="2.2" fill={color} />
    </svg>
  );
}

export function ModuleIcon({ module, size = 16 }) {
  const m = MODULES[module];
  if (!m) return null;
  return (
    <span className="flex items-center justify-center" style={{ width: size + 14, height: size + 14, background: m.tint }}>
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={m.color} strokeWidth="1.8"
        strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d={m.icon} />
      </svg>
    </span>
  );
}

/**
 * One card per subject area. When a module has no data it says what to drop in
 * rather than showing a zero, because a zero and "not connected" mean very
 * different things to someone reading a dashboard.
 */
export function ModuleTile({ module, headline, caption, spark, change, lowerIsBetter, connected = true, hint, onClick }) {
  const m = MODULES[module];
  const Wrapper = onClick ? "button" : "div";
  return (
    <Wrapper
      onClick={onClick}
      className={`panel flex flex-col gap-3 p-4 text-left ${onClick ? "cursor-pointer" : ""}`}
      style={{ borderTop: `3px solid ${connected ? m.color : "#D5DCE3"}`, width: "100%" }}
    >
      <div className="flex items-center gap-2.5">
        <ModuleIcon module={module} />
        <span className="text-sm font-medium text-ink">{m.label}</span>
      </div>

      {connected ? (
        <>
          <div className="flex items-end justify-between gap-2">
            <span className="tnum font-display leading-none" style={{ fontSize: 26, color: m.color }}>{headline}</span>
            {spark?.length > 1 && <Sparkline values={spark} color={m.color} />}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted">{caption}</span>
            {Number.isFinite(change) && change !== 0 && (
              <span className="tnum text-xs font-medium" style={{ color: directionColor(change, lowerIsBetter) }}>
                {change > 0 ? "▲" : "▼"} {Math.abs(change).toFixed(1)}%
              </span>
            )}
          </div>
        </>
      ) : (
        <div>
          <p className="font-display text-lg text-faint">Not connected</p>
          <p className="mt-1 text-xs leading-relaxed text-muted">{hint}</p>
        </div>
      )}
    </Wrapper>
  );
}

/**
 * The funnel as a flow rather than a bar chart: each stage is as wide as its
 * share, and the gap between stages states the drop-off in words. Reading a
 * stacked bar takes effort; reading "58% carried on" does not.
 */
export function FunnelFlow({ stages, total }) {
  if (!total) return null;
  const ordered = stages.filter((s) => s.stage !== "Closed Lost");
  const lost = stages.find((s) => s.stage === "Closed Lost");

  return (
    <div>
      <ol className="space-y-2.5">
        {ordered.map((s, i) => {
          const width = Math.max(6, (s.count / total) * 100);
          const prev = i > 0 ? ordered[i - 1].count : null;
          const carried = prev ? (s.count / prev) * 100 : null;
          return (
            <li key={s.stage}>
              {carried !== null && (
                <p className="mb-1.5 pl-1 text-xs text-muted">
                  ↓ <span className="font-medium" style={{ color: carried >= 50 ? "#17A398" : carried >= 25 ? "#F0A202" : "#D64550" }}>
                    {carried.toFixed(0)}%
                  </span> carried on from {ordered[i - 1].stage.toLowerCase()}
                </p>
              )}
              <div className="flex items-center gap-3">
                <div className="h-9 flex-1 bg-hair" style={{ maxWidth: "100%" }}>
                  <div className="flex h-9 items-center px-3 text-sm font-medium text-white"
                    style={{ width: `${width}%`, background: FUNNEL_COLORS[s.stage], minWidth: 92 }}>
                    {s.stage}
                  </div>
                </div>
                <div className="w-28 shrink-0 text-right">
                  <div className="tnum text-sm font-semibold text-ink">{fmtInt(s.count)}</div>
                  <div className="tnum text-xs text-muted">{s.share.toFixed(0)}% of all</div>
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      {lost && lost.count > 0 && (
        <p className="mt-4 border-t border-hair pt-3 text-xs text-muted">
          Separately, <span className="font-medium" style={{ color: FUNNEL_COLORS["Closed Lost"] }}>{fmtInt(lost.count)} leads</span> were
          closed lost ({lost.share.toFixed(0)}% of everything in this period). They are counted in the total but not in the flow above,
          because they left the funnel rather than moving down it.
        </p>
      )}
    </div>
  );
}

/**
 * Shows where each subject actually has data against the selected window, so an
 * empty chart is never a mystery.
 */
export function CoverageBar({ coverage, bounds, range }) {
  const entries = Object.entries(coverage).filter(([, v]) => v);
  if (!entries.length || !bounds.min) return null;
  const span = bounds.max - bounds.min || 1;
  const pos = (d) => ((d - bounds.min) / span) * 100;

  const LABELS = { leads: "Leads", web: "Website", email: "Email", social: "Social", landing: "Landing pages" };
  const COLORS = { leads: MODULES.pipeline.color, web: MODULES.web.color, email: MODULES.email.color, social: MODULES.social.color, landing: MODULES.landing.color };

  return (
    <div>
      <div className="space-y-2">
        {entries.map(([key, extent]) => (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-xs text-muted">{LABELS[key] || key}</span>
            <span className="relative h-2.5 flex-1 bg-hair">
              <span className="absolute h-2.5" style={{ left: `${pos(extent.min)}%`, width: `${Math.max(1, pos(extent.max) - pos(extent.min))}%`, background: COLORS[key] }} />
            </span>
          </div>
        ))}
      </div>

      {range.from && range.to && (
        <div className="mt-2 flex items-center gap-3">
          <span className="w-24 shrink-0 text-xs font-medium text-ink">Selected</span>
          <span className="relative h-2.5 flex-1">
            <span className="absolute h-2.5 border border-ink"
              style={{ left: `${Math.max(0, pos(range.from))}%`, width: `${Math.min(100, pos(range.to) - Math.max(0, pos(range.from))) || 1}%`, background: "rgba(16,30,43,0.08)" }} />
          </span>
        </div>
      )}

      <div className="mt-2 flex justify-between pl-27 text-xs text-faint">
        <span>{prettyDate(bounds.min)}</span>
        <span>{prettyDate(bounds.max)}</span>
      </div>
    </div>
  );
}

/** Horizontal ranked bars — clearer than a pie once there are more than a few rows. */
export function RankedBars({ rows, colorFor, format = fmtInt, unit = "" }) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.name}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="truncate text-ink2">{r.name}</span>
            <span className="tnum shrink-0 text-ink">{format(r.value)}{unit}</span>
          </div>
          <span className="block h-2 bg-hair">
            <span className="block h-2" style={{ width: `${(r.value / max) * 100}%`, background: colorFor(r.name, i) }} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export const money = fmtMoneyCompact;
