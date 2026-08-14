import { describe, expect, it } from "vitest";
import { evaluateReferralEligibility } from "./engine";

const BASE_NOW = new Date("2026-08-14T00:00:00Z");

describe("evaluateReferralEligibility", () => {
  it("is eligible within the duration window with no cap hit", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-08-01T00:00:00Z"), totalEarned: 0 },
      rule: { durationDays: 90, maxTotalEarning: 500 },
      saleAmount: 1000,
      rawReferralAmount: 25,
      now: BASE_NOW,
    });
    expect(result).toEqual({ eligible: true, creditedAmount: 25 });
  });

  it("is ineligible once past the duration window", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-01-01T00:00:00Z"), totalEarned: 0 },
      rule: { durationDays: 90 },
      saleAmount: 1000,
      rawReferralAmount: 25,
      now: BASE_NOW,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("outside_duration_window");
  });

  it("is eligible exactly on the last day of the window", () => {
    const createdAt = new Date("2026-08-14T00:00:00Z");
    const now = new Date("2026-08-14T00:00:00Z");
    const result = evaluateReferralEligibility({
      referral: { createdAt, totalEarned: 0 },
      rule: { durationDays: 0 },
      saleAmount: 1000,
      rawReferralAmount: 25,
      now,
    });
    expect(result.eligible).toBe(true);
  });

  it("clips the credited amount to remaining cap headroom", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-08-01T00:00:00Z"), totalEarned: 480 },
      rule: { durationDays: 90, maxTotalEarning: 500 },
      saleAmount: 1000,
      rawReferralAmount: 30,
      now: BASE_NOW,
    });
    expect(result).toEqual({ eligible: true, creditedAmount: 20 });
  });

  it("is ineligible once the cap is already fully used", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-08-01T00:00:00Z"), totalEarned: 500 },
      rule: { durationDays: 90, maxTotalEarning: 500 },
      saleAmount: 1000,
      rawReferralAmount: 30,
      now: BASE_NOW,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("max_total_earning_reached");
  });

  it("is ineligible below the minimum order value", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-08-01T00:00:00Z"), totalEarned: 0 },
      rule: { minOrderValue: 500 },
      saleAmount: 200,
      rawReferralAmount: 10,
      now: BASE_NOW,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("below_min_order_value");
  });

  it("is eligible with no duration/cap/min-order constraints at all", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2020-01-01T00:00:00Z"), totalEarned: 10000 },
      rule: {},
      saleAmount: 5,
      rawReferralAmount: 1,
      now: BASE_NOW,
    });
    expect(result).toEqual({ eligible: true, creditedAmount: 1 });
  });

  it("is ineligible when the referral rule is inactive", () => {
    const result = evaluateReferralEligibility({
      referral: { createdAt: new Date("2026-08-01T00:00:00Z"), totalEarned: 0 },
      rule: { isActive: false },
      saleAmount: 1000,
      rawReferralAmount: 25,
      now: BASE_NOW,
    });
    expect(result.eligible).toBe(false);
    expect(result.reason).toBe("referral_rule_inactive");
  });
});
