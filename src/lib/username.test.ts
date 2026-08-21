import { describe, expect, it } from "vitest";
import {
  GENERATED_USERNAME_LENGTH,
  USERNAME_MAX_LENGTH,
  USERNAME_MIN_LENGTH,
  generateUsername,
  isReservedUsername,
  normalizeUsername,
  validateUsername,
} from "./username";

describe("normalizeUsername", () => {
  it("lowercases and trims, so /go/Alice and /go/alice are one person", () => {
    expect(normalizeUsername("  ALICE  ")).toBe("alice");
  });
});

describe("validateUsername", () => {
  it("accepts a plain lowercase handle", () => {
    expect(validateUsername("alice99").valid).toBe(true);
  });

  it("accepts a handle given in uppercase, since it is normalised first", () => {
    expect(validateUsername("ALICE").valid).toBe(true);
  });

  it("rejects an empty handle", () => {
    expect(validateUsername("   ").valid).toBe(false);
  });

  it(`rejects anything shorter than ${USERNAME_MIN_LENGTH} characters`, () => {
    expect(validateUsername("ab").valid).toBe(false);
  });

  it(`rejects anything longer than ${USERNAME_MAX_LENGTH} characters`, () => {
    expect(validateUsername("a".repeat(USERNAME_MAX_LENGTH + 1)).valid).toBe(false);
  });

  it.each([
    ["a space", "my name"],
    ["a dot", "my.name"],
    ["a hyphen", "my-name"],
    ["an underscore", "my_name"],
    ["a slash, which would break the URL path", "my/name"],
    ["a percent, which would look like an escape", "my%20name"],
  ])("rejects %s", (_label, value) => {
    expect(validateUsername(value).valid).toBe(false);
  });

  it("rejects route names that would make a URL ambiguous", () => {
    expect(validateUsername("admin").valid).toBe(false);
    expect(validateUsername("dashboard").valid).toBe(false);
    expect(validateUsername("go").valid).toBe(false);
  });

  it("rejects handles that invite impersonation", () => {
    expect(validateUsername("support").valid).toBe(false);
    expect(validateUsername("official").valid).toBe(false);
  });

  it("returns a message a user can act on", () => {
    const result = validateUsername("my name");
    expect(result.error).toMatch(/lowercase letters and numbers/i);
  });
});

describe("isReservedUsername", () => {
  it("ignores case and surrounding space", () => {
    expect(isReservedUsername("  ADMIN ")).toBe(true);
  });

  it("leaves ordinary handles alone", () => {
    expect(isReservedUsername("alice")).toBe(false);
  });
});

describe("generateUsername", () => {
  it("is the configured length by default", () => {
    expect(generateUsername()).toHaveLength(GENERATED_USERNAME_LENGTH);
  });

  it("honours an explicit length", () => {
    expect(generateUsername(8)).toHaveLength(8);
  });

  it("avoids characters people transcribe wrongly", () => {
    // 0/O and 1/l/I are the pairs that get mistyped from a screenshot.
    for (let i = 0; i < 200; i++) {
      expect(generateUsername(12)).not.toMatch(/[01oil]/);
    }
  });

  it("only produces handles that pass validation", () => {
    for (let i = 0; i < 100; i++) {
      expect(validateUsername(generateUsername()).valid).toBe(true);
    }
  });

  it("does not return the same handle every time", () => {
    const seen = new Set(Array.from({ length: 50 }, () => generateUsername()));
    expect(seen.size).toBeGreaterThan(1);
  });
});
