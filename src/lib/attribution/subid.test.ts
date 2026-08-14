import { describe, expect, it } from "vitest";
import { buildSubIds } from "./subid";

describe("buildSubIds", () => {
  it("keys subid off the click id, not the user id", () => {
    const result = buildSubIds({ clickId: "clk_abc123", userId: "u123", linkType: "direct_cashback" });
    expect(result.subid).toBe("c_clk_abc123");
  });

  it("produces a different subid for two different clicks by the same user", () => {
    const a = buildSubIds({ clickId: "clk_1", userId: "u123", linkType: "direct_cashback" });
    const b = buildSubIds({ clickId: "clk_2", userId: "u123", linkType: "direct_cashback" });
    expect(a.subid).not.toBe(b.subid);
  });

  it("sets subid2 to the link type", () => {
    const result = buildSubIds({ clickId: "clk_1", linkType: "visit_store" });
    expect(result.subid2).toBe("visit_store");
  });

  it("omits subid5 when userId is absent (logged-out visit)", () => {
    const result = buildSubIds({ clickId: "clk_1", userId: null, linkType: "visit_store" });
    expect(result.subid5).toBeUndefined();
  });

  it("includes subid3 for profit links", () => {
    const result = buildSubIds({
      clickId: "clk_1",
      userId: "u123",
      linkType: "profit_link",
      profitLinkId: "pl1",
    });
    expect(result.subid3).toBe("pl_pl1");
  });

  it("omits subid3 when there is no profit link", () => {
    const result = buildSubIds({ clickId: "clk_1", userId: "u123", linkType: "direct_cashback" });
    expect(result.subid3).toBeUndefined();
  });

  it("is deterministic for identical input", () => {
    const input = { clickId: "clk_1", userId: "u123", linkType: "direct_cashback" } as const;
    expect(buildSubIds(input)).toEqual(buildSubIds(input));
  });

  it("never embeds PII-shaped values (email/phone) in any subid", () => {
    const result = buildSubIds({
      clickId: "clk_1",
      userId: "u123",
      linkType: "profit_link",
      profitLinkId: "pl1",
    });
    const values = Object.values(result).join(" ");
    expect(values).not.toMatch(/@/); // no email-shaped strings
    expect(values).not.toMatch(/\d{10,}/); // no raw phone-number-shaped digit runs
  });
});
