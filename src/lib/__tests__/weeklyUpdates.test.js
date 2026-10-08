import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  DEFAULT_WEEKLY_UPDATES,
  getWeeklyUpdates,
  saveWeeklyUpdates,
  resetWeeklyUpdates,
} from "../weeklyUpdates.js";

describe("Weekly Updates Persistence & Management", () => {
  let store = {};
  const mockLocalStorage = {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, val) => {
      store[key] = String(val);
    }),
    removeItem: vi.fn((key) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };

  beforeEach(() => {
    store = {};
    globalThis.localStorage = mockLocalStorage;
    globalThis.window = globalThis.window || {};
    globalThis.window.dispatchEvent = vi.fn();
    globalThis.CustomEvent = class CustomEvent {
      constructor(type, init) {
        this.type = type;
        this.detail = init?.detail;
      }
    };
  });

  it("returns default weekly updates when no saved data exists", () => {
    const updates = getWeeklyUpdates();
    expect(updates).toHaveLength(4);
    expect(updates[0].title).toBe("Sales Team Moving To Execution");
    expect(updates[0].metric).toBe("10/M");
    expect(updates[1].title).toBe("The Next 45 Days Are The Primary Email Push");
    expect(updates[1].metric).toBe("2,000");
    expect(updates[1].metricLabel).toBe("Visitor/Week");
    expect(updates[2].title).toBe("Three-stage Email Nurture Chain");
    expect(updates[3].title).toBe("LinkedIn Page Renamed");
  });

  it("saves updated weekly data and persists to localStorage", () => {
    const modified = [...DEFAULT_WEEKLY_UPDATES];
    modified[0] = { ...modified[0], title: "New Q4 Sales Strategy", metric: "15/M" };

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");
    saveWeeklyUpdates(modified);

    const saved = getWeeklyUpdates();
    expect(saved[0].title).toBe("New Q4 Sales Strategy");
    expect(saved[0].metric).toBe("15/M");
    expect(dispatchSpy).toHaveBeenCalled();
  });

  it("resets weekly updates back to defaults cleanly", () => {
    const modified = [...DEFAULT_WEEKLY_UPDATES];
    modified[0] = { ...modified[0], title: "Custom Title" };
    saveWeeklyUpdates(modified);

    expect(getWeeklyUpdates()[0].title).toBe("Custom Title");

    resetWeeklyUpdates();
    expect(getWeeklyUpdates()[0].title).toBe("Sales Team Moving To Execution");
  });
});
