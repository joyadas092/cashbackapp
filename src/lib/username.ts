import { randomInt } from "node:crypto";
import { prisma } from "@/lib/db";

/**
 * Handles, used in a goURL: /go/<handle>/<store-slug>.
 *
 * There are two kinds and both resolve. `userCode` is assigned at signup and
 * never changes, so a goURL someone wrote down keeps working forever. `username`
 * is the pretty one a user picks in settings, and may change.
 *
 * The point of a goURL is that someone can type it from memory into an address
 * bar without opening the app first, so a handle has to survive being read
 * aloud, written on paper, and typed on a phone keyboard. That drives every
 * rule here: a small alphabet with no lookalike characters, a length that fits
 * in working memory, and case-insensitive matching.
 *
 * The two live in one namespace: a username may not collide with anybody's
 * userCode, and vice versa, or /go/<handle> would be ambiguous.
 */

/**
 * No 0/O, 1/l/I — the pairs people transcribe wrongly when copying a URL from a
 * screenshot or a spoken message.
 */
const SAFE_ALPHABET = "23456789abcdefghjkmnpqrstuvwxyz";

/** Auto-assigned handles are 5 characters; a chosen one may be longer. */
export const GENERATED_USERNAME_LENGTH = 5;
export const USERNAME_MIN_LENGTH = 3;
export const USERNAME_MAX_LENGTH = 20;

/**
 * Lowercase letters and digits only.
 *
 * No dots, hyphens or underscores: the handle sits in a URL path segment beside
 * a store slug, and punctuation is exactly what gets lost when a link is
 * dictated or wrapped by a chat client.
 */
export const USERNAME_PATTERN = /^[a-z0-9]+$/;

/**
 * Words that must never become a username.
 *
 * Two separate concerns. Route names would be ambiguous if the URL scheme ever
 * grows a /<username> form, and impersonation handles ("admin", "support") are
 * how a user gets talked into trusting a link that isn't ours.
 */
const RESERVED = new Set([
  // Route segments, current and plausibly future
  "go", "api", "admin", "dashboard", "login", "logout", "register", "signup", "signin",
  "stores", "store", "p", "ref", "refer", "referral", "share", "share-earn", "refer-earn",
  "pages", "page", "maintenance", "wallet", "help", "claims", "orders", "profile",
  "settings", "activity", "static", "public", "assets", "next", "favicon", "robots",
  "sitemap", "icon", "images", "img", "css", "js",
  // Impersonation
  "support", "team", "official", "staff", "security", "billing", "payments", "noreply",
  "cashback", "cashbackapp", "moderator", "mod", "root", "system", "info", "contact",
  "null", "undefined", "anonymous", "guest", "me", "you", "user", "users", "account",
]);

export function isReservedUsername(username: string): boolean {
  return RESERVED.has(username.trim().toLowerCase());
}

/** Stored and compared lowercase, so /go/ALICE and /go/alice are the same person. */
export function normalizeUsername(username: string): string {
  return username.trim().toLowerCase();
}

export interface UsernameValidation {
  valid: boolean;
  /** Present when invalid; safe to show to the user as-is. */
  error?: string;
}

/** Shape and reserved-word checks only. Availability needs the database. */
export function validateUsername(raw: string): UsernameValidation {
  const username = normalizeUsername(raw);

  if (username.length === 0) {
    return { valid: false, error: "Choose a username." };
  }
  if (username.length < USERNAME_MIN_LENGTH) {
    return { valid: false, error: `Use at least ${USERNAME_MIN_LENGTH} characters.` };
  }
  if (username.length > USERNAME_MAX_LENGTH) {
    return { valid: false, error: `Use at most ${USERNAME_MAX_LENGTH} characters.` };
  }
  if (!USERNAME_PATTERN.test(username)) {
    return { valid: false, error: "Use lowercase letters and numbers only, with no spaces." };
  }
  if (isReservedUsername(username)) {
    return { valid: false, error: "That username is reserved. Please pick another." };
  }
  return { valid: true };
}

/** One random handle from the safe alphabet. Not checked for availability. */
export function generateUsername(length = GENERATED_USERNAME_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) {
    out += SAFE_ALPHABET[randomInt(SAFE_ALPHABET.length)];
  }
  return out;
}

/**
 * Whether a handle is free across both namespaces.
 *
 * Checks userCode as well as username: /go/<handle> resolves against either, so
 * letting a username equal someone else's userCode would silently hand one
 * person's goURL earnings to another.
 */
export async function isHandleAvailable(raw: string, forUserId?: string): Promise<boolean> {
  const handle = normalizeUsername(raw);
  const holder = await prisma.user.findFirst({
    where: { OR: [{ username: handle }, { userCode: handle }] },
    select: { id: true },
  });
  return !holder || holder.id === forUserId;
}

/**
 * A userCode nobody holds yet.
 *
 * The column is unique, so a clash would fail the whole signup. Retries a fixed
 * number of times, then widens the handle rather than looping forever — at
 * 31^5 (~28 million) exhaustion is not a real prospect, but an unbounded loop
 * against a database is not something to leave in a signup path.
 */
export async function generateUniqueUserCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateUsername();
    if (isReservedUsername(candidate)) continue;
    if (await isHandleAvailable(candidate)) return candidate;
  }

  // Longer handle, vastly larger space. Reached only if the short space is
  // genuinely crowded, at which point a longer default is the right answer.
  for (let attempt = 0; attempt < 10; attempt++) {
    const candidate = generateUsername(GENERATED_USERNAME_LENGTH + 3);
    if (await isHandleAvailable(candidate)) return candidate;
  }

  throw new Error("Could not allocate a unique user code");
}

/**
 * The user behind a goURL handle.
 *
 * Username wins over userCode when both could match, but the two namespaces are
 * kept disjoint by isHandleAvailable, so in practice only one ever does.
 */
export async function resolveHandle(raw: string) {
  const handle = normalizeUsername(raw);
  if (!handle) return null;

  return prisma.user.findFirst({
    where: { OR: [{ username: handle }, { userCode: handle }] },
    select: { id: true, name: true, username: true, userCode: true, riskStatus: true },
  });
}
