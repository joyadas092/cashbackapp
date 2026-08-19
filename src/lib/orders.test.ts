import { describe, expect, it } from "vitest";
import { daysUntil, estimateConfirmationDate, parseDurationDays } from "./orders";

describe("parseDurationDays", () => {
  it("reads a plain day count", () => {
    expect(parseDurationDays("45 Days")).toBe(45);
  });

  it("takes the upper bound of a range, so estimates are never optimistic", () => {
    expect(parseDurationDays("60 - 90 Days")).toBe(90);
  });

  it("converts hours to whole days, rounding up", () => {
    expect(parseDurationDays("24 - 48 Hours")).toBe(2);
    expect(parseDurationDays("6 Hours")).toBe(1);
  });

  it("converts weeks and months", () => {
    expect(parseDurationDays("2 Weeks")).toBe(14);
    expect(parseDurationDays("3 Months")).toBe(90);
  });

  it("returns null when there is nothing to read", () => {
    expect(parseDurationDays(null)).toBeNull();
    expect(parseDurationDays(undefined)).toBeNull();
    expect(parseDurationDays("")).toBeNull();
    expect(parseDurationDays("Varies by category")).toBeNull();
    expect(parseDurationDays("0 Days")).toBeNull();
  });
});

describe("estimateConfirmationDate", () => {
  const placedAt = new Date("2026-01-01T00:00:00.000Z");

  it("prefers an explicit validityDays over the store's free text", () => {
    const result = estimateConfirmationDate({
      placedAt,
      validityDays: 30,
      paymentTime: "60 - 90 Days",
    });
    expect(result?.toISOString().slice(0, 10)).toBe("2026-01-31");
  });

  it("falls back to the store's payment time", () => {
    const result = estimateConfirmationDate({ placedAt, paymentTime: "60 - 90 Days" });
    expect(result?.toISOString().slice(0, 10)).toBe("2026-04-01");
  });

  it("returns null rather than inventing a date when nothing is configured", () => {
    expect(estimateConfirmationDate({ placedAt })).toBeNull();
    expect(estimateConfirmationDate({ placedAt, paymentTime: "Varies" })).toBeNull();
  });
});

describe("daysUntil", () => {
  // Built with the local-time constructor on purpose: the function counts
  // calendar days as the viewer experiences them, so UTC literals here would
  // make these assertions depend on the machine's timezone.
  const local = (y: number, m: number, d: number, h = 0, min = 0) => new Date(y, m - 1, d, h, min);

  it("counts whole days ahead", () => {
    expect(daysUntil(local(2026, 1, 11, 23, 0), local(2026, 1, 1, 1, 0))).toBe(10);
  });

  it("ignores the time of day on both sides", () => {
    expect(daysUntil(local(2026, 1, 2, 0, 30), local(2026, 1, 1, 23, 30))).toBe(1);
  });

  it("goes negative once the date has passed", () => {
    expect(daysUntil(local(2026, 1, 1), local(2026, 1, 5))).toBe(-4);
  });
});
