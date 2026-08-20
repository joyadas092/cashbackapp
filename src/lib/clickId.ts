/**
 * Clicks are cuids — 25 characters of mostly-noise, with the entropy in the
 * tail. The last 8 characters are what distinguishes two clicks in a list, and
 * are short enough to read out or paste into a support ticket.
 *
 * This is a display format, not an identifier: always resolve a claim back to
 * the full Click.id, which is what Cuelinks attribution is keyed on
 * (subid = c_<clickId>).
 */
export function shortClickId(id: string): string {
  return id.length <= 10 ? id.toUpperCase() : id.slice(-8).toUpperCase();
}
