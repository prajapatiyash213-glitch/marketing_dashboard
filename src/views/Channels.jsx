import { Panel, EmptyState, Kpi, KpiBand } from "../components/primitives.jsx";
import { ModuleIcon, RankedBars } from "../components/visuals.jsx";
import { fmtInt, fmtMoneyCompact } from "../lib/numbers.js";
import { MODULES, CATEGORICAL } from "../lib/palette.js";
import { CHANNEL_SCHEMAS } from "../lib/channels.js";
import { prettyDate } from "../lib/dates.js";

/** What to put in a sheet to switch a module on. Shown when it is not connected. */
function DataContract({ module }) {
  const schema = CHANNEL_SCHEMAS[module];
  const m = MODULES[module];
  const required = schema.defs.filter(([f]) => schema.required.includes(f));
  const optional = schema.defs.filter(([f]) => !schema.required.includes(f));

  return (
    <div className="p-1">
      <p className="text-sm leading-relaxed text-ink2">
        This section switches on as soon as you drop a sheet with these columns. Header wording is matched loosely,
        so <em>Emails Sent</em>, <em>Sends</em> and <em>Volume</em> all work.
      </p>
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold" style={{ color: m.color }}>Required</p>
          <ul className="space-y-1.5">
            {required.map(([field, label, aliases]) => (
              <li key={field} className="text-sm">
                <span className="text-ink">{label}</span>
                <span className="ml-2 text-xs text-faint">{aliases.slice(0, 3).join(", ")}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-muted">Optional, but the panels get richer</p>
          <ul className="space-y-1.5">
            {optional.map(([field, label]) => (
              <li key={field} className="text-sm text-ink2">{label}</li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function ChannelPanel({ module, connected, children, note }) {
  const m = MODULES[module];
  return (
    <Panel
      title={
        <span className="flex items-center gap-2">
          <ModuleIcon module={module} size={14} />
          {m.label}
        </span>
      }
      note={note}
      className={connected ? "" : "opacity-95"}
    >
      {connected ? children : <DataContract module={module} />}
    </Panel>
  );
}

export function ChannelsView({ d, setView }) {
  const { emailStats: email, socialStats: social, landingStats: landing, costStats: cost } = d;

  return (
    <>
      {email && (
        <KpiBand>
          <Kpi figure={fmtInt(email.sent)} label="Emails sent" detail={`${email.campaigns} campaigns in this period`} accent={MODULES.email.color} />
          <Kpi figure={`${email.openRate?.toFixed(1)}%`} label="Open rate" detail={`${fmtInt(email.opens)} opens of ${fmtInt(email.delivered)} delivered`} />
          <Kpi figure={`${email.ctr?.toFixed(2)}%`} label="Click-through rate" detail={`${fmtInt(email.clicks)} clicks`} accent="#2D7DD2" />
          <Kpi figure={fmtInt(email.leads)} label="Leads generated"
            detail={email.costPerLead ? `${fmtMoneyCompact(email.costPerLead)} per lead` : `${email.clickToLead?.toFixed(1)}% of clicks became leads`} accent="#17A398" />
        </KpiBand>
      )}

      {/* Email Campaigns Dedicated Section Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-sky-100 bg-gradient-to-r from-sky-50/80 via-blue-50/40 to-slate-50 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-[#00C2FF] shrink-0 border border-sky-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
              <polyline points="22,6 12,13 2,6" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Email Marketing Campaigns
              {email && (
                <span className="ml-2 text-xs font-semibold text-[#00C2FF]">
                  ({email.campaigns} campaigns · {fmtInt(email.sent)} sent · {email.openRate?.toFixed(1)}% open rate · {fmtInt(email.leads)} leads)
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Full deliverability analytics, open rate breakdowns, CTR comparisons, and lead attribution per broadcast.
            </p>
          </div>
        </div>
        {setView && (
          <button
            type="button"
            onClick={() => setView("email")}
            className="btn !py-2 !px-4 !text-xs !font-bold text-[#00C2FF] hover:bg-sky-100 bg-white border border-sky-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            Open Email Campaigns &rarr;
          </button>
        )}
      </div>

      {/* Technology Costs Dedicated Shortcut Banner */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-violet-100 bg-gradient-to-r from-violet-50/80 via-purple-50/40 to-slate-50 p-4 shadow-subtle">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-[#6C5CE7] shrink-0 border border-violet-100">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
            </svg>
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Technology & Tool Costs
              {cost && (
                <span className="ml-2 text-xs font-semibold text-[#6C5CE7]">
                  ({cost.activeCount || cost.tools} active ·{" "}
                  {cost.factor !== 1
                    ? `₹${(cost.periodInrTotal || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} + $${(cost.periodUsdTotal || 0).toFixed(2)} USD`
                    : `₹${(cost.totalInrMonthly || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/mo + $${(cost.totalUsdMonthly || 0).toFixed(2)}/mo USD`}
                  )
                </span>
              )}
            </h4>
            <p className="text-xs text-slate-500 mt-0.5">
              Software subscriptions, licenses, department allocations, and renewal schedules are now in their own dedicated section.
            </p>
          </div>
        </div>
        {setView && (
          <button
            type="button"
            onClick={() => setView("costs")}
            className="btn !py-2 !px-4 !text-xs !font-bold text-[#6C5CE7] hover:bg-violet-100 bg-white border border-violet-200 transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            Open Technology Costs &rarr;
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ChannelPanel module="email" connected={Boolean(email)} note={email ? "Ranked by click-through rate" : "Not connected yet"}>
          {email && (
            <div className="scroll-thin overflow-auto" style={{ maxHeight: 340 }}>
              <table className="w-full min-w-[460px] border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline">
                    {["Campaign", "Sent", "Open", "CTR", "Leads"].map((h, i) => (
                      <th key={h} className="sticky top-0 bg-panel px-2 py-2 text-xs font-semibold text-muted"
                        style={{ textAlign: i ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {email.byCampaign.map((c) => (
                    <tr key={c.id} className="row-hover border-b border-hair">
                      <td className="px-2 py-2">
                        <div className="truncate text-ink">{c.campaign}</div>
                        {c.date && <div className="text-xs text-faint">{prettyDate(c.date)}</div>}
                      </td>
                      <td className="tnum px-2 py-2 text-right">{fmtInt(c.sent)}</td>
                      <td className="tnum px-2 py-2 text-right">{c.openRate != null ? `${c.openRate.toFixed(0)}%` : "—"}</td>
                      <td className="tnum px-2 py-2 text-right font-medium" style={{ color: MODULES.email.color }}>
                        {c.ctr != null ? `${c.ctr.toFixed(2)}%` : "—"}
                      </td>
                      <td className="tnum px-2 py-2 text-right">{fmtInt(c.leads)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChannelPanel>

        <ChannelPanel module="social" connected={Boolean(social)} note={social ? "Totals for the selected period" : "Not connected yet"}>
          {social && (
            <>
              <div className="mb-4 grid grid-cols-3 gap-3 border-b border-hair pb-4">
                {[
                  ["Impressions", fmtInt(social.impressions)],
                  ["Engagement", `${social.engagementRate?.toFixed(1)}%`],
                  ["Leads", fmtInt(social.leads)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-xs text-muted">{label}</div>
                    <div className="tnum font-display text-xl" style={{ color: MODULES.social.color }}>{value}</div>
                  </div>
                ))}
              </div>
              <RankedBars
                rows={social.platforms.map((p) => ({ name: p.platform, value: p.impressions }))}
                colorFor={(_, i) => CATEGORICAL[(i + 3) % CATEGORICAL.length]}
              />
              <p className="mt-4 text-xs text-muted">
                Bars are impressions. Engagement rate varies a lot between platforms, so compare each platform against
                its own past rather than against the others.
              </p>
            </>
          )}
        </ChannelPanel>

        <div className="lg:col-span-2">
          <ChannelPanel module="landing" connected={Boolean(landing)}
            note={landing ? `${fmtInt(landing.sessions)} sessions · ${landing.conversionRate?.toFixed(2)}% convert` : "Not connected yet"}>
            {landing && (
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-hairline">
                    {["Page", "Sessions", "Conversions", "Rate"].map((h, i) => (
                      <th key={h} className="px-2 py-2 text-xs font-semibold text-muted" style={{ textAlign: i ? "right" : "left" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {landing.pages.slice(0, 10).map((p) => (
                    <tr key={p.page} className="row-hover border-b border-hair">
                      <td className="px-2 py-2">
                        <div className="truncate text-ink">{p.page}</div>
                        {p.site && <div className="text-xs text-faint">{p.site}</div>}
                      </td>
                      <td className="tnum px-2 py-2 text-right">{fmtInt(p.sessions)}</td>
                      <td className="tnum px-2 py-2 text-right">{fmtInt(p.conversions)}</td>
                      <td className="tnum px-2 py-2 text-right font-medium" style={{ color: MODULES.landing.color }}>
                        {p.conversionRate != null ? `${p.conversionRate.toFixed(1)}%` : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </ChannelPanel>
        </div>
      </div>

      {!email && !social && !landing && (
        <Panel className="mt-4" title="Nothing to connect yet" note="These three marketing modules are built and waiting for data">
          <EmptyState height={120}>
            Each panel above lists the columns it needs. Drop a sheet with those columns and the panel fills in — no
            configuration, no code change.
          </EmptyState>
        </Panel>
      )}
    </>
  );
}
