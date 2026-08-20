import { describe, expect, it } from "vitest";
import {
  CLAIM_MIN_AGE_HOURS,
  CLAIM_ORDER_TYPE_META,
  CLAIM_STATUS_META,
  CLAIM_WINDOW_DAYS,
  claimEligibleBefore,
  claimNumberFrom,
  claimWindowStart,
  isClaimClosed,
} from "./claims";

describe("isClaimClosed", () => {
  it("treats a decided claim as closed", () => {
    expect(isClaimClosed("APPROVED")).toBe(true);
    expect(isClaimClosed("REJECTED")).toBe(true);
  });

  it("treats a claim still in the queue as open", () => {
    expect(isClaimClosed("SUBMITTED")).toBe(false);
    expect(isClaimClosed("UNDER_REVIEW")).toBe(false);
    // Escalated is waiting on the store, not finished — reopening it must stay
    // possible, otherwise a store's late "yes" could never be applied.
    expect(isClaimClosed("ESCALATED")).toBe(false);
  });
});

describe("claim window", () => {
  const now = new Date("2026-08-20T12:00:00");

  it("starts CLAIM_WINDOW_DAYS back, at the start of that day", () => {
    const start = claimWindowStart(now);
    expect(start.getHours()).toBe(0);
    expect(start.getMinutes()).toBe(0);

    // Compared as calendar days: the start is deliberately widened to midnight
    // so the whole of the 90th day stays claimable, which makes the elapsed
    // milliseconds 90 days plus however far into today it is.
    const expected = new Date(now);
    expected.setDate(expected.getDate() - CLAIM_WINDOW_DAYS);
    expect(start.toDateString()).toBe(expected.toDateString());
  });

  it("only allows clicks older than the tracking grace period", () => {
    const cutoff = claimEligibleBefore(now);
    const hours = (now.getTime() - cutoff.getTime()) / 3_600_000;
    expect(hours).toBe(CLAIM_MIN_AGE_HOURS);
  });

  it("puts a click from an hour ago outside the eligible range", () => {
    const anHourAgo = new Date(now.getTime() - 3_600_000);
    expect(anHourAgo > claimEligibleBefore(now)).toBe(true);
  });

  it("puts a click from a week ago inside the eligible range", () => {
    const aWeekAgo = new Date(now.getTime() - 7 * 86_400_000);
    expect(aWeekAgo <= claimEligibleBefore(now)).toBe(true);
    expect(aWeekAgo >= claimWindowStart(now)).toBe(true);
  });

  it("puts a click from a year ago outside the window", () => {
    const aYearAgo = new Date(now.getTime() - 365 * 86_400_000);
    expect(aYearAgo < claimWindowStart(now)).toBe(true);
  });
});

describe("claimNumberFrom", () => {
  it("derives a short uppercase reference from the row id", () => {
    expect(claimNumberFrom("clx1a2b3c4d5e6f7g8h9")).toBe("CLM-F7G8H9");
  });

  it("is stable for the same id", () => {
    const id = "clx1a2b3c4d5e6f7g8h9";
    expect(claimNumberFrom(id)).toBe(claimNumberFrom(id));
  });

  it("differs for different ids", () => {
    expect(claimNumberFrom("aaaaaaaaaaaa")).not.toBe(claimNumberFrom("bbbbbbbbbbbb"));
  });
});

describe("labels", () => {
  it("covers every status with a label, tone and explanation", () => {
    for (const meta of Object.values(CLAIM_STATUS_META)) {
      expect(meta.label.length).toBeGreaterThan(0);
      expect(meta.tone).toMatch(/bg-/);
      expect(meta.help.length).toBeGreaterThan(0);
    }
  });

  it("covers both order types", () => {
    expect(Object.keys(CLAIM_ORDER_TYPE_META).sort()).toEqual([
      "AFFILIATE_ORDER",
      "OWN_ORDER",
    ]);
  });
});
