import { useState, useEffect } from "react";
import { useWeeklyUpdates, saveWeeklyUpdates, resetWeeklyUpdates } from "../lib/weeklyUpdates.js";

export function WeeklyUpdatesForm() {
  const [currentUpdates] = useWeeklyUpdates();
  const [form, setForm] = useState(currentUpdates);
  const [savedStatus, setSavedStatus] = useState(false);

  // Sync internal form whenever currentUpdates changes (e.g. on external update or initial load)
  useEffect(() => {
    setForm(currentUpdates);
  }, [currentUpdates]);

  const handleChange = (index, field, value) => {
    setForm((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
    setSavedStatus(false);
  };

  const handleSave = () => {
    saveWeeklyUpdates(form);
    setSavedStatus(true);
    setTimeout(() => {
      setSavedStatus(false);
    }, 4000);
  };

  const handleReset = () => {
    resetWeeklyUpdates();
    setSavedStatus(false);
  };

  return (
    <div className="panel p-5 sm:p-6 mb-6">
      {/* Description Header matching Image 2 */}
      <div className="mb-4">
        <p className="text-sm font-semibold text-slate-700">
          These four cards are the reusable weekly update components.
        </p>
      </div>

      {/* 2x2 Grid of 4 Edit Cards matching Image 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {form.map((card, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200/90 bg-white p-4 sm:p-5 shadow-xs flex flex-col justify-between"
          >
            <div>
              {/* Card Title Field */}
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                Update {idx + 1} Title
              </label>
              <input
                type="text"
                value={card.title || ""}
                onChange={(e) => handleChange(idx, "title", e.target.value)}
                className="w-full text-sm font-medium text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder={`Update ${idx + 1} Title`}
              />

              {/* Description Field */}
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 mt-3.5">
                Description
              </label>
              <textarea
                rows={3}
                value={card.description || ""}
                onChange={(e) => handleChange(idx, "description", e.target.value)}
                className="w-full text-xs sm:text-sm font-medium text-slate-700 rounded-xl border border-slate-200 px-3.5 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all leading-relaxed placeholder:text-slate-400 resize-y"
                placeholder="Details for this weekly initiative..."
              />

              {/* Metric Field */}
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 mt-3.5">
                Metric
              </label>
              <input
                type="text"
                value={card.metric || ""}
                onChange={(e) => handleChange(idx, "metric", e.target.value)}
                className="w-full text-sm font-medium text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g. 10/M or 2,000"
              />

              {/* Metric Label Field */}
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1.5 mt-3.5">
                Metric Label
              </label>
              <input
                type="text"
                value={card.metricLabel || ""}
                onChange={(e) => handleChange(idx, "metricLabel", e.target.value)}
                className="w-full text-sm font-medium text-slate-800 rounded-xl border border-slate-200 px-3.5 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all placeholder:text-slate-400"
                placeholder="e.g. Visitor/Week"
              />
            </div>
          </div>
        ))}
      </div>

      {/* Action Buttons: Save Updates & Reset Defaults */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleSave}
          className="bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-sm py-2 px-5 rounded-xl transition-all shadow-xs cursor-pointer active:scale-98"
        >
          Save Updates
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm py-2 px-4 rounded-xl transition-all cursor-pointer active:scale-98"
        >
          Reset Defaults
        </button>
        {savedStatus && (
          <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-lg animate-in fade-in flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Updates saved! Overview updated immediately.
          </span>
        )}
      </div>
    </div>
  );
}
