export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** Rounded to whole rupees. For headline aggregates, where paise are noise. */
export function formatInr(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Always shows paise. Use wherever the figure is money a specific person is
 * owed — a rounded balance invites "why is my number different?", and rounding
 * a per-referral commission of ₹62.28 to ₹62 is simply wrong.
 */
export function formatInrExact(amount: number | string): string {
  const value = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}
