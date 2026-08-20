import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";

/** 8 uppercase hex characters, e.g. "A3F19C2B" — short enough to read aloud. */
export function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

/**
 * A code that isn't already taken.
 *
 * Collisions are vanishingly unlikely across 4 random bytes, but the column is
 * unique, so a clash would fail the whole signup. Shared by registration and
 * admin-side user creation so the two can't drift apart.
 */
export async function generateUniqueReferralCode(): Promise<string> {
  let code = generateReferralCode();
  while (await prisma.user.findUnique({ where: { referralCode: code }, select: { id: true } })) {
    code = generateReferralCode();
  }
  return code;
}
