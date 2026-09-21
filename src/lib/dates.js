/**
 * Every date in this app is a UTC-midnight Date. Spreadsheet dates carry no
 * timezone, so anchoring to UTC keeps a row dated 1 Jul from sliding to 30 Jun
 * for anyone west of Greenwich. Always read them back with getUTC* accessors.
 */

export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const utcDay = (y, m, d) => new Date(Date.UTC(y, m, d));
export const fromLocalDate = (d) => {
  if (!d || isNaN(d.getTime())) return null;
  const h = d.getHours();
  const m = d.getMinutes();
  const adjMs = (h === 23 && m >= 50) ? 15 * 60 * 1000 : 0;
  const target = adjMs ? new Date(d.getTime() + adjMs) : d;
  return utcDay(target.getFullYear(), target.getMonth(), target.getDate());
};
export const addDays = (d, n) => new Date(d.getTime() + n * 86400000);
export const dayKey = (d) =>
  `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
export const prettyDate = (d) => (d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : "—");

const monthIndex = (word) => MONTHS.findIndex((m) => m.toLowerCase() === word.slice(0, 3).toLowerCase());

/**
 * Reads a spreadsheet cell as a date.
 * `dayFirst` decides ambiguous numeric dates such as 03/04/2026; it defaults to
 * true because day-first is the norm outside the US. Detect it per column with
 * detectDayFirst() and pass the result in rather than guessing per row.
 */
export function parseDateCell(v, { dayFirst = true } = {}) {
  if (v === null || v === undefined || v === "") return null;
  if (v instanceof Date) return isNaN(v.getTime()) ? null : fromLocalDate(v);

  if (typeof v === "number") {
    if (v > 20000 && v < 80000) {
      const d = new Date(Date.UTC(1899, 11, 30) + Math.round(v) * 86400000);
      return utcDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
    return null;
  }

  const s = String(v).trim();
  if (!s) return null;

  let m = s.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (m) return utcDay(+m[1], +m[2] - 1, +m[3]);

  m = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{2,4})/);
  if (m) {
    let [a, b, y] = [+m[1], +m[2], +m[3]];
    if (y < 100) y += 2000;
    if (a > 12 && b <= 12) return utcDay(y, b - 1, a);
    if (b > 12 && a <= 12) return utcDay(y, a - 1, b);
    return dayFirst ? utcDay(y, b - 1, a) : utcDay(y, a - 1, b);
  }

  m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})\.?[\s-]?(\d{2,4})?/);
  if (m) {
    const mi = monthIndex(m[2]);
    if (mi >= 0) {
      let y = m[3] ? +m[3] : new Date().getUTCFullYear();
      if (y < 100) y += 2000;
      return utcDay(y, mi, +m[1]);
    }
  }

  m = s.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2}),?\s*(\d{2,4})?/);
  if (m) {
    const mi = monthIndex(m[1]);
    if (mi >= 0) {
      let y = m[3] ? +m[3] : new Date().getUTCFullYear();
      if (y < 100) y += 2000;
      return utcDay(y, mi, +m[2]);
    }
  }

  // Only use Date.parse as a last resort on strings that contain digits and
  // look date-like — avoids false positives from column headers such as
  // "Followup 1", "Followup 2 Date", "Date of Connect", etc.
  if (/\d/.test(s) && /[/-]|[A-Za-z]{3}/.test(s)) {
    const t = Date.parse(s);
    if (!isNaN(t)) {
      const d = new Date(t);
      return utcDay(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
    }
  }
  return null;
}

/**
 * Looks at a whole column of raw values and decides whether it is day-first.
 * A single value above 12 in the first position settles it; otherwise we keep
 * the day-first default. Returns { dayFirst, certain }.
 */
export function detectDayFirst(values) {
  let firstOver12 = 0;
  let secondOver12 = 0;
  for (const v of values) {
    if (typeof v !== "string") continue;
    const m = v.trim().match(/^(\d{1,2})[/.-](\d{1,2})[/.-]\d{2,4}/);
    if (!m) continue;
    if (+m[1] > 12) firstOver12++;
    if (+m[2] > 12) secondOver12++;
  }
  if (firstOver12 && !secondOver12) return { dayFirst: true, certain: true };
  if (secondOver12 && !firstOver12) return { dayFirst: false, certain: true };
  return { dayFirst: true, certain: false };
}

export function startOfWeek(d) {
  return addDays(d, -((d.getUTCDay() + 6) % 7)); // Monday
}

export function bucketOf(d, grain) {
  const y = d.getUTCFullYear();
  if (grain === "year") return { key: `${y}`, label: `${y}`, sort: Date.UTC(y, 0, 1) };
  if (grain === "quarter") {
    const q = Math.floor(d.getUTCMonth() / 3);
    return { key: `${y}-Q${q + 1}`, label: `Q${q + 1} ${String(y).slice(2)}`, sort: Date.UTC(y, q * 3, 1) };
  }
  if (grain === "month") {
    const mo = d.getUTCMonth();
    return { key: `${y}-${mo}`, label: `${MONTHS[mo]} ${String(y).slice(2)}`, sort: Date.UTC(y, mo, 1) };
  }
  if (grain === "day") {
    return { key: dayKey(d), label: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`, sort: d.getTime() };
  }
  const w = startOfWeek(d);
  return { key: dayKey(w), label: `${w.getUTCDate()} ${MONTHS[w.getUTCMonth()]}`, sort: w.getTime() };
}

