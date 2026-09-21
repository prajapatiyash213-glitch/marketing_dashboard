import { describe, it, expect } from "vitest";
import { mapHeaders, detectHeaderRow, norm } from "../fieldMap.js";

describe("mapHeaders", () => {
  it("does not let Stage steal the Lead Status column", () => {
    const m = mapHeaders(["Name", "Lead Stage", "Lead Status"]);
    expect(m.stage.index).toBe(1);
    expect(m.status.index).toBe(2);
  });

  it("keeps first and last name separate from a full name column", () => {
    const m = mapHeaders(["First Name", "Last Name", "Company Name"]);
    expect(m.firstName.index).toBe(0);
    expect(m.lastName.index).toBe(1);
    expect(m.name).toBeUndefined();
  });

  it("maps the alternative headers used across the different sheets", () => {
    const m = mapHeaders(["Company", "Lead Source", "Annual Revenue", "Current Status"]);
    expect(m.company.index).toBe(0);
    expect(m.source.index).toBe(1);
    expect(m.value.index).toBe(2);
    expect(m.status.index).toBe(3);
  });

  it("marks substring matches as guesses so the UI can flag them", () => {
    const m = mapHeaders(["Prospect Company Name", "Name"]);
    expect(m.name.confidence).toBe("exact");
    expect(m.company.confidence).toBe("guess");
  });

  it("never assigns one column to two fields", () => {
    const m = mapHeaders(["Status"]);
    const used = Object.values(m).map((v) => v.index);
    expect(new Set(used).size).toBe(used.length);
  });

  it("normalises punctuation and casing", () => {
    expect(norm("  Lead_Source / Type ")).toBe("lead source type");
  });
});

describe("detectHeaderRow", () => {
  it("skips title rows above the real header", () => {
    const rows = [
      ["Website Visitors — export", null, null],
      [null, null, null],
      ["Name", "Company", "Lead Stage"],
      ["Meera Iyer", "Arcelia Industries", "Qualified"],
    ];
    expect(detectHeaderRow(rows).headerRow).toBe(2);
  });

  it("returns null when nothing identifies a lead", () => {
    expect(detectHeaderRow([["Week", "Views", "Bounce"], [1, 2, 3]])).toBeNull();
  });
});
