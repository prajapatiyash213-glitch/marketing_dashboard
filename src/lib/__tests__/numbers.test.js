import { describe, it, expect } from "vitest";
import { parseCurrency, parsePercent, parseNumber } from "../numbers.js";

describe("parseCurrency", () => {
  it("strips symbols and separators", () => {
    expect(parseCurrency("₹ 12,50,000")).toBe(1250000);
    expect(parseCurrency("$1,200.50")).toBe(1200.5);
  });
  it("expands magnitude words", () => {
    expect(parseCurrency("2.5 Cr")).toBe(25000000);
    expect(parseCurrency("12 lakh")).toBe(1200000);
    expect(parseCurrency("45K")).toBe(45000);
    expect(parseCurrency("1.2M")).toBe(1200000);
  });
  it("passes numbers through untouched", () => {
    expect(parseCurrency(98000)).toBe(98000);
  });
  it("returns zero rather than NaN for junk", () => {
    expect(parseCurrency("TBD")).toBe(0);
    expect(parseCurrency(null)).toBe(0);
    expect(parseCurrency(Infinity)).toBe(0);
  });
  it("takes the lower bound of a range", () => {
    expect(parseCurrency("10-20 lakh")).toBe(1000000);
  });
});

describe("parsePercent", () => {
  it("reads both 0.42 and 42% as forty two percent", () => {
    expect(parsePercent(0.42)).toBeCloseTo(42);
    expect(parsePercent("42%")).toBe(42);
    expect(parsePercent(42)).toBe(42);
  });
  it("returns null for blanks so gaps stay gaps", () => {
    expect(parsePercent("")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });
});

describe("parseNumber", () => {
  it("parses K and M multipliers correctly", () => {
    expect(parseNumber("1K")).toBe(1000);
    expect(parseNumber("5.2K")).toBe(5200);
    expect(parseNumber("9.8K")).toBe(9800);
    expect(parseNumber("11K")).toBe(11000);
    expect(parseNumber("2K")).toBe(2000);
    expect(parseNumber("4.3K")).toBe(4300);
    expect(parseNumber("1.5M")).toBe(1500000);
  });

  it("handles NA and blanks as null", () => {
    expect(parseNumber("NA")).toBeNull();
    expect(parseNumber("na")).toBeNull();
    expect(parseNumber("-")).toBeNull();
    expect(parseNumber("—")).toBeNull();
    expect(parseNumber("")).toBeNull();
    expect(parseNumber(null)).toBeNull();
  });

  it("parses regular numbers and rich strings with notes", () => {
    expect(parseNumber(812)).toBe(812);
    expect(parseNumber("812")).toBe(812);
    expect(parseNumber("348 (DF - 204, NF - 146)")).toBe(348);
    expect(parseNumber("865 (470, 398)")).toBe(865);
    expect(parseNumber("14, 3, 31 (41)")).toBe(41);
    expect(parseNumber("14, 1, (74) 64")).toBe(64);
    expect(parseNumber("0, 0, 31")).toBe(31);
    expect(parseNumber("0,0, 35")).toBe(35);
    expect(parseNumber("0, 0, 32")).toBe(32);
    expect(parseNumber("14, 1 35")).toBe(35);
  });
});
