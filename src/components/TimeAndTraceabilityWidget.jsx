import { useState, useMemo } from "react";

export function TimeAndTraceabilityWidget({ d }) {
  // Target can default to 100 as shown in the mockup, with ability to tune if desired
  const [targetLeads, setTargetLeads] = useState(100);
  // Achieved leads default to 12 as shown in mockup, or dynamic from actual qualified leads if available
  const [useLivePipeline, setUseLivePipeline] = useState(false);
  const [manualAchieved, setManualAchieved] = useState(12);
  const [isEditing, setIsEditing] = useState(false);

  // Live qualified leads from pipeline: d.advanced represents qualified, in proposal or won
  const liveAchieved = d?.advanced || 12;
  const achieved = useLivePipeline ? liveAchieved : manualAchieved;

  const target = Math.max(1, targetLeads);
  const remaining = Math.max(0, target - achieved);
  const achievementPct = Math.min(100, Math.round((achieved / target) * 100));
  
  // Total months: Oct 2026 to Mar 2027 = 6 months
  const totalMonths = 6;
  const requiredMonthlyAvg = (remaining / totalMonths).toFixed(1);

  // Distribution for the 6 months (Oct 2026 to Mar 2027)
  const monthlyPlan = useMemo(() => {
    // Distribute so lower targets come first, higher targets later (e.g. 88 leads -> Oct: 14, Nov: 14, rest 15)
    const base = Math.floor(remaining / totalMonths);
    const extra = remaining % totalMonths;
    const lowerCount = totalMonths - extra;
    const months = [
      { name: "October", year: "2026", color: "blue", bg: "bg-blue-50/60", border: "border-blue-100", text: "text-blue-600", valText: "text-blue-700" },
      { name: "November", year: "2026", color: "emerald", bg: "bg-emerald-50/60", border: "border-emerald-100", text: "text-emerald-600", valText: "text-emerald-700" },
      { name: "December", year: "2026", color: "amber", bg: "bg-amber-50/60", border: "border-amber-100", text: "text-amber-600", valText: "text-amber-700" },
      { name: "January", year: "2027", color: "purple", bg: "bg-purple-50/60", border: "border-purple-100", text: "text-purple-600", valText: "text-purple-700" },
      { name: "February", year: "2027", color: "rose", bg: "bg-rose-50/60", border: "border-rose-100", text: "text-rose-600", valText: "text-rose-700" },
      { name: "March", year: "2027", color: "cyan", bg: "bg-cyan-50/60", border: "border-cyan-100", text: "text-cyan-600", valText: "text-cyan-700" },
    ];
    return months.map((m, idx) => ({
      ...m,
      target: idx < lowerCount ? base : base + 1,
    }));
  }, [remaining, totalMonths]);

  return (
    <section className="mb-6 rounded-3xl border border-blue-100/80 bg-gradient-to-b from-[#F3F8FF] via-[#F8FBFF] to-white p-5 sm:p-6 shadow-sm">
      {/* 1. Header with Title & Target Deadline */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-2 rounded-full bg-gradient-to-b from-blue-600 to-indigo-600 shrink-0 shadow-sm" />
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Time &amp; Traceability
              </h2>
              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
                title="Configure target and values"
              >
                {isEditing ? "Done" : "Customize Target"}
              </button>
            </div>
            <p className="text-sm font-medium text-slate-500">
              Qualified Lead Target Calculator
            </p>
          </div>
        </div>

        {/* Target Deadline Badge & 3D Illustration */}
        <div className="flex items-center gap-3.5 self-start sm:self-auto">
          <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-white/90 px-4 py-2.5 shadow-sm backdrop-blur-sm">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <div>
              <span className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                Target Deadline
              </span>
              <span className="block font-display text-base font-extrabold text-slate-900">
                31 March 2027
              </span>
            </div>
          </div>

          {/* Stylized 3D Target & Calendar Graphic */}
          <div className="hidden lg:flex items-center justify-center shrink-0 h-16 w-24">
            <svg width="90" height="60" viewBox="0 0 100 66" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="calGrad" x1="0" y1="0" x2="50" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#FFFFFF" />
                  <stop offset="1" stopColor="#E2E8F0" />
                </linearGradient>
                <linearGradient id="targetGrad" x1="50" y1="10" x2="90" y2="50" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#2563EB" />
                  <stop offset="1" stopColor="#1D4ED8" />
                </linearGradient>
                <linearGradient id="arrowGrad" x1="80" y1="0" x2="60" y2="25" gradientUnits="userSpaceOnUse">
                  <stop stopColor="#F43F5E" />
                  <stop offset="1" stopColor="#BE123C" />
                </linearGradient>
                <filter id="shadow3d" x="0" y="0" width="100" height="66" filterUnits="userSpaceOnUse">
                  <feDropShadow dx="1" dy="3" stdDeviation="3" floodColor="#0F172A" floodOpacity="0.12" />
                </filter>
              </defs>
              <g filter="url(#shadow3d)">
                {/* Calendar Back */}
                <rect x="12" y="14" width="46" height="42" rx="7" fill="url(#calGrad)" stroke="#CBD5E1" strokeWidth="1.5" />
                <rect x="12" y="14" width="46" height="12" rx="7" fill="#3B82F6" />
                {/* Spiral binders */}
                <rect x="20" y="9" width="3.5" height="9" rx="1.5" fill="#94A3B8" />
                <rect x="32" y="9" width="3.5" height="9" rx="1.5" fill="#94A3B8" />
                <rect x="44" y="9" width="3.5" height="9" rx="1.5" fill="#94A3B8" />
                {/* Calendar dots */}
                <circle cx="22" cy="36" r="2.2" fill="#93C5FD" />
                <circle cx="35" cy="36" r="2.2" fill="#93C5FD" />
                <circle cx="47" cy="36" r="2.2" fill="#93C5FD" />
                <circle cx="22" cy="46" r="2.2" fill="#93C5FD" />
                <circle cx="35" cy="46" r="2.2" fill="#3B82F6" />
                <circle cx="47" cy="46" r="2.2" fill="#93C5FD" />

                {/* 3D Dartboard / Target */}
                <ellipse cx="74" cy="32" rx="18" ry="18" fill="url(#targetGrad)" />
                <ellipse cx="74" cy="32" rx="13" ry="13" fill="#FFFFFF" />
                <ellipse cx="74" cy="32" rx="8" ry="8" fill="#EF4444" />
                <ellipse cx="74" cy="32" rx="3.5" ry="3.5" fill="#FFFFFF" />

                {/* Dart Arrow */}
                <path d="M94 12L76 29" stroke="url(#arrowGrad)" strokeWidth="3.5" strokeLinecap="round" />
                <polygon points="94,12 88,14 91,20" fill="#EF4444" />
                <polygon points="94,12 96,18 90,15" fill="#F87171" />
              </g>
            </svg>
          </div>
        </div>
      </div>

      {/* Target Config Collapsible Panel */}
      {isEditing && (
        <div className="mb-6 rounded-2xl border border-blue-200 bg-white p-4 shadow-sm animate-in fade-in duration-200">
          <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700">
            <label className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Target Leads:</span>
              <input
                type="number"
                min="1"
                value={targetLeads}
                onChange={(e) => setTargetLeads(Number(e.target.value) || 1)}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center font-bold text-slate-800"
              />
            </label>

            <label className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Achieved Leads:</span>
              <input
                type="number"
                min="0"
                value={manualAchieved}
                disabled={useLivePipeline}
                onChange={(e) => setManualAchieved(Number(e.target.value) || 0)}
                className="w-20 rounded-lg border border-slate-200 px-2 py-1 text-center font-bold text-slate-800 disabled:opacity-50"
              />
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={useLivePipeline}
                onChange={(e) => setUseLivePipeline(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Auto-sync from live Pipeline qualified ({liveAchieved} leads)</span>
            </label>

            <button
              type="button"
              onClick={() => { setTargetLeads(100); setManualAchieved(12); setUseLivePipeline(false); }}
              className="ml-auto text-xs text-slate-400 hover:text-slate-600 underline"
            >
              Reset to Mockup Default (100 / 12)
            </button>
          </div>
        </div>
      )}

      {/* 2. Top Row: 5 KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5 mb-5">
        {/* Card 1: Total Qualified Lead Target */}
        <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-[#EBF3FF] via-white to-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-blue-600 shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="6" />
                <circle cx="12" cy="12" r="2" />
                <path d="M19 5l-4 4" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-500 leading-tight">
                Total Qualified Lead Target
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
                  {target}
                </span>
                <span className="text-xs font-semibold text-slate-400">Leads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Qualified Leads Achieved */}
        <div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#EAF8F0] via-white to-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="20" x2="18" y2="10" />
                <line x1="12" y1="20" x2="12" y2="4" />
                <line x1="6" y1="20" x2="6" y2="14" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-500 leading-tight">
                Qualified Leads Achieved
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
                  {achieved}
                </span>
                <span className="text-xs font-semibold text-slate-400">Leads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Remaining Qualified Leads */}
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-[#FFF5E6] via-white to-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 22h14" />
                <path d="M5 2h14" />
                <path d="M17 22v-4.172a2 2 0 0 0-.586-1.414L12 12l-4.414 4.414A2 2 0 0 0 7 17.828V22" />
                <path d="M7 2v4.172a2 2 0 0 0 .586 1.414L12 12l4.414-4.414A2 2 0 0 0 17 6.172V2" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-500 leading-tight">
                Remaining Qualified Leads
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-amber-600 tracking-tight">
                  {remaining}
                </span>
                <span className="text-xs font-semibold text-slate-400">Leads</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Achievement */}
        <div className="rounded-2xl border border-purple-100 bg-gradient-to-br from-[#F5EFFF] via-white to-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-100 text-purple-600 shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 2a10 10 0 0 1 10 10h-10z" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-500 leading-tight">
                Achievement
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-purple-700 tracking-tight">
                  {achievementPct}%
                </span>
              </div>
              <span className="block text-[11px] font-medium text-slate-400">
                {achieved} of {target} leads
              </span>
            </div>
          </div>
        </div>

        {/* Card 5: Required Monthly Average */}
        <div className="rounded-2xl border border-rose-100 bg-gradient-to-br from-[#FFF0F3] via-white to-white p-4 shadow-sm hover:shadow-md transition-shadow">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 text-rose-600 shrink-0 shadow-inner">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 3v18h18" />
                <path d="M18.7 8l-5.1 5.2-2.8-2.7L7 14.3" />
              </svg>
            </div>
            <div className="min-w-0">
              <span className="block text-xs font-bold text-slate-500 leading-tight">
                Required Monthly Average
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className="font-display text-2xl sm:text-3xl font-black text-rose-600 tracking-tight">
                  {requiredMonthlyAvg}
                </span>
              </div>
              <span className="block text-[11px] font-semibold text-rose-500">
                Leads / Month
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Middle Section: Overall Progress & Monthly Target Plan */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: Overall Progress Bar Card */}
        <div className="lg:col-span-5 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-slate-800">
              Overall Progress
            </h3>
            <span className="text-xs font-semibold text-slate-400">
              Target: {target} Leads
            </span>
          </div>

          {/* Progress Bar */}
          <div className="my-auto py-2">
            <div className="relative h-7 w-full overflow-hidden rounded-full bg-slate-100 p-0.5">
              <div
                className="flex h-full items-center justify-center rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-[11px] font-extrabold text-white transition-all duration-500 shadow-sm"
                style={{ width: `${Math.max(8, achievementPct)}%` }}
              >
                {achievementPct}%
              </div>
            </div>
          </div>

          {/* Bottom figures */}
          <div className="mt-3 flex items-center justify-between text-xs font-bold text-blue-600">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-blue-600" />
              {achieved} Achieved
            </span>
            <span className="flex items-center gap-1.5 text-slate-500">
              <span className="h-2 w-2 rounded-full bg-slate-300" />
              {remaining} Remaining
            </span>
          </div>
        </div>

        {/* Right: Monthly Target Plan (Oct 2026 – Mar 2027) */}
        <div className="lg:col-span-7 rounded-2xl border border-slate-100 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display text-sm font-bold text-slate-800">
              Monthly Target Plan <span className="text-slate-400 font-normal text-xs">(Oct 2026 – Mar 2027)</span>
            </h3>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
            {monthlyPlan.map((m) => (
              <div
                key={m.name}
                className={`flex flex-col items-center justify-between rounded-xl border ${m.border} ${m.bg} p-2.5 text-center transition-all hover:scale-102`}
              >
                <span className={`text-[11px] font-bold ${m.text} leading-tight`}>
                  {m.name}
                  <span className="block text-[9px] font-medium text-slate-400">{m.year}</span>
                </span>
                <div className="my-1.5">
                  <span className={`font-display text-xl font-black ${m.valText}`}>
                    {m.target}
                  </span>
                  <span className="block text-[10px] font-semibold text-slate-400">Leads</span>
                </div>
                <div className="mt-0.5 text-slate-400">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={m.text}>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
