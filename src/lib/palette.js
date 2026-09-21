/**
 * One colour per subject area, used everywhere that subject appears: the nav
 * icon, its tiles, its charts. Colour carries meaning here, so it is never
 * assigned at random — and never the only signal, since roughly one man in
 * twelve cannot separate red from green.
 */
export const MODULES = {
  pipeline: { id: "pipeline", label: "Sales pipeline", color: "#FA2E76", tint: "#FFF0F5", icon: "M3 5h18M6 10h12M9 15h6M11 20h2" },
  web: { id: "web", label: "Website & SEO", color: "#7B61FF", tint: "#F3F0FF", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM3 12h18M12 3c2.5 2.5 3.8 5.6 3.8 9S14.5 18.5 12 21c-2.5-2.5-3.8-5.6-3.8-9S9.5 5.5 12 3z" },
  email: { id: "email", label: "Email marketing", color: "#00C2FF", tint: "#E5F9FF", icon: "M3 6h18v12H3zM3 6l9 7 9-7" },
  social: { id: "social", label: "Social media", color: "#FF9F43", tint: "#FFF5EB", icon: "M18 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM6 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM18 22a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8.6 13.5l6.8 3.5M15.4 7L8.6 10.5" },
  landing: { id: "landing", label: "Landing pages", color: "#10B981", tint: "#ECFDF5", icon: "M4 4h16v5H4zM4 12h7v8H4zM14 12h6v8h-6z" },
  cost: { id: "cost", label: "Tools & spend", color: "#6C5CE7", tint: "#F0EEFF", icon: "M12 2v20M17 6.5c0-2-2.2-3-5-3s-5 1-5 3 2.2 2.8 5 3.5 5 1.5 5 3.5-2.2 3-5 3-5-1-5-3" },
};

/** Categorical scale for anything without a fixed meaning (sources, files, stages). */
export const CATEGORICAL = [
  "#7B61FF", "#FA2E76", "#FF9F43", "#00C2FF", "#10B981",
  "#E01E5A", "#6C5CE7", "#0072FF", "#FF5252", "#94A3B8",
];

/** Warm-to-cool ramp for the funnel, so progress reads left to right. */
export const FUNNEL_COLORS = {
  Discovery: "#7B61FF",
  Qualified: "#00C2FF",
  Proposal: "#FF9F43",
  "Closed Won": "#10B981",
  "Closed Lost": "#FA2E76",
};

export const POSITIVE = "#10B981";
export const NEGATIVE = "#FA2E76";
export const NEUTRAL = "#94A3B8";

/** Bounce rate and cost per lead are better when lower; most things are not. */
export const directionColor = (change, lowerIsBetter = false) => {
  if (!Number.isFinite(change) || change === 0) return NEUTRAL;
  const good = lowerIsBetter ? change < 0 : change > 0;
  return good ? POSITIVE : NEGATIVE;
};
