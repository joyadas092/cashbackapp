import { describe, expect, it } from "vitest";
import {
  campaignEligibility,
  cashbackDisplayTextFor,
  effectiveCashbackPct,
  isStubCampaignId,
} from "./eligibility";

const usable = {
  cuelinksCampaignId: "1",
  accessStatus: "approved" as const,
  subIdsAllowed: true,
  cashbackPublishersAllowed: true,
};

describe("campaignEligibility", () => {
  it("accepts an approved campaign that allows sub ids and cashback publishers", () => {
    const result = campaignEligibility(usable);
    expect(result.eligible).toBe(true);
    expect(result.reasons).toEqual([]);
  });

  it("accepts an open campaign — no application is needed to promote one", () => {
    expect(campaignEligibility({ ...usable, accessStatus: "open" }).eligible).toBe(true);
  });

  it.each(["pending", "not_applied", "rejected", "restricted"])(
    "rejects a campaign whose access is %s",
    (accessStatus) => {
      const result = campaignEligibility({ ...usable, accessStatus });
      expect(result.eligible).toBe(false);
      expect(result.reasons.join(" ")).toMatch(/access/i);
    }
  );

  it("rejects a campaign that strips sub ids, because attribution becomes impossible", () => {
    const result = campaignEligibility({ ...usable, subIdsAllowed: false });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/sub id/i);
  });

  it("rejects a campaign that bars cashback publishers", () => {
    const result = campaignEligibility({ ...usable, cashbackPublishersAllowed: false });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/cashback publishers/i);
  });

  it("reports every blocking reason at once, not just the first", () => {
    // Amazon India: pending, strips sub ids, and bars cashback publishers.
    const result = campaignEligibility({
      cuelinksCampaignId: "817",
      accessStatus: "pending",
      subIdsAllowed: false,
      cashbackPublishersAllowed: false,
    });
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(3);
  });

  it("rejects a seed placeholder however healthy the other flags look", () => {
    const result = campaignEligibility({ ...usable, cuelinksCampaignId: "stub_flipkart" });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/placeholder/i);
  });

  it("rejects a store with no campaign at all", () => {
    expect(campaignEligibility(null).eligible).toBe(false);
    expect(campaignEligibility(undefined).eligible).toBe(false);
  });

  it("rejects a campaign that has never been synced rather than assuming it pays", () => {
    const result = campaignEligibility({ cuelinksCampaignId: "1" });
    expect(result.eligible).toBe(false);
    expect(result.reasons.join(" ")).toMatch(/never been synced/i);
  });

  it("does not block on unknown missing-transaction or cookie settings", () => {
    // Those affect claims and attribution windows, not whether money arrives.
    expect(campaignEligibility({ ...usable }).eligible).toBe(true);
  });
});

describe("isStubCampaignId", () => {
  it("spots seeded placeholders", () => {
    expect(isStubCampaignId("stub_flipkart")).toBe(true);
    expect(isStubCampaignId("1")).toBe(false);
    expect(isStubCampaignId(null)).toBe(false);
    expect(isStubCampaignId(undefined)).toBe(false);
  });
});

describe("effectiveCashbackPct", () => {
  it("funds Flipkart's badge from the real payout and customer share", () => {
    // 6% payout, 70% customer share -> 4.2%, not the 8% previously advertised.
    expect(effectiveCashbackPct(6, 70)).toBe(4.2);
  });

  it("matches AJIO, where payout and advertised rate happened to align", () => {
    expect(effectiveCashbackPct(9, 60)).toBe(5.4);
  });

  it("rounds to two decimals", () => {
    expect(effectiveCashbackPct(3.17, 65)).toBe(2.06);
  });

  it("returns null rather than guessing when the payout is unknown", () => {
    expect(effectiveCashbackPct(null, 70)).toBeNull();
    expect(effectiveCashbackPct(undefined, 70)).toBeNull();
  });

  it("returns null when the customer share is unknown", () => {
    expect(effectiveCashbackPct(6, null)).toBeNull();
  });

  it("returns null for a non-earning payout", () => {
    expect(effectiveCashbackPct(0, 70)).toBeNull();
    expect(effectiveCashbackPct(-1, 70)).toBeNull();
  });

  it("returns null for non-finite input", () => {
    expect(effectiveCashbackPct(Number.NaN, 70)).toBeNull();
    expect(effectiveCashbackPct(Number.POSITIVE_INFINITY, 70)).toBeNull();
  });
});

describe("cashbackDisplayTextFor", () => {
  it("builds the badge from the funded rate", () => {
    expect(cashbackDisplayTextFor(4.2)).toBe("Up to 4.2% Cashback");
  });

  it("says the rate is pending rather than claiming zero cashback", () => {
    expect(cashbackDisplayTextFor(null)).toBe("Cashback rate pending");
    expect(cashbackDisplayTextFor(0)).toBe("Cashback rate pending");
  });
});
