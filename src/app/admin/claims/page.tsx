import Link from "next/link";
import type { ClaimStatus, Prisma } from "@prisma/client";
import { CheckCircle2, Clock, ImageIcon, ReceiptText, Search, XCircle } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { Avatar } from "@/components/shared/Avatar";
import { StoreLogo } from "@/components/store/StoreLogo";
import { LocalTime } from "@/components/shared/LocalTime";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import { ClaimStatusControl } from "@/components/admin/ClaimStatusControl";
import {
  dateRangeToParams,
  dateRangeWhere,
  isDateRangeActive,
  parseDateRangeFromSearchParams,
} from "@/lib/dateRangeFilter";
import { CLAIM_ORDER_TYPE_META, CLAIM_STATUS_META } from "@/lib/claims";
import { shortClickId } from "@/lib/clickId";
import { formatInr, formatInrExact } from "@/lib/utils";

const PAGE_SIZE = 20;

const FILTERS: Array<{ key: string; label: string; statuses: ClaimStatus[] | null }> = [
  { key: "open", label: "Open", statuses: ["SUBMITTED", "UNDER_REVIEW", "ESCALATED"] },
  { key: "all", label: "All Claims", statuses: null },
  { key: "submitted", label: "Submitted", statuses: ["SUBMITTED"] },
  { key: "review", label: "Under Review", statuses: ["UNDER_REVIEW"] },
  { key: "escalated", label: "With the Store", statuses: ["ESCALATED"] },
  { key: "approved", label: "Approved", statuses: ["APPROVED"] },
  { key: "rejected", label: "Rejected", statuses: ["REJECTED"] },
];

/**
 * Missing-cashback claims queue.
 *
 * Every claim names a Click, which is the attribution key sent to Cuelinks as
 * subid=c_<clickId>. That id is what makes a claim chaseable with the network,
 * so it is shown in full on hover rather than only as a short reference.
 */
