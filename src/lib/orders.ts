/**
 * Order confirmation estimates.
 *
 * Cashback isn't confirmed when the order is placed — the store has to validate
 * it after its return window closes. Stores publish that lag as free text on
 * their page ("60 - 90 Days"), and a cashback rule can also carry an explicit
 * validityDays. Neither is guaranteed to be set, so every function here returns
 * null rather than inventing a date: showing "estimated 12 Aug" when nothing
 * backs it is worse than showing nothing.
 */

/**
 * Upper bound in days from a human string like "60 - 90 Days", "45 Days" or
 * "24 - 48 Hours". Returns null when there's no number to read.
 */
export function parseDurationDays(text: string | null | undefined): number | null {
  if (!text) return null;

  const numbers = text.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) return null;

  // Take the upper bound of a range, so an estimate is never optimistic.
  const value = Math.max(...numbers.map(Number));
  if (!Number.isFinite(value) || value <= 0) return null;

  if (/hour/i.test(text)) return Math.max(1, Math.ceil(value / 24));
  if (/week/i.test(text)) return Math.ceil(value * 7);
  if (/month/i.test(text)) return Math.ceil(value * 30);
  return Math.ceil(value);
}

export interface ConfirmationEstimateInput {
  /** When the order was placed, or when we first saw it. */
  placedAt: Date;
  /** CashbackRule.validityDays — an explicit policy, so it wins. */
  validityDays?: number | null;
  /** Store.paymentTime, e.g. "60 - 90 Days". */
  paymentTime?: string | null;
}

/** The date cashback is expected to be confirmed, or null if we can't say. */
export function estimateConfirmationDate({
  placedAt,
  validityDays,
  paymentTime,
}: ConfirmationEstimateInput): Date | null {
  const days = validityDays ?? parseDurationDays(paymentTime);
  if (days === null) return null;

  const estimate = new Date(placedAt);
  estimate.setDate(estimate.getDate() + days);
  return estimate;
}

/** Whole days from now until `date`. Negative once the date has passed. */
export function daysUntil(date: Date, now: Date = new Date()): number {
  const startOfDay = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  const diffMs = startOfDay(date).getTime() - startOfDay(now).getTime();
  return Math.round(diffMs / (24 * 60 * 60 * 1000));
}
