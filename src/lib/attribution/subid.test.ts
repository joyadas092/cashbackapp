import { describe, expect, it } from "vitest";
import { buildSubIds } from "./subid";

describe("buildSubIds", () => {
  it("builds direct cashback shape for a logged-in user", () => {
    const result = buildSubIds({ userId: "u123", linkType: "direct_cashback" });
    expect(result).toEqual({
      subid: "user_u123",
      subid2: "direct_cashback",
    });
  });

  it("omits subid when userId is absent (logged-out visit)", () => {
    const result = buildSubIds({ userId: null, linkType: "visit_store" });
    expect(result.subid).toBeUndefined();
    expect(result.subid2).toBe("visit_store");
  });

  it("includes subid3 for profit links", () => {
    const result = buildSubIds({
      userId: "u123",
      linkType: "profit_link",
      profitLinkId: "pl1",
    });
    expect(result.subid3).toBe("pl_pl1");
  });

  it("includes subid4 for referral links", () => {
    const result = buildSubIds({
      userId: "u123",
      linkType: "referral",
      referralId: "r1",
    });
    expect(result.subid4).toBe("ref_r1");
  });

  it("is deterministic for identical input", () => {
    const input = { userId: "u123", linkType: "direct_cashback" } as const;
    expect(buildSubIds(input)).toEqual(buildSubIds(input));
  });

  it("never embeds PII-shaped values (email/phone) in any subid", () => {
    const result = buildSubIds({
      userId: "u123",
      linkType: "direct_cashback",
      meta: "campaign_summer_sale",
    });
    const values = Object.values(result).join(" ");
    expect(values).not.toMatch(/@/); // no email-shaped strings
    expect(values).not.toMatch(/\d{10,}/); // no raw phone-number-shaped digit runs
  });
});
