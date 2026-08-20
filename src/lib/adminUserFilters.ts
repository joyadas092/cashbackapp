import type { Prisma, RiskStatus } from "@prisma/client";

/**
 * Filters for the admin user list.
 *
 * Shared by the page and the CSV export so "Export" always returns exactly the
 * rows on screen. If the two built their own `where` clauses they would drift,
 * and an export that quietly includes more people than the admin was looking at
 * is a data-handling problem, not just a bug.
 */
export interface UserFilters {
  q: string;
  status: string;
  kyc: string;
  joined: string;
  quick: string;
}

export const STATUS_OPTIONS = [
  { value: "all", label: "All Status" },
  { value: "NORMAL", label: "Active" },
  { value: "REVIEW", label: "Under review" },
  { value: "RESTRICTED", label: "Restricted" },
  { value: "BLOCKED", label: "Blocked" },
];

export const KYC_OPTIONS = [
  { value: "all", label: "All KYC" },
  { value: "VERIFIED", label: "Verified" },
  { value: "PENDING", label: "Pending" },
  { value: "REJECTED", label: "Rejected" },
  { value: "NONE", label: "Not submitted" },
];

export const JOINED_OPTIONS = [
  { value: "all", label: "Any join date" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
];

export const QUICK_FILTERS = [
  { value: "high", label: "High Earners", hint: "> ₹1,000" },
  { value: "zero", label: "No Earnings", hint: "₹0" },
  { value: "noorders", label: "Not Ordered", hint: "0 orders" },
];

const HIGH_EARNER_THRESHOLD = 1000;

function isOneOf(value: string | null, options: Array<{ value: string }>): string {
  return value && options.some((o) => o.value === value) ? value : "all";
}

export function parseUserFilters(params: URLSearchParams): UserFilters {
  const quick = params.get("quick");
  return {
    q: (params.get("q") ?? "").trim(),
    status: isOneOf(params.get("status"), STATUS_OPTIONS),
    kyc: isOneOf(params.get("kyc"), KYC_OPTIONS),
    joined: isOneOf(params.get("joined"), JOINED_OPTIONS),
    quick: quick && QUICK_FILTERS.some((f) => f.value === quick) ? quick : "",
  };
}

function joinedSince(range: string): Date | null {
  if (range === "all") return null;
  const days = range === "7d" ? 7 : range === "30d" ? 30 : 90;
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export function buildUserWhere(filters: UserFilters): Prisma.UserWhereInput {
  const since = joinedSince(filters.joined);

  const where: Prisma.UserWhereInput = {
    ...(filters.q
      ? {
          OR: [
            { name: { contains: filters.q, mode: "insensitive" } },
            { email: { contains: filters.q, mode: "insensitive" } },
            { phone: { contains: filters.q } },
            { referralCode: { contains: filters.q.toUpperCase() } },
          ],
        }
      : {}),
    ...(filters.status !== "all" ? { riskStatus: filters.status as RiskStatus } : {}),
    ...(since ? { createdAt: { gte: since } } : {}),
  };

  if (filters.kyc === "NONE") {
    // "Not submitted" covers two shapes: no profile row at all (the user never
    // opened settings) and a profile whose kycStatus is still null. This goes in
    // AND so it can't collide with the search OR above.
    where.AND = [
      { OR: [{ profile: { is: null } }, { profile: { is: { kycStatus: null } } }] },
    ];
  } else if (filters.kyc !== "all") {
    where.profile = { is: { kycStatus: filters.kyc } };
  }

  if (filters.quick === "high") {
    where.wallet = { is: { lifetimeEarned: { gt: HIGH_EARNER_THRESHOLD } } };
  }
  if (filters.quick === "zero") {
    where.wallet = { is: { lifetimeEarned: { lte: 0 } } };
  }
  if (filters.quick === "noorders") {
    // No click of theirs ever produced a transaction.
    where.clicks = { none: { transactions: { some: {} } } };
  }

  return where;
}

/** Rebuild the query string, dropping defaults so URLs stay readable. */
export function userFiltersToQuery(
  filters: UserFilters,
  overrides: Partial<UserFilters & { page: number }> = {}
): string {
  const merged = { ...filters, ...overrides };
  const params = new URLSearchParams();

  if (merged.q) params.set("q", merged.q);
  if (merged.status !== "all") params.set("status", merged.status);
  if (merged.kyc !== "all") params.set("kyc", merged.kyc);
  if (merged.joined !== "all") params.set("joined", merged.joined);
  if (merged.quick) params.set("quick", merged.quick);
  if (overrides.page && overrides.page > 1) params.set("page", String(overrides.page));

  const query = params.toString();
  return query ? `?${query}` : "";
}
