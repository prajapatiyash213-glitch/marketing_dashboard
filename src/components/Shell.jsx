import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

import { MODULES } from "../lib/palette.js";

const ICONS = {
  overview: "M3 12h4l2-6 3 12 2.5-7 1.5 3h5",
  pipeline: MODULES.pipeline.icon,
  websites: MODULES.web.icon,
  channels: "M11 5L6 9H2v6h4l5 4V5zM15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14",
  email: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2zM22 6l-10 7L2 6",
  costs: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  leads: "M4 5h16v14H4zM4 10h16M10 10v9",
  sources: "M4 6h6l2 2h8v10H4zM4 6v12",
};

/** Each section carries its subject colour, so the nav and the charts agree. */
const ACCENT = {
  overview: "#4C8C86",
  pipeline: MODULES.pipeline.color,
  websites: MODULES.web.color,
  channels: "#FF9F43",
  email: "#7B61FF",
  costs: MODULES.cost.color,
  leads: "#8FB8DE",
  sources: "#8E9BA6",
};

export const NAV = [
  ["overview", "Overview"],
  ["pipeline", "Pipeline"],
  ["websites", "Websites & SEO"],
  ["channels", "Marketing channels"],
  ["email", "Email campaigns"],
  ["costs", "Technology & tool costs"],
  ["leads", "All leads"],
  ["sources", "Data sources"],
];

export function Sidebar({ view, setView, footer }) {
  return (
    <nav className="no-print hidden w-64 shrink-0 flex-col justify-between border-r border-[#EEF2F7] bg-white text-slate-600 shadow-sm md:flex h-screen overflow-y-auto section-scroll" aria-label="Sections">
      <div>
        {/* OmniScope brand header */}
        <div className="mb-6 flex items-center gap-3.5 bg-gradient-to-r from-[#FA2E76] to-[#7B61FF] px-6 py-6 text-white shadow-md rounded-br-2xl min-h-[80px]">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/25 backdrop-blur-sm shadow-inner shrink-0 ring-1 ring-white/30">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeDasharray="36 10" />
              <circle cx="12" cy="12" r="5.5" stroke="currentColor" strokeWidth="1.8" />
              <path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              <circle cx="12" cy="12" r="2.2" fill="#FDE047" stroke="#FFFFFF" strokeWidth="0.8" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <span className="font-display text-2xl font-black tracking-tight leading-tight block text-white">
              OmniScope<span className="text-yellow-300">.</span>
            </span>
            <span className="text-[10px] font-bold tracking-widest text-white/80 block uppercase">
              Sales & SEO Suite
            </span>
          </div>
        </div>

        <div className="px-3 mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navigation
        </div>

        <ul className="space-y-1.5 px-1">
          {NAV.map(([key, label]) => {
            const on = view === key;
            return (
              <li key={key}>
                <button
                  onClick={() => setView(key)}
                  aria-current={on ? "page" : undefined}
                  className={`flex w-full cursor-pointer items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-sm font-medium transition-all ${
                    on
                      ? "bg-[#FFF0F5] text-[#FA2E76] font-semibold shadow-sm"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                      on ? "bg-white text-[#FA2E76] shadow-sm" : "text-slate-400 group-hover:text-slate-600"
                    }`}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? "2.2" : "1.8"} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <path d={ICONS[key]} />
                    </svg>
                  </span>
                  <span>{label}</span>
                  {on && <span className="ml-auto h-2 w-2 rounded-full bg-[#FA2E76]" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-3.5">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-700">System Ready</span>
        </div>
        <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{footer}</p>
      </div>
    </nav>
  );
}

export function AccountMenu() {
  const { user, signOut, insecure } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e) => { if (!ref.current?.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  if (!user) return null;
  const initials = (user.name || user.email).split(/[\s.]+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("");

  return (
    <div className="flex items-center gap-2.5 no-print" ref={ref}>
      {/* User profile dropdown */}
      <div className="relative">
        <button
          className="flex cursor-pointer items-center gap-2.5 rounded-full border border-[#E2E8F0] bg-white py-1 pl-1 pr-3 hover:border-slate-300 transition-all shadow-subtle"
          aria-expanded={open}
          aria-haspopup="menu"
          onClick={() => setOpen((o) => !o)}
        >
          <div className="relative">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-tr from-[#FA2E76] to-[#7B61FF] text-xs font-bold text-white shadow-sm">
              {initials}
            </span>
            <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white" />
          </div>
          <span className="hidden text-xs font-semibold text-slate-700 sm:inline max-w-[130px] truncate">{user.name || user.email}</span>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-slate-400">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>

        {open && (
          <div role="menu" className="panel absolute right-0 z-30 mt-2 w-60 rounded-2xl p-2 shadow-card bg-white border border-[#EEF2F7]">
            <div className="border-b border-slate-100 px-3.5 py-2.5 text-xs">
              <span className="text-slate-400 font-medium">Signed in as</span>
              <div className="truncate font-semibold text-slate-800 text-sm mt-0.5">{user.email}</div>
              {insecure && <div className="mt-1 text-xs text-amber-600 font-medium">Demo mode (unauthenticated)</div>}
            </div>
            <div className="p-1">
              <button
                role="menuitem"
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-xs font-medium text-rose-600 hover:bg-rose-50 transition-colors"
                onClick={signOut}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                  <polyline points="16 17 21 12 16 7" />
                  <line x1="21" y1="12" x2="9" y2="12" />
                </svg>
                Sign out
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
