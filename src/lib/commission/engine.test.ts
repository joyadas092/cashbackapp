import { describe, expect, it } from "vitest";
import { calculateDistribution, validateCommissionRule } from "./engine";

describe("validateCommissionRule", () => {
  it("accepts a rule that sums to exactly 100%", () => {
    expect(() =>
      validateCommissionRule({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 })
    ).not.toThrow();
  });

  it("accepts a rule that sums to less than 100%", () => {
    expect(() =>
      validateCommissionRule({ customerPct: 40, profitLinkPct: 10, referralPct: 5, platformPct: 20 })
    ).not.toThrow();
  });

  it("rejects a rule that sums to more than 100%", () => {
    expect(() =>
      validateCommissionRule({ customerPct: 70, profitLinkPct: 20, referralPct: 10, platformPct: 20 })
    ).toThrow(/exceeds 100%/);
  });

  it("rejects a negative percentage", () => {
    expect(() =>
      validateCommissionRule({ customerPct: -5, profitLinkPct: 15, referralPct: 5, platformPct: 20 })
    ).toThrow(/cannot be negative/);
  });
});

describe("calculateDistribution", () => {
  it("splits ₹500 commission per the spec's worked example (60/15/5/20)", () => {
    const result = calculateDistribution({
      commissionAmount: 500,
      rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 },
    });
    expect(result).toEqual({ customer: 300, profitLink: 75, referral: 25, platform: 100 });
  });

  it("splits ₹100 commission per the spec's Flipkart example (70/10/5/15)", () => {
    const result = calculateDistribution({
      commissionAmount: 100,
      rule: { customerPct: 70, profitLinkPct: 10, referralPct: 5, platformPct: 15 },
    });
    expect(result).toEqual({ customer: 70, profitLink: 10, referral: 5, platform: 15 });
  });

  it("rounds to 2 decimal places on fractional splits", () => {
    const result = calculateDistribution({
      commissionAmount: 33.33,
      rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 },
    });
    expect(result.customer).toBe(20);
    expect(result.profitLink).toBe(5);
    expect(result.referral).toBe(1.67);
    expect(result.platform).toBe(6.67);
  });

  it("caps customer cashback at maxCashback", () => {
    const result = calculateDistribution({
      commissionAmount: 1000,
      rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20, maxCashback: 100 },
    });
    expect(result.customer).toBe(100);
  });

  it("applies fixedAmount as the customer cashback, overriding the percentage", () => {
    const result = calculateDistribution({
      commissionAmount: 500,
      rule: {
        customerPct: 60,
        profitLinkPct: 15,
        referralPct: 5,
        platformPct: 20,
        fixedAmount: 50,
      },
    });
    expect(result.customer).toBe(50);
    // other legs are still percentage-derived from the original commission
    expect(result.profitLink).toBe(75);
  });

  it("clamps fixedAmount to the commission amount if it would exceed it", () => {
    const result = calculateDistribution({
      commissionAmount: 40,
      rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20, fixedAmount: 100 },
    });
    expect(result.customer).toBe(40);
  });

  it("throws when the underlying rule is invalid", () => {
    expect(() =>
      calculateDistribution({
        commissionAmount: 100,
        rule: { customerPct: 70, profitLinkPct: 20, referralPct: 10, platformPct: 20 },
      })
    ).toThrow(/exceeds 100%/);
  });

  it("rejects a negative commission amount", () => {
    expect(() =>
      calculateDistribution({
        commissionAmount: -10,
        rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 },
      })
    ).toThrow(/cannot be negative/);
  });
});
