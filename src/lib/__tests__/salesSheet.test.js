import { describe, it, expect } from "vitest";
import { parseSalesSheet, remapSheet } from "../salesSheet.js";
import { dayKey } from "../dates.js";

const ctx = { fileName: "Leads Sheet.xlsx", sheetName: "Main Leads Sheet" };

const ROWS = [
  ["First Name", "Last Name", "Company Name", "Lead Stage", "Lead Source", "Lead Status", "Deal Value", "Date"],
  ["Meera", "Iyer", "Arcelia Industries", "Qualified", "Organic Search", "Meeting booked", "₹12,50,000", "03/04/2026"],
  ["Rohan", "Shah", "Novaris Technologies", "Disqualified", "Outbound", "Not interested", "8 lakh", "15/04/2026"],
  [null, null, null, null, null, null, null, null],
  ["Priya", "Nair", "Karyan Logistics", "Closed Won", "Referral", "Won", 2100000, "22/04/2026"],
];

describe("parseSalesSheet", () => {
  const { leads, mapping } = parseSalesSheet(ROWS, ctx);

  it("joins first and last name", () => {
    expect(leads[0].name).toBe("Meera Iyer");
  });

  it("skips blank rows", () => {
    expect(leads).toHaveLength(3);
  });

  it("normalises stages, including the disqualified trap", () => {
    expect(leads.map((l) => l.stage)).toEqual(["Qualified", "Closed Lost", "Closed Won"]);
  });

  it("keeps the original stage wording for audit", () => {
    expect(leads[1].stageRaw).toBe("Disqualified");
  });

  it("parses currency in every form present", () => {
    expect(leads.map((l) => l.value)).toEqual([1250000, 800000, 2100000]);
  });

  it("detects day-first dates from the column, not row by row", () => {
    expect(mapping.dayFirst).toEqual({ dayFirst: true, certain: true });
    expect(dayKey(leads[0].date)).toBe("2026-04-03");
  });

  it("gives every lead a unique, stable id", () => {
    expect(leads[0].id).toBe("Leads Sheet.xlsx::Main Leads Sheet::1");
    expect(new Set(leads.map((l) => l.id)).size).toBe(3);
  });

  it("returns null when the sheet holds no leads", () => {
    expect(parseSalesSheet([["Week", "Views"], [1, 2]], ctx)).toBeNull();
  });
});

describe("remapSheet", () => {
  it("lets a wrong column be corrected without re-uploading", () => {
    const rows = [
      ["Name", "Account", "Employer"],
      ["Meera Iyer", "AC-1042", "Arcelia Industries"],
    ];
    expect(parseSalesSheet(rows, ctx).leads[0].company).toBe("AC-1042");
    expect(remapSheet(rows, ctx, { company: 2 }).leads[0].company).toBe("Arcelia Industries");
  });

  it("can clear a field entirely", () => {
    const rows = [["Name", "Company", "Value"], ["Meera", "Arcelia", "999"]];
    expect(remapSheet(rows, ctx, { value: "" }).leads[0].value).toBe(0);
  });
});
