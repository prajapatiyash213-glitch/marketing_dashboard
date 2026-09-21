import { describe, it, expect } from "vitest";
import { normalizeStage } from "../stages.js";

describe("normalizeStage", () => {
  it("maps disqualified to lost, not qualified", () => {
    expect(normalizeStage("Disqualified")).toBe("Closed Lost");
    expect(normalizeStage("Unqualified")).toBe("Closed Lost");
  });

  it("separates won from lost even though both contain closed", () => {
    expect(normalizeStage("Closed Won")).toBe("Closed Won");
    expect(normalizeStage("Closed Lost")).toBe("Closed Lost");
  });

  it("recognises the vocabulary each sheet uses", () => {
    expect(normalizeStage("Proposal Sent")).toBe("Proposal");
    expect(normalizeStage("In Negotiation")).toBe("Proposal");
    expect(normalizeStage("Meeting Booked")).toBe("Qualified");
    expect(normalizeStage("SQL")).toBe("Qualified");
    expect(normalizeStage("New")).toBe("Discovery");
  });

  it("falls back to the status column when stage is blank", () => {
    expect(normalizeStage("", "Won")).toBe("Closed Won");
  });

  it("defaults unknown values to Discovery rather than dropping the lead", () => {
    expect(normalizeStage("Pizza")).toBe("Discovery");
    expect(normalizeStage(null, null)).toBe("Discovery");
  });
});