export default async function AdminClaimsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminSession("/admin/claims");

  const one = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const statusParam = one("status");
  const filterKey = FILTERS.some((f) => f.key === statusParam) ? (statusParam as string) : "open";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const query = (one("q") ?? "").trim();
  const page = Math.max(1, parseInt(one("page") ?? "1", 10) || 1);

  const range = parseDateRangeFromSearchParams(searchParams);
  const createdAtFilter = dateRangeWhere(range);

  const where: Prisma.CashbackClaimWhereInput = {
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    ...(query
      ? {
          OR: [
            { claimNumber: { contains: query, mode: "insensitive" } },
            { orderId: { contains: query, mode: "insensitive" } },
            { claimedClickId: { contains: query, mode: "insensitive" } },
            { store: { name: { contains: query, mode: "insensitive" } } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [claims, total, counts, openAgg, approvedAgg] = await Promise.all([
    prisma.cashbackClaim.findMany({
      where,
      // Oldest first in the open queue: a claims queue is FIFO, and the person
      // who has waited longest should be answered first.
      orderBy: { createdAt: filterKey === "open" ? "asc" : "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        claimNumber: true,
        orderType: true,
        claimedClickId: true,
        clickedAt: true,
        orderId: true,
        orderAmount: true,
        status: true,
        createdAt: true,
        store: { select: { name: true, slug: true, logoUrl: true } },
        user: { select: { id: true, name: true, email: true } },
        attachment: { select: { id: true } },
      },
    }),
    prisma.cashbackClaim.count({ where }),
    prisma.cashbackClaim.groupBy({
      by: ["status"],
      where: createdAtFilter ? { createdAt: createdAtFilter } : {},
      _count: { _all: true },
    }),
    prisma.cashbackClaim.aggregate({
      where: { status: { in: ["SUBMITTED", "UNDER_REVIEW", "ESCALATED"] } },
      _sum: { orderAmount: true },
      _count: { _all: true },
    }),
    prisma.cashbackClaim.aggregate({
      where: { status: "APPROVED" },
      _sum: { orderAmount: true },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: ClaimStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeQs = dateRangeToParams(range).toString();

  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    params.set("status", filterKey);
    if (query) params.set("q", query);
    dateRangeToParams(range, params);
    for (const [key, value] of Object.entries(overrides)) params.set(key, String(value));
    return `/admin/claims?${params.toString()}`;
  };

  const rejected = countByStatus.get("REJECTED") ?? 0;

  const stats = [
    {
      label: "Open Claims",
      value: String(openAgg._count._all),
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
      delta: null,
      invertDelta: true,
    },
    {
      label: "Value in Queue",
      value: formatInr(Number(openAgg._sum.orderAmount ?? 0)),
      icon: ReceiptText,
      tone: "bg-violet-50 text-violet-600",
      delta: null,
    },
    {
      label: "Approved",
      value: String(approvedAgg._count._all),
      icon: CheckCircle2,
      tone: "bg-cashlime-50 text-cashlime-700",
      delta: null,
    },
    {
      label: "Rejected",
      value: String(rejected),
      icon: XCircle,
      tone: "bg-rose-50 text-rose-600",
      delta: null,
      invertDelta: true,
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Cashback Claims"
        subtitle="Missing cashback reported by users, anchored to the click each order came from."
        actions={
          <form action="/admin/claims" className="relative">
            <input type="hidden" name="status" value={filterKey} />
            {rangeQs
              .split("&")
              .filter(Boolean)
              .map((pair) => {
                const [key, value] = pair.split("=");
                return <input key={key} type="hidden" name={key} value={value} />;
              })}
            <Search
              size={15}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Claim, order, click ID or user"
              aria-label="Search claims"
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
            />
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} />
        ))}
      </div>

      <AdminCard className="mt-6" padded={false}>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={buildHref({ status: f.key, page: 1 })}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label} ({countFor(f.statuses)})
              </Link>
            );
          })}
        </nav>

        <form
          action="/admin/claims"
          className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5"
        >
          <input type="hidden" name="status" value={filterKey} />
          {query && <input type="hidden" name="q" value={query} />}
          <DateRangeFilter
            range={range}
            basePath="/admin/claims"
            hiddenFields={{ status: filterKey, q: query }}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Apply
          </button>
        </form>

        {claims.length === 0 ? (
          <AdminEmpty
            title={
              query || isDateRangeActive(range) ? "No claims match this filter" : "No claims here"
            }
            body={
              query || isDateRangeActive(range)
                ? "Try a different reference, user or date range."
                : undefined
            }
          />
        ) : (
          <AdminTableWrap minWidth={1240}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>Claim</AdminTh>
                <AdminTh>User</AdminTh>
                <AdminTh>Store</AdminTh>
                <AdminTh>Type</AdminTh>
                <AdminTh>Order ID</AdminTh>
                <AdminTh>Click ID</AdminTh>
                <AdminTh align="right">Amount</AdminTh>
                <AdminTh>Proof</AdminTh>
                <AdminTh>Raised</AdminTh>
                <AdminTh>Status</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {claims.map((claim) => (
                <tr key={claim.id} className="hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-violet-700">
                    {claim.claimNumber}
                  </td>
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/users/${claim.user.id}`}
                      className="flex items-center gap-2.5 hover:text-violet-700"
                    >
                      <Avatar name={claim.user.name} seed={claim.user.id} size={28} />
                      <span className="min-w-0">
                        <span className="block truncate text-slate-800">{claim.user.name}</span>
                        <span className="block truncate text-xs text-slate-400">
                          {claim.user.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span className="shrink-0 rounded-md ring-1 ring-slate-200">
                        <StoreLogo
                          src={claim.store.logoUrl}
                          alt={claim.store.name}
                          size={22}
                          fallbackSlug={claim.store.slug}
                        />
                      </span>
                      {claim.store.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    {CLAIM_ORDER_TYPE_META[claim.orderType].label}
                  </td>
                  <td className="px-5 py-3 font-mono text-xs text-slate-600">{claim.orderId}</td>
                  {/* Full cuid on hover — it is what a missing-transaction
                      query to Cuelinks has to quote exactly. */}
                  <td
                    className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600"
                    title={claim.claimedClickId}
                  >
                    {shortClickId(claim.claimedClickId)}
                    <span className="mt-0.5 block text-[11px] text-slate-400">
                      <LocalTime value={claim.clickedAt.toISOString()} />
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                    {formatInrExact(Number(claim.orderAmount))}
                  </td>
                  <td className="px-5 py-3">
                    {claim.attachment ? (
                      <a
                        href={`/api/claims/${claim.id}/screenshot`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 text-xs font-semibold text-violet-700 hover:underline"
                      >
                        <ImageIcon size={13} strokeWidth={2} />
                        View
                      </a>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    <LocalTime value={claim.createdAt.toISOString()} format="date" />
                  </td>
                  <td className="px-5 py-3">
                    <ClaimStatusControl claimId={claim.id} status={claim.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="claims"
          hrefForPage={(target) => buildHref({ page: target })}
        />
      </AdminCard>
    </div>
  );
}
