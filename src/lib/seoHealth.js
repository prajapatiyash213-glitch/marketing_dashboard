/**
 * Dynamic SEO Metric Health Evaluator
 * 
 * Rules:
 * - "good" (Green): Positive growth, high performance, or exceeding industry benchmark.
 * - "bad" (Red): Declining trend, zero conversion bottlenecks, or poor health score.
 * - "neutral" (Black): Stable baseline, natural/average range for B2B tech websites.
 * 
 * Automatically responds to weekly data updates by comparing the latest week against
 * the previous week (Week-over-Week) alongside established SEO industry benchmarks.
 */

/**
 * @param {string} metric - Metric key (views, users, bounce, as, da, keywords, webLeads, downloads, pa, backlinks, aiSearch)
 * @param {number|null} currentVal - Current value in active/latest week or period
 * @param {number|null} prevVal - Previous week value (for week-over-week comparison)
 * @param {object} [options] - Additional context
 */
export function getSeoMetricHealth(metric, currentVal, prevVal, options = {}) {
  const cur = currentVal != null ? Number(currentVal) : null;
  const prev = prevVal != null ? Number(prevVal) : null;
  const hasPrev = prev != null && !isNaN(prev);

  let status = "neutral";
  let diff = hasPrev && cur != null ? cur - prev : null;
  let diffPercent = hasPrev && prev !== 0 && diff != null ? ((diff / Math.abs(prev)) * 100) : null;
  let badgeText = "Natural Baseline";
  let shortBadge = "Natural";
  let diffText = "";

  switch (metric) {
    case "views": {
      // Traffic views:
      // "is it growing every day so it green if drop then red"
      // Growing -> Green ("good", Growing)
      // Dropping -> Red ("bad", Dropping)
      // Stable -> Black ("neutral", Stable)
      const periodLabel = options.periodLabel || "WoW";
      if (cur == null || cur === 0) {
        status = "bad";
        shortBadge = "Zero";
        badgeText = "No Traffic";
      } else if (hasPrev && diff != null) {
        const roundedPct = diffPercent != null ? diffPercent.toFixed(1) : diff;
        if (diff > 0) {
          status = "good";
          shortBadge = "Growing";
          diffText = `+${roundedPct}% ${periodLabel}`;
        } else if (diff < 0) {
          status = "bad";
          shortBadge = "Dropping";
          diffText = `${roundedPct}% ${periodLabel}`;
        } else {
          status = "neutral";
          shortBadge = "Stable";
          diffText = `0.0% ${periodLabel}`;
        }
        badgeText = `${shortBadge} · ${diffText}`;
      } else {
        // Active traffic baseline without prior comparison period
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Active Baseline";
      }
      break;
    }

    case "users": {
      // Unique users:
      // "is it growing every day so it green if drop then red"
      // Growing -> Green ("good", Growing)
      // Dropping -> Red ("bad", Dropping)
      // Stable -> Black ("neutral", Stable)
      const periodLabel = options.periodLabel || "WoW";
      if (cur == null || cur === 0) {
        status = "bad";
        shortBadge = "Zero";
        badgeText = "No Users";
      } else if (hasPrev && diff != null) {
        const roundedPct = diffPercent != null ? diffPercent.toFixed(1) : diff;
        if (diff > 0) {
          status = "good";
          shortBadge = "Growing";
          diffText = `+${roundedPct}% ${periodLabel}`;
        } else if (diff < 0) {
          status = "bad";
          shortBadge = "Dropping";
          diffText = `${roundedPct}% ${periodLabel}`;
        } else {
          status = "neutral";
          shortBadge = "Stable";
          diffText = `0.0% ${periodLabel}`;
        }
        badgeText = `${shortBadge} · ${diffText}`;
      } else {
        // Active visitor baseline without prior comparison period
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Active Visitors";
      }
      break;
    }

    case "bounce": {
      // Bounce rate:
      // "below 30% bounce rate consider as in green color otherwise red"
      if (hasPrev && diff != null) {
        const roundedDiff = Math.round(diff * 100) / 100;
        diffText = `${roundedDiff > 0 ? "+" : ""}${roundedDiff.toFixed(1)}% WoW`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (cur < 30.0) {
        status = "good";
        shortBadge = "< 30% Good";
        badgeText = `< 30% ${diffText ? `(${diffText})` : ""} · Good`;
      } else {
        status = "bad";
        shortBadge = "≥ 30% High";
        badgeText = `≥ 30% ${diffText ? `(${diffText})` : ""} · High`;
      }
      break;
    }

    case "as": {
      // SEMrush Authority Score (0-100)
      // < 10: Bad / Critical (4 is in this bracket)
      // 10 - 25: Natural / Developing
      // > 25: Good / Strong authority
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} WoW`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (cur < 10) {
        status = "bad";
        shortBadge = "Low Score";
        badgeText = `Score ${cur} · Low`;
      } else if (cur <= 25) {
        status = "neutral";
        shortBadge = "Moderate";
        badgeText = `Score ${cur} · Average`;
      } else {
        status = "good";
        shortBadge = "Strong";
        badgeText = `Score ${cur} · Strong`;
      }
      break;
    }

    case "da": {
      // Domain Authority (Moz DAPA, 1-100)
      // < 15: Bad
      // 15 - 30: Natural (16 is natural baseline)
      // > 30: Good
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} WoW`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (hasPrev && diff > 0) {
        status = "good";
        shortBadge = `+${diff} DA`;
        badgeText = `+${diff} DA WoW`;
      } else if (hasPrev && diff < 0) {
        status = "bad";
        shortBadge = `${diff} DA`;
        badgeText = `${diff} DA WoW`;
      } else if (cur < 15) {
        status = "bad";
        shortBadge = "Low DA";
        badgeText = "Low Authority";
      } else if (cur <= 30) {
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Natural Baseline";
      } else {
        status = "good";
        shortBadge = "High DA";
        badgeText = "High Authority";
      }
      break;
    }

    case "keywords": {
      // Top 20 Keywords in Google
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} WoW`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (hasPrev && diff > 0) {
        status = "good";
        shortBadge = `+${diff} KW`;
        badgeText = `+${diff} Keywords WoW`;
      } else if (hasPrev && diff < 0) {
        status = "bad";
        shortBadge = `${diff} KW`;
        badgeText = `${diff} Keywords WoW`;
      } else if (cur < 8) {
        status = "bad";
        shortBadge = "Low KW";
        badgeText = "Low Footprint";
      } else if (cur <= 25) {
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Natural Baseline";
      } else {
        status = "good";
        shortBadge = "Strong";
        badgeText = "Strong Ranking";
      }
      break;
    }

    case "webLeads": {
      // Inbound Leads:
      if (cur == null || cur === 0) {
        status = "bad";
        shortBadge = "0 Leads";
        badgeText = "0 Inbound Leads";
      } else {
        status = "good";
        shortBadge = "Active";
        diffText = hasPrev && diff != null ? `${diff >= 0 ? "+" : ""}${diff} WoW` : "";
        badgeText = diffText || "Active Pipeline";
      }
      break;
    }

    case "downloads": {
      // Downloads:
      if (cur == null || cur === 0) {
        status = "bad";
        shortBadge = "0 Fills";
        badgeText = "0 Resource Fills";
      } else {
        status = "good";
        shortBadge = "Active";
        diffText = hasPrev && diff != null ? `${diff >= 0 ? "+" : ""}${diff} WoW` : "";
        badgeText = diffText || "Active Downloads";
      }
      break;
    }

    case "pa": {
      // Page Authority (Moz PA, 1-100)
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} WoW`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (hasPrev && diff > 0) {
        status = "good";
        shortBadge = `+${diff} PA`;
        badgeText = `+${diff} PA WoW`;
      } else if (hasPrev && diff < 0) {
        status = "bad";
        shortBadge = `${diff} PA`;
        badgeText = `${diff} PA WoW`;
      } else if (cur < 20) {
        status = "bad";
        shortBadge = "Low PA";
        badgeText = "Low PA";
      } else if (cur <= 35) {
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Natural Baseline";
      } else {
        status = "good";
        shortBadge = "High PA";
        badgeText = "High PA";
      }
      break;
    }

    case "backlinks": {
      // Backlinks:
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} Links`;
      }
      if (cur == null) {
        status = "neutral";
        shortBadge = "—";
        badgeText = "—";
      } else if (hasPrev && diff > 0) {
        status = "good";
        shortBadge = `+${diff} Links`;
        badgeText = `+${diff} Links WoW`;
      } else if (hasPrev && diff < 0 && cur < 100) {
        status = "bad";
        shortBadge = `${diff} Links`;
        badgeText = `${diff} Links WoW`;
      } else if (cur >= 300) {
        status = "good";
        shortBadge = "Strong";
        badgeText = "Strong Link Base";
      } else if (cur >= 50) {
        status = "neutral";
        shortBadge = "Baseline";
        badgeText = "Natural Baseline";
      } else {
        status = "bad";
        shortBadge = "Low Links";
        badgeText = "Low Link Count";
      }
      break;
    }

    case "aiSearch": {
      // AI Search Visibility (citations & referrals from LLM engines)
      if (hasPrev && diff != null && diff !== 0) {
        diffText = `${diff > 0 ? "+" : ""}${diff} AI`;
      }
      if (cur == null || cur === 0) {
        status = "bad";
        shortBadge = "0 Citations";
        badgeText = "No AI Citations";
      } else if (hasPrev && diff > 0) {
        status = "good";
        shortBadge = `+${diff} AI`;
        badgeText = `+${diff} AI Queries WoW`;
      } else if (hasPrev && diff < 0 && cur <= 5) {
        status = "bad";
        shortBadge = `${diff} AI`;
        badgeText = `${diff} AI Queries WoW`;
      } else if (cur >= 10) {
        status = "good";
        shortBadge = "Active AI";
        badgeText = "Active AI Discovery";
      } else {
        status = "neutral";
        shortBadge = "Emerging";
        badgeText = "Emerging Presence";
      }
      break;
    }

    default:
      status = "neutral";
      shortBadge = "Natural";
      badgeText = "Natural";
  }

  // Exact CSS classes matching user request:
  // "jo acchha hai usko green rakho. jo bura hai usko red rakho and natural hai usko black rakho."
  const textClass =
    status === "good"
      ? "text-emerald-600"
      : status === "bad"
      ? "text-rose-600"
      : "text-slate-900";

  const borderClass =
    status === "good"
      ? "border-l-emerald-500"
      : status === "bad"
      ? "border-l-rose-500"
      : "border-l-slate-400";

  const badgeClass =
    status === "good"
      ? "text-emerald-700 bg-emerald-50 border border-emerald-200/80"
      : status === "bad"
      ? "text-rose-700 bg-rose-50 border border-rose-200/80"
      : "text-slate-600 bg-slate-100 border border-slate-200/80";

  const dotClass =
    status === "good"
      ? "bg-emerald-500"
      : status === "bad"
      ? "bg-rose-500"
      : "bg-slate-400";

  return {
    status,
    textClass,
    borderClass,
    badgeClass,
    dotClass,
    badgeText,
    shortBadge,
    diffText,
    diff,
    diffPercent,
  };
}
