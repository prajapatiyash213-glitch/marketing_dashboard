const env = (typeof import.meta !== "undefined" && import.meta.env) || {};
export const CURRENCY = env.VITE_CURRENCY || "INR";
export const LOCALE = env.VITE_LOCALE || "en-IN";

const intFmt = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 });
const moneyFmt = new Intl.NumberFormat(LOCALE, { style: "currency", currency: CURRENCY, maximumFractionDigits: 0 });

/** Indian magnitude words are common in these sheets, so they are parsed too. */
const MAGNITUDES = [
  [/(crore|\bcr\b)/, 1e7],
  [/(lakhs?|lacs?)/, 1e5],
  [/\d\s*k\b/, 1e3],
  [/\d\s*(m|mn|million)\b/, 1e6],
  [/\d\s*(b|bn|billion)\b/, 1e9],
];

export function parseCurrency(v) {
  if (v === null || v === undefined || v === "") return 0;
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  const s = String(v).toLowerCase().trim();
  let mult = 1;
  for (const [re, m] of MAGNITUDES) if (re.test(s)) { mult = m; break; }
  const match = s.replace(/,/g, "").match(/-?\d*\.?\d+/);
  if (!match) return 0;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n * mult : 0;
}

export function parsePercent(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return v <= 1 ? v * 100 : v;
  const match = String(v).replace(/,/g, "").match(/-?\d*\.?\d+/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  if (!Number.isFinite(n)) return null;
  if (String(v).includes("%")) return n;
  return n <= 1 ? n * 100 : n;
}

export function parseNumber(v) {
  if (v === null || v === undefined || v === "") return null;
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  const s = String(v).trim();
  if (/^(na|n\/a|-|—)$/i.test(s)) return null;

  // Handle K / M suffixes (e.g. 1K -> 1000, 5.2K -> 5200, 11K -> 11000, 2K -> 2000)
  const kmMatch = s.replace(/,/g, "").match(/^(-?\d*\.?\d+)\s*([km])\b/i);
  if (kmMatch) {
    const base = parseFloat(kmMatch[1]);
    if (Number.isFinite(base)) {
      const mult = kmMatch[2].toLowerCase() === "k" ? 1000 : 1000000;
      return Math.round(base * mult);
    }
  }

  // Handle AI Search strings like "14, 3, 31 (41)" or "(74) 64" or "(34) 28" where total is specified
  const parenEnd = s.match(/\((\d+)\)\s*$/);
  if (parenEnd) {
    return parseInt(parenEnd[1], 10);
  }
  const trailingAfterParen = s.match(/\(\d+\)[,\s]+(\d+)\s*$/);
  if (trailingAfterParen) {
    return parseInt(trailingAfterParen[1], 10);
  }

  const match = s.replace(/,/g, "").match(/-?\d*\.?\d+/);
  if (!match) return null;
  const n = parseFloat(match[0]);
  return Number.isFinite(n) ? n : null;
}

export const fmtInt = (n) => (n === null || n === undefined || !Number.isFinite(n) ? "—" : intFmt.format(Math.round(n)));
export const fmtMoney = (n) => (Number.isFinite(n) ? moneyFmt.format(Math.round(n)) : "—");

/** Compact money using the magnitude words the audience actually reads. */
export function fmtMoneyCompact(n) {
  if (!Number.isFinite(n) || n === 0) return moneyFmt.format(0);
  const symbol = moneyFmt.formatToParts(0).find((p) => p.type === "currency")?.value || "";
  const a = Math.abs(n);
  if (CURRENCY === "INR") {
    if (a >= 1e7) return `${symbol}${(n / 1e7).toFixed(2)} Cr`;
    if (a >= 1e5) return `${symbol}${(n / 1e5).toFixed(2)} L`;
  }
  if (a >= 1e9) return `${symbol}${(n / 1e9).toFixed(2)}B`;
  if (a >= 1e6) return `${symbol}${(n / 1e6).toFixed(2)}M`;
  if (a >= 1e3) return `${symbol}${(n / 1e3).toFixed(1)}K`;
  return `${symbol}${Math.round(n)}`;
}

export const pct = (part, whole, digits = 1) => (whole ? ((part / whole) * 100).toFixed(digits) : "0.0");
