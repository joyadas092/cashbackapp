import type { ClaimOrderType, ClaimStatus } from "@prisma/client";

/**
 * Missing-cashback claims.
 *
 * A claim is anchored to a Click, not to free text. The click id is what
 * Cuelinks attribution is keyed on (subid = c_<clickId>), so a claim naming one
 * can actually be chased with the network; a claim describing "I shopped at
 * Flipkart on Tuesday" cannot.
 */

export const CLAIM_STATUS_META: Record<ClaimStatus, { label: string; tone: string; help: string }> =
  {
    SUBMITTED: {
      label: "Submitted",
      tone: "bg-sky-50 text-sky-700",
      help: "We have your claim and will pick it up shortly.",
    },
    UNDER_REVIEW: {
      label: "Under Review",
      tone: "bg-amber-50 text-amber-700",
      help: "We are checking your click and order against the store's records.",
    },
    ESCALATED: {
      label: "With the Store",
      tone: "bg-violet-50 text-violet-700",
      help: "Raised with the store. They can take a few weeks to respond.",
    },
    APPROVED: {
      label: "Approved",
      tone: "bg-cashlime-50 text-cashlime-700",
      help: "Tracked and credited to your wallet.",
    },
    REJECTED: {
      label: "Rejected",
      tone: "bg-rose-50 text-rose-600",
      help: "The store could not confirm this order came through your click.",
    },
  };

export const CLAIM_ORDER_TYPE_META: Record<ClaimOrderType, { label: string; help: string }> = {
  OWN_ORDER: {
    label: "My own order",
    help: "You shopped through the site and your cashback is missing.",
  },
  AFFILIATE_ORDER: {
    label: "Order through my shared link",
    help: "Someone bought through a profit link you shared and your commission is missing.",
  },
};

/** Statuses where the claim is finished and no longer moves. */
export function isClaimClosed(status: ClaimStatus): boolean {
  return status === "APPROVED" || status === "REJECTED";
}

/**
 * How long after a click a claim can still be raised.
 *
 * Networks stop accepting missing-transaction queries after a window, so a
 * claim older than this cannot be chased even if it is genuine. Refusing at
 * submission is kinder than accepting it and rejecting weeks later.
 */
export const CLAIM_WINDOW_DAYS = 90;

/**
 * The shortest wait before a claim is worth raising. Tracking legitimately
 * takes up to 48 hours, so most claims filed inside that window would be
 * closed as "not missing, just slow".
 */
export const CLAIM_MIN_AGE_HOURS = 48;

export function claimWindowStart(now: Date = new Date()): Date {
  const start = new Date(now);
  start.setDate(start.getDate() - CLAIM_WINDOW_DAYS);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function claimEligibleBefore(now: Date = new Date()): Date {
  return new Date(now.getTime() - CLAIM_MIN_AGE_HOURS * 60 * 60 * 1000);
}

/**
 * Human-facing claim reference, e.g. "CLM-4F82K1".
 *
 * Derived from the row's own cuid rather than a counter: a sequential number
 * would leak how many claims the platform has, and a counter needs a lock.
 */
export function claimNumberFrom(id: string): string {
  return `CLM-${id.slice(-6).toUpperCase()}`;
}
