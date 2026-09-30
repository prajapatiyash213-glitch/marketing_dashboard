import { describe, it, expect } from "vitest";
import { parseDateCell, detectDayFirst, bucketOf, resolveRange, previousWindow, utcDay, dayKey, assignWeekYears, prettyDate, hasExplicitYear } from "../dates.js";

describe("parseDateCell", () => {
  it("reads ISO dates", () => {
    expect(dayKey(parseDateCell("2026-07-03"))).toBe("2026-07-03");
  });

  it("reads Excel serial numbers", () => {
    expect(dayKey(parseDateCell(46206))).toBe("2026-07-03");
  });

  it("treats ambiguous numeric dates as day-first by default", () => {
    expect(dayKey(parseDateCell("03/04/2026"))).toBe("2026-04-03");
  });

  it("honours month-first when told to", () => {
    expect(dayKey(parseDateCell("03/04/2026", { dayFirst: false }))).toBe("2026-03-04");
  });

  it("resolves the ambiguity itself when one part cannot be a month", () => {
    expect(dayKey(parseDateCell("25/12/2026", { dayFirst: false }))).toBe("2026-12-25");
  });

  it("reads written month names both ways round", () => {
    expect(dayKey(parseDateCell("12 Jul 2026"))).toBe("2026-07-12");
    expect(dayKey(parseDateCell("Jul 12, 2026"))).toBe("2026-07-12");
    expect(dayKey(parseDateCell("3-Jul-26"))).toBe("2026-07-03");
  });

  it("expands two digit years", () => {
    expect(parseDateCell("03/04/26").getUTCFullYear()).toBe(2026);
  });

  it("returns null for values that are not dates", () => {
    expect(parseDateCell("")).toBeNull();
    expect(parseDateCell(null)).toBeNull();
    expect(parseDateCell("Acme Industries")).toBeNull();
    expect(parseDateCell(42)).toBeNull();
    expect(parseDateCell(new Date("nonsense"))).toBeNull();
  });

  it("does not shift a date across a timezone boundary", () => {
    const d = parseDateCell("2026-01-01");
    expect(d.getUTCDate()).toBe(1);
    expect(d.getUTCMonth()).toBe(0);
  });
});

describe("detectDayFirst", () => {
  it("detects day-first from a value above twelve in first position", () => {
    expect(detectDayFirst(["13/04/2026", "01/02/2026"])).toEqual({ dayFirst: true, certain: true });
  });
  it("detects month-first from a value above twelve in second position", () => {
    expect(detectDayFirst(["04/13/2026", "01/02/2026"])).toEqual({ dayFirst: false, certain: true });
  });
  it("admits uncertainty when every value is ambiguous", () => {
    expect(detectDayFirst(["01/02/2026", "03/04/2026"])).toEqual({ dayFirst: true, certain: false });
  });
});

describe("bucketOf", () => {
  const d = utcDay(2026, 6, 8); // Wednesday 8 Jul 2026
  it("buckets to the Monday of the week", () => {
    expect(bucketOf(d, "week").label).toBe("6 Jul");
  });
  it("buckets by day, month, quarter and year", () => {
    expect(bucketOf(d, "day").label).toBe("8 Jul");
    expect(bucketOf(d, "month").label).toBe("Jul 26");
    expect(bucketOf(d, "quarter").label).toBe("Q3 26");
    expect(bucketOf(d, "year").label).toBe("2026");
  });
});

describe("resolveRange", () => {
  const anchor = utcDay(2026, 8, 9);
  it("anchors presets to the newest data date, not today", () => {
    const r = resolveRange("7d", anchor);
    expect(dayKey(r.from)).toBe("2026-09-03");
    expect(dayKey(r.to)).toBe("2026-09-09");
  });
  it("starts this-year at 1 January", () => {
    expect(dayKey(resolveRange("ytd", anchor).from)).toBe("2026-01-01");
  });
  it("leaves all-time unbounded", () => {
    expect(resolveRange("all", anchor).from).toBeNull();
  });
  it("builds a previous window of equal length", () => {
    const prev = previousWindow(resolveRange("7d", anchor));
    expect(dayKey(prev.from)).toBe("2026-08-27");
    expect(dayKey(prev.to)).toBe("2026-09-02");
  });
});

describe("assignWeekYears", () => {
  const tok = (day, month, year = null) => ({ day, month, year, hasYear: year !== null });
  const iso = (d) => d.toISOString().slice(0, 10);
  const today = new Date(Date.UTC(2026, 1, 10)); // 10 Feb 2026

  it("rolls the year forward when a run crosses December into January", () => {
    const dates = assignWeekYears([tok(13, 10), tok(4, 11), tok(1, 0), tok(8, 0)], today);
    expect(dates.map(iso)).toEqual(["2025-11-13", "2025-12-04", "2026-01-01", "2026-01-08"]);
  });

  it("keeps the run in ascending order, which is the whole point", () => {
    const dates = assignWeekYears([tok(13, 10), tok(1, 0)], today);
    expect(dates[1] > dates[0]).toBe(true);
  });

  it("pulls a run back a year rather than dating it in the future", () => {
    const dates = assignWeekYears([tok(3, 6), tok(10, 6)], today); // Jul, but today is Feb
    expect(dates.map(iso)).toEqual(["2025-07-03", "2025-07-10"]);
  });

  it("never leaves the newest week ahead of today", () => {
    const dates = assignWeekYears([tok(1, 8), tok(8, 8), tok(15, 8)], today);
    expect(dates[dates.length - 1] <= today).toBe(true);
  });

  it("respects years that are written down", () => {
    const dates = assignWeekYears([tok(3, 6, 2024), tok(10, 6, 2024)], today);
    expect(dates.map(iso)).toEqual(["2024-07-03", "2024-07-10"]);
  });
});

describe("prettyDate", () => {
  it("formats date with year by default", () => {
    expect(prettyDate(utcDay(2026, 6, 17))).toBe("17 Jul 2026");
  });

  it("omits year when withYear is false", () => {
    expect(prettyDate(utcDay(2026, 8, 3), { withYear: false })).toBe("3 Sep");
    expect(prettyDate(utcDay(2026, 9, 30), false)).toBe("30 Oct");
  });

  it("returns dash for null or undefined", () => {
    expect(prettyDate(null)).toBe("—");
    expect(prettyDate(undefined)).toBe("—");
  });
});

describe("hasExplicitYear", () => {
  it("identifies strings with no year", () => {
    expect(hasExplicitYear("3-Sep")).toBe(false);
    expect(hasExplicitYear("30-Oct")).toBe(false);
    expect(hasExplicitYear("Sep-01")).toBe(false);
    expect(hasExplicitYear("Oct-06")).toBe(false);
    expect(hasExplicitYear("14-Nov")).toBe(false);
    expect(hasExplicitYear(null)).toBe(false);
    expect(hasExplicitYear("")).toBe(false);
  });

  it("identifies strings and dates with explicit year", () => {
    expect(hasExplicitYear("17.07.2026")).toBe(true);
    expect(hasExplicitYear("20-Aug-26")).toBe(true);
    expect(hasExplicitYear("24-Nov-25")).toBe(true);
    expect(hasExplicitYear("5/13/26")).toBe(true);
    expect(hasExplicitYear("2026-07-03")).toBe(true);
    expect(hasExplicitYear(new Date())).toBe(true);
  });
});

