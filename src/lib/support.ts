import type { TicketStatus } from "@prisma/client";

/**
 * Human-facing ticket reference, e.g. "TKT-48210".
 *
 * Random rather than sequential on purpose: a sequential number leaks how many
 * tickets the platform has and lets one user guess another's reference. The
 * caller retries on collision against the unique constraint, the same way
 * profit-link codes are generated.
 */
export function generateTicketNumber(): string {
  const n = 10000 + Math.floor(Math.random() * 90000);
  return `TKT-${n}`;
}

/**
 * The admin panel used to be dark and needed its own palette here. It is light
 * now, so both surfaces share one set of tones rather than keeping a second
 * copy that can drift.
 */
export const TICKET_STATUS_META: Record<TicketStatus, { label: string; tone: string }> = {
  OPEN: { label: "Open", tone: "bg-sky-50 text-sky-700" },
  IN_PROGRESS: { label: "In Progress", tone: "bg-amber-50 text-amber-700" },
  RESOLVED: { label: "Resolved", tone: "bg-cashlime-50 text-cashlime-700" },
  CLOSED: { label: "Closed", tone: "bg-slate-100 text-slate-500" },
};

/** Categories a user can file a ticket under. Kept in one place so the form,
 *  the admin filter and the seeded articles all agree. */
export const TICKET_CATEGORIES = [
  "Cashback not tracked",
  "Cashback not confirmed",
  "Withdrawal issue",
  "Profit links",
  "Refer & Earn",
  "Account & login",
  "Something else",
] as const;

/** A closed or resolved ticket accepts no further replies from either side. */
export function isTicketOpen(status: TicketStatus): boolean {
  return status === "OPEN" || status === "IN_PROGRESS";
}
