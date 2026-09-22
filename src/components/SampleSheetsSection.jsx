import { useState } from "react";
import { SAMPLE_CATEGORIES, downloadSampleSheet } from "../lib/sampleTemplates.js";

export function SampleSheetsSection() {
  const [downloading, setDownloading] = useState(null);

  const handleDownload = (catId) => {
    setDownloading(catId);
    try {
      downloadSampleSheet(catId);
    } finally {
      setTimeout(() => setDownloading(null), 800);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-subtle mb-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-pink-50 text-[#FA2E76]">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="12" y1="18" x2="12" y2="12" />
                <line x1="9" y1="15" x2="15" y2="15" />
              </svg>
            </span>
            <h2 className="text-base font-bold text-slate-800">Department Spreadsheet Templates</h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Download pre-formatted Excel (.xlsx) templates for each department to organize and upload your data.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => handleDownload("all")}
            disabled={downloading === "all"}
            className="btn-primary !py-2 !px-4 !text-xs !font-bold flex items-center gap-2 cursor-pointer shadow-glow-pink"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            {downloading === "all" ? "Preparing..." : "Download All Templates (.xlsx)"}
          </button>
        </div>
      </div>

      {/* Grid of 6 Categories */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 pt-5">
        {SAMPLE_CATEGORIES.map((cat) => {
          const isBusy = downloading === cat.id;
          return (
            <div
              key={cat.id}
              className="rounded-xl border border-slate-100 bg-slate-50/50 p-4.5 hover:border-slate-300 hover:bg-white transition-all flex flex-col justify-between group shadow-xs"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl bg-white shadow-xs shrink-0"
                      style={{ color: cat.color }}
                    >
                      {cat.id === "leads" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                          <circle cx="8.5" cy="7" r="4" />
                          <line x1="20" y1="8" x2="20" y2="14" />
                          <line x1="23" y1="11" x2="17" y2="11" />
                        </svg>
                      ) : cat.id === "seo" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <line x1="2" y1="12" x2="22" y2="12" />
                          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                        </svg>
                      ) : cat.id === "email" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                          <polyline points="22,6 12,13 2,6" />
                        </svg>
                      ) : cat.id === "social" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
                        </svg>
                      ) : cat.id === "landing" ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <line x1="3" y1="9" x2="21" y2="9" />
                          <line x1="9" y1="21" x2="9" y2="9" />
                        </svg>
                      ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <circle cx="12" cy="12" r="10" />
                          <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                          <path d="M12 6v12" />
                        </svg>
                      )}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-snug">{cat.name}</h3>
                      <span className="font-mono text-[11px] text-slate-400 block mt-0.5">{cat.fileName}</span>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${cat.badgeBg}`}>
                    {cat.badge}
                  </span>
                </div>

                <p className="text-xs text-slate-500 mt-3 leading-relaxed">{cat.description}</p>

                {/* Key Column Tags */}
                <div className="mt-3 flex flex-wrap gap-1">
                  {cat.columns.slice(0, 5).map((col) => (
                    <span key={col} className="text-[10px] bg-white border border-slate-200/80 px-2 py-0.5 rounded-md text-slate-600 font-medium">
                      {col}
                    </span>
                  ))}
                  {cat.columns.length > 5 && (
                    <span className="text-[10px] text-slate-400 px-1 py-0.5">+{cat.columns.length - 5} more</span>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => handleDownload(cat.id)}
                  disabled={isBusy}
                  className="text-xs font-bold text-slate-700 hover:text-[#FA2E76] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                  {isBusy ? "Downloading..." : "Download .xlsx"}
                </button>

                <span className="text-[11px] text-slate-400 font-medium">Tab: &quot;{cat.sheetName}&quot;</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
