import { useState, useEffect } from "react";

export const DEFAULT_WEEKLY_UPDATES = [
  {
    id: 1,
    title: "Sales Team Moving To Execution",
    description:
      "Technical training is in progress. Team hits the floor Monday, 12 October 2026, targeting approximately 10 meetings or qualified opportunities per month.",
    metric: "10/M",
    metricLabel: "",
  },
  {
    id: 2,
    title: "The Next 45 Days Are The Primary Email Push",
    description:
      "Traffic → Engagement → Qualification. Combined weekly traffic target: approximately 2,000 visits across Tecnoprism.com and AutomationCOE.com.",
    metric: "2,000",
    metricLabel: "Visitor/Week",
  },
  {
    id: 3,
    title: "Three-stage Email Nurture Chain",
    description:
      "Homepage and landing pages → retarget engaged visitors with use cases and service pages → send department-specific pitch decks.",
    metric: "",
    metricLabel: "",
  },
  {
    id: 4,
    title: "LinkedIn Page Renamed",
    description: "Tecnoprism Pvt Ltd is now Tecnoprism.",
    metric: "",
    metricLabel: "",
  },
];

const STORAGE_KEY = "tecnoprism_weekly_updates";

export function getWeeklyUpdates() {
  if (typeof window === "undefined") return DEFAULT_WEEKLY_UPDATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WEEKLY_UPDATES;
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length === 4) {
      return parsed.map((item, idx) => ({
        ...DEFAULT_WEEKLY_UPDATES[idx],
        ...item,
      }));
    }
  } catch (e) {
    console.error("Failed to load weekly updates from localStorage:", e);
  }
  return DEFAULT_WEEKLY_UPDATES;
}

export function saveWeeklyUpdates(updates) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updates));
    window.dispatchEvent(new CustomEvent("weekly-updates-changed", { detail: updates }));
  } catch (e) {
    console.error("Failed to save weekly updates to localStorage:", e);
  }
}

export function resetWeeklyUpdates() {
  if (typeof window === "undefined") return DEFAULT_WEEKLY_UPDATES;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent("weekly-updates-changed", { detail: DEFAULT_WEEKLY_UPDATES }));
  } catch (e) {
    console.error("Failed to reset weekly updates:", e);
  }
  return DEFAULT_WEEKLY_UPDATES;
}

export function useWeeklyUpdates() {
  const [updates, setUpdates] = useState(getWeeklyUpdates);

  useEffect(() => {
    const onUpdate = () => {
      setUpdates(getWeeklyUpdates());
    };
    window.addEventListener("weekly-updates-changed", onUpdate);
    window.addEventListener("storage", onUpdate);
    return () => {
      window.removeEventListener("weekly-updates-changed", onUpdate);
      window.removeEventListener("storage", onUpdate);
    };
  }, []);

  return [updates, setUpdates];
}
