import { describe, expect, it } from "vitest";
import {
  dateRangeToParams,
  dateRangeWhere,
  isDateRangeActive,
  parseDateRange,
} from "./dateRangeFilter";

const parse = (query: string) => parseDateRange(new URLSearchParams(query));

describe("parseDateRange", () => {
  it("defaults to all time", () => {
    expect(parse("")).toEqual({ preset: "all", from: "", to: "" });
  });

  it("reads a known preset", () => {
    expect(parse("range=30d").preset).toBe("30d");
  });

  it("falls back to all time on an unknown preset rather than erroring", () => {
    expect(parse("range=bogus").preset).toBe("all");
  });

  it("treats explicit dates as a custom range", () => {
    expect(parse("from=2026-01-01&to=2026-01-31")).toEqual({
      preset: "custom",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("lets an explicit date win over a preset", () => {
    // Someone typed a date; that is what they meant, whatever chip was active.
    expect(parse("range=7d&from=2026-01-01").preset).toBe("custom");
  });

  it("accepts a one-sided range", () => {
    expect(parse("from=2026-01-01")).toEqual({ preset: "custom", from: "2026-01-01", to: "" });
    expect(parse("to=2026-01-31")).toEqual({ preset: "custom", from: "", to: "2026-01-31" });
  });

  it("ignores malformed dates", () => {
    expect(parse("from=01-01-2026").preset).toBe("all");
    expect(parse("from=not-a-date").preset).toBe("all");
    expect(parse("from=2026-13-45").preset).toBe("all");
  });
});

describe("dateRangeWhere", () => {
  it("is null for all time, so the caller adds no filter", () => {
    expect(dateRangeWhere({ preset: "all", from: "", to: "" })).toBeNull();
  });

  it("includes the whole of the end day", () => {
    const where = dateRangeWhere({ preset: "custom", from: "2026-01-01", to: "2026-01-31" });
    expect(where?.gte).toEqual(new Date("2026-01-01T00:00:00"));
    // Exclusive of 1 Feb, so anything during 31 Jan still matches.
    expect(where?.lt).toEqual(new Date("2026-02-01T00:00:00"));
  });

  it("handles a from-only range", () => {
    const where = dateRangeWhere({ preset: "custom", from: "2026-01-01", to: "" });
    expect(where?.gte).toBeInstanceOf(Date);
    expect(where?.lt).toBeUndefined();
  });

  it("returns null when a custom range has neither bound", () => {
    expect(dateRangeWhere({ preset: "custom", from: "", to: "" })).toBeNull();
  });

  it("builds a lower bound for each preset", () => {
    for (const preset of ["today", "7d", "30d", "90d"] as const) {
      const where = dateRangeWhere({ preset, from: "", to: "" });
      expect(where?.gte).toBeInstanceOf(Date);
      expect(where?.gte!.getTime()).toBeLessThanOrEqual(Date.now());
    }
  });

  it("puts 30d earlier than 7d", () => {
    const week = dateRangeWhere({ preset: "7d", from: "", to: "" })!.gte!;
    const month = dateRangeWhere({ preset: "30d", from: "", to: "" })!.gte!;
    expect(month.getTime()).toBeLessThan(week.getTime());
  });
});

describe("isDateRangeActive", () => {
  it("is false only when nothing is narrowed", () => {
    expect(isDateRangeActive({ preset: "all", from: "", to: "" })).toBe(false);
    expect(isDateRangeActive({ preset: "custom", from: "", to: "" })).toBe(false);
    expect(isDateRangeActive({ preset: "7d", from: "", to: "" })).toBe(true);
    expect(isDateRangeActive({ preset: "custom", from: "2026-01-01", to: "" })).toBe(true);
  });
});

describe("dateRangeToParams", () => {
  it("omits the default so URLs stay clean", () => {
    expect(dateRangeToParams({ preset: "all", from: "", to: "" }).toString()).toBe("");
  });

  it("round-trips a preset", () => {
    const params = dateRangeToParams({ preset: "30d", from: "", to: "" });
    expect(parseDateRange(params).preset).toBe("30d");
  });

  it("round-trips a custom range", () => {
    const range = { preset: "custom" as const, from: "2026-01-01", to: "2026-01-31" };
    expect(parseDateRange(dateRangeToParams(range))).toEqual(range);
  });
});