export const RANGE_PRESETS = [
  { key: "7d", label: "7 days" },
  { key: "4w", label: "4 weeks" },
  { key: "mtd", label: "This month" },
  { key: "3m", label: "3 months" },
  { key: "6m", label: "6 months" },
  { key: "ytd", label: "This year" },
  { key: "12m", label: "12 months" },
  { key: "all", label: "All time" },
  { key: "custom", label: "Custom" },
];

/**
 * Resolves a preset against an anchor date. The anchor is the newest date in
 * the loaded data, not today: a workbook that ends in March should still show
 * rows under "last 7 days" instead of an empty dashboard.
 */
export function resolveRange(key, anchor, custom = {}) {
  const to = anchor;
  switch (key) {
    case "7d": return { from: addDays(to, -6), to, label: "Last 7 days" };
    case "4w": return { from: addDays(to, -27), to, label: "Last 4 weeks" };
    case "mtd": return { from: utcDay(to.getUTCFullYear(), to.getUTCMonth(), 1), to, label: "This month" };
    case "3m": return { from: addDays(to, -89), to, label: "Last 3 months" };
    case "6m": return { from: addDays(to, -179), to, label: "Last 6 months" };
    case "12m": return { from: addDays(to, -364), to, label: "Last 12 months" };
    case "ytd": return { from: utcDay(to.getUTCFullYear(), 0, 1), to, label: "This year" };
    case "custom": return {
      from: custom.from ? parseDateCell(custom.from) : null,
      to: custom.to ? parseDateCell(custom.to) : null,
      label: "Custom range",
      custom: true,
    };
    default: return { from: null, to: null, label: "All time" };
  }
}

export function previousWindow(range) {
  if (!range.from || !range.to) return null;
  const span = Math.round((range.to - range.from) / 86400000) + 1;
  return { from: addDays(range.from, -span), to: addDays(range.from, -1) };
}

export const withinRange = (d, range) => {
  if (!d) return false;
  if (range.from && d < range.from) return false;
  if (range.to && d > range.to) return false;
  return true;
};

/**
 * Parses a week-column header, reporting whether the year was written down.
 * "3-Jul" has no year; "3-Jul-25" and a real Date do.
 * Strings that don't look like "D-Mon" or "Mon-D" are rejected immediately
 * so column headers like "Followup 1" are never mistaken for week dates.
 */
export function parseWeekToken(v) {
  if (typeof v === "string") {
    const s = v.trim();
    if (/^\d{5}$/.test(s)) {
      const num = Number(s);
      if (num > 20000 && num < 80000) {
        const d = parseDateCell(num);
        if (d) return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), hasYear: true };
      }
    }
    // e.g. "3-Jul", "10 Jul", "3-Jul-25"
    let m = s.match(/^(\d{1,2})[\s-]([A-Za-z]{3,9})\.?(?:[\s-](\d{2,4}))?$/);
    if (m) {
      const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[2].slice(0, 3).toLowerCase());
      if (mi >= 0) {
        if (m[3]) {
          let y = +m[3];
          if (y < 100) y += 2000;
          return { day: +m[1], month: mi, year: y, hasYear: true };
        }
        return { day: +m[1], month: mi, year: null, hasYear: false };
      }
    }
    // e.g. "Jul-3", "Jul 10"
    m = s.match(/^([A-Za-z]{3,9})\.?[\s-](\d{1,2})$/);
    if (m) {
      const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[1].slice(0, 3).toLowerCase());
      if (mi >= 0) return { day: +m[2], month: mi, year: null, hasYear: false };
    }
    // Strings don't get the Date.parse fallback — they must match D-Mon above.
    return null;
  }
  // Non-string values (Date objects, Excel serial numbers) use parseDateCell.
  const d = parseDateCell(v);
  if (!d) return null;
  return { day: d.getUTCDate(), month: d.getUTCMonth(), year: d.getUTCFullYear(), hasYear: true };
}

/**
 * Assigns years to a left-to-right run of week headers.
 *
 * Weekly SEO sheets are written "3-Jul", "10-Jul" with the year left implicit.
 * Read literally, a sheet running Nov → Jan puts January eleven months BEFORE
 * November, which scrambles every chart and pushes the newest date into the
 * future — which in turn makes every "last N days" filter return nothing.
 *
 * So: walk the row, roll the year forward whenever the month goes backwards,
 * then shift the whole run so it ends on or before `today` rather than in the
 * future. Headers that state their own year are left exactly as written.
 */
export function assignWeekYears(tokens, today = new Date()) {
  const known = tokens.filter((t) => t?.hasYear);
  if (known.length === tokens.length) {
    return tokens.map((t) => utcDay(t.year, t.month, t.day));
  }

  const anchorYear = known.length ? known[0].year : today.getUTCFullYear();
  let year = anchorYear;
  let prevMonth = null;
  const years = tokens.map((t) => {
    if (t.hasYear) { year = t.year; prevMonth = t.month; return t.year; }
    if (prevMonth !== null && t.month < prevMonth) year += 1;
    prevMonth = t.month;
    return year;
  });

  let dates = tokens.map((t, i) => utcDay(years[i], t.month, t.day));

  // A run that ends in the future means the implicit year was too high.
  if (!known.length) {
    const todayUtc = utcDay(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate());
    const last = dates[dates.length - 1];
    const daysAhead = (last - todayUtc) / 86400000;
    if (daysAhead > 7) {
      const shift = Math.ceil((daysAhead - 7) / 365);
      dates = dates.map((d) => utcDay(d.getUTCFullYear() - shift, d.getUTCMonth(), d.getUTCDate()));
    }
  }
  return dates;
}
