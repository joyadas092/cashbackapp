import { describe, expect, it } from "vitest";
import { PAN_PATTERN, maskPan, profileUpdateSchema } from "./schemas";

describe("PAN_PATTERN", () => {
  it("accepts a well-formed PAN", () => {
    expect(PAN_PATTERN.test("ABCDE1234F")).toBe(true);
  });

  it.each([
    ["too short", "ABCDE123F"],
    ["too long", "ABCDE12345F"],
    ["digits where letters belong", "ABC1E1234F"],
    ["letters where digits belong", "ABCDEA234F"],
    ["lowercase", "abcde1234f"],
    ["empty", ""],
    ["padded with spaces", " ABCDE1234F "],
  ])("rejects %s", (_label, value) => {
    expect(PAN_PATTERN.test(value)).toBe(false);
  });
});

describe("maskPan", () => {
  it("keeps the first five and last character", () => {
    expect(maskPan("ABCDE1234F")).toBe("ABCDE****F");
  });

  it("uppercases before masking", () => {
    expect(maskPan("abcde1234f")).toBe("ABCDE****F");
  });

  it.each([[null], [undefined], [""], ["nonsense"]])(
    "renders a dash rather than leaking a malformed value (%s)",
    (value) => {
      expect(maskPan(value as string | null | undefined)).toBe("—");
    }
  );
});

describe("profileUpdateSchema bankDetails.pan", () => {
  const parse = (pan: string) =>
    profileUpdateSchema.safeParse({ bankDetails: { pan } });

  it("uppercases a lowercase PAN rather than rejecting it for casing", () => {
    const result = parse("abcde1234f");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bankDetails?.pan).toBe("ABCDE1234F");
  });

  it("trims surrounding whitespace", () => {
    const result = parse("  ABCDE1234F  ");
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.bankDetails?.pan).toBe("ABCDE1234F");
  });

  it("treats an empty string as not provided rather than invalid", () => {
    expect(parse("").success).toBe(true);
  });

  it("rejects a malformed PAN", () => {
    expect(parse("ABC12").success).toBe(false);
  });

  it("allows bank details with no PAN at all", () => {
    const result = profileUpdateSchema.safeParse({
      bankDetails: { accountHolder: "A Shopper", ifsc: "ABCD0123456" },
    });
    expect(result.success).toBe(true);
  });
});
