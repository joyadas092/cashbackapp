import { describe, expect, it } from "vitest";
import { validateMerchantUrl, type EligibleStore } from "./urlValidator";

const STORES: EligibleStore[] = [
  { id: "s1", slug: "flipkart", name: "Flipkart", merchantDomains: ["flipkart.com"] },
  { id: "s2", slug: "amazon", name: "Amazon", merchantDomains: ["amazon.in"] },
];

describe("validateMerchantUrl", () => {
  it("matches an exact allowlisted domain", () => {
    const result = validateMerchantUrl("https://flipkart.com/product/123", STORES);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.match.store.slug).toBe("flipkart");
  });

  it("matches a subdomain of an allowlisted domain", () => {
    const result = validateMerchantUrl("https://www.flipkart.com/product/123", STORES);
    expect(result.ok).toBe(true);
  });

  it("matches a deeper subdomain", () => {
    const result = validateMerchantUrl("https://dl.flipkart.com/x", STORES);
    expect(result.ok).toBe(true);
  });

  it("rejects http:// (non-https)", () => {
    const result = validateMerchantUrl("http://flipkart.com/product/123", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects javascript: URLs", () => {
    const result = validateMerchantUrl("javascript:alert(1)", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects data: URLs", () => {
    const result = validateMerchantUrl("data:text/html,<script>alert(1)</script>", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects URLs with embedded credentials", () => {
    const result = validateMerchantUrl("https://user:pass@flipkart.com/", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects IPv4-literal hostnames", () => {
    const result = validateMerchantUrl("https://169.254.169.254/latest/meta-data/", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects IPv6-literal hostnames", () => {
    const result = validateMerchantUrl("https://[::1]/", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects malformed URLs", () => {
    const result = validateMerchantUrl("not a url at all", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects overly long URLs", () => {
    const result = validateMerchantUrl("https://flipkart.com/" + "a".repeat(3000), STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects a non-allowlisted host entirely", () => {
    const result = validateMerchantUrl("https://evil.example.com/", STORES);
    expect(result.ok).toBe(false);
  });

  // The exact bypass a naive .includes()/.endsWith() implementation would allow.
  it("rejects a prefix-lookalike domain (notflipkart.com)", () => {
    const result = validateMerchantUrl("https://notflipkart.com/", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects a suffix-lookalike domain (flipkart.com.evil.net)", () => {
    const result = validateMerchantUrl("https://flipkart.com.evil.net/", STORES);
    expect(result.ok).toBe(false);
  });

  it("rejects a store not present in the eligible list even if a real domain", () => {
    const result = validateMerchantUrl("https://myntra.com/", STORES);
    expect(result.ok).toBe(false);
  });
});
