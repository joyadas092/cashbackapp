import Link from "next/link";
import type { Prisma, WithdrawalStatus } from "@prisma/client";
import { Ban, CheckCircle2, Clock, Search, Wallet, XCircle } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { TopStoresDonut } from "@/components/admin/AdminCharts";
import { PayoutActions } from "@/components/admin/PayoutActions";
import { Avatar } from "@/components/shared/Avatar";
import { reportDateTime } from "@/lib/adminReports";
import { formatInr, formatInrExact } from "@/lib/utils";

const PAGE_SIZE = 20;

const FILTERS: Array<{ key: string; label: string; statuses: WithdrawalStatus[] | null }> = [
  { key: "pending", label: "Needs action", statuses: ["REQUESTED", "PROCESSING"] },
  { key: "all", label: "All", statuses: null },
  { key: "completed", label: "Paid", statuses: ["COMPLETED"] },
  { key: "rejected", label: "Rejected", statuses: ["REJECTED"] },
  { key: "cancelled", label: "Cancelled", statuses: ["CANCELLED"] },
];

const TONES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-cashlime-50 text-cashlime-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  PAYTM: "Paytm",
  AMAZON_PAY: "Amazon Pay",
};

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400";

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { status?: string; method?: string; q?: string; page?: string };
}) {
  await requireAdminSession("/admin/payouts");

  const filterKey = FILTERS.some((f) => f.key === searchParams.status)
    ? (searchParams.status as string)
    : "pending";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const methodParam = searchParams.method ?? "all";
  const method = Object.keys(METHOD_LABELS).includes(methodParam) ? methodParam : "all";
  const query = (searchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.WithdrawalRequestWhereInput = {
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
    ...(method !== "all" ? { method: method as Prisma.EnumWithdrawalMethodFilter["equals"] } : {}),
    ...(query
      ? {
          OR: [
            { reference: { contains: query, mode: "insensitive" } },
            { destination: { contains: query, mode: "insensitive" } },
            { user: { name: { contains: query, mode: "insensitive" } } },
            { user: { email: { contains: query, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [requests, total, statusTotals, methodTotals, recentActivity] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      // Oldest first in the action queue — a payout queue is FIFO, and the
      // person who has waited longest should be paid first.
      orderBy: { requestedAt: filterKey === "pending" ? "asc" : "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.groupBy({
      by: ["status"],
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.withdrawalRequest.groupBy({ by: ["method"], _sum: { amount: true } }),
    prisma.withdrawalRequest.findMany({
      orderBy: { updatedAt: "desc" },
      take: 6,
      include: { user: { select: { id: true, name: true } } },
    }),
  ]);

  const amountFor = (statuses: string[]) =>
    statusTotals
      .filter((row) => statuses.includes(row.status))
      .reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0);
  const countFor = (statuses: WithdrawalStatus[] | null) =>
    statuses === null
      ? statusTotals.reduce((sum, row) => sum + row._count._all, 0)
      : statusTotals
          .filter((row) => statuses.includes(row.status))
          .reduce((sum, row) => sum + row._count._all, 0);

  const paid = amountFor(["COMPLETED"]);
  const pending = amountFor(["REQUESTED", "PROCESSING"]);
  const rejected = amountFor(["REJECTED"]);
  const cancelled = amountFor(["CANCELLED"]);
  // Everything ever requested, whatever became of it.
  const grandTotal = paid + pending + rejected + cancelled;

  const statusSlices = [
    { name: "Paid", value: paid },
    { name: "Pending", value: pending },
    { name: "Rejected", value: rejected },
    { name: "Cancelled", value: cancelled },
  ].filter((slice) => slice.value > 0);

  const methodSlices = methodTotals
    .map((row) => ({
      name: METHOD_LABELS[row.method] ?? row.method,
      value: Number(row._sum.amount ?? 0),
    }))
    .filter((slice) => slice.value > 0)
    .sort((a, b) => b.value - a.value);
  const methodTotal = methodSlices.reduce((sum, slice) => sum + slice.value, 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const buildHref = (overrides: Record<string, string | number>) => {
    const params = new URLSearchParams();
    params.set("status", filterKey);
    if (method !== "all") params.set("method", method);
    if (query) params.set("q", query);
    for (const [key, value] of Object.entries(overrides)) params.set(key, String(value));
    return `/admin/payouts?${params.toString()}`;
  };

  const stats = [
    { label: "Total Payouts", value: formatInr(grandTotal), icon: Wallet, tone: "bg-violet-50 text-violet-600", delta: null },
    { label: "Paid", value: formatInr(paid), icon: CheckCircle2, tone: "bg-cashlime-50 text-cashlime-700", delta: null },
    { label: "Pending", value: formatInr(pending), icon: Clock, tone: "bg-amber-50 text-amber-600", delta: null, invertDelta: true },
    { label: "Rejected", value: formatInr(rejected), icon: XCircle, tone: "bg-rose-50 text-rose-600", delta: null, invertDelta: true },
    { label: "Cancelled", value: formatInr(cancelled), icon: Ban, tone: "bg-slate-100 text-slate-600", delta: null },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Payouts"
        subtitle="Withdrawal requests. Money is reserved the moment a user asks, and only leaves the wallet when you mark it paid."
        actions={
          pending > 0 ? (
            <span className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800">
              {formatInrExact(pending)} awaiting action
            </span>
          ) : undefined
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard padded={false}>
          <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
            {FILTERS.map((f) => {
              const isActive = f.key === filterKey;
              return (
                <Link
                  key={f.key}
                  href={`/admin/payouts?status=${f.key}`}
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

          <form action="/admin/payouts" className="flex flex-wrap items-center gap-2 p-5">
            <input type="hidden" name="status" value={filterKey} />
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search by user, email, UPI or payout ID..."
                aria-label="Search payouts"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
              />
            </div>

            <select name="method" defaultValue={method} aria-label="Filter by method" className={selectClass}>
              <option value="all">All Payout Methods</option>
              {Object.entries(METHOD_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>

            {(query || method !== "all") && (
              <Link
                href={`/admin/payouts?status=${filterKey}`}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          {requests.length === 0 ? (
            <AdminEmpty
              title="Nothing in this queue"
              body="Withdrawal requests appear here as soon as users submit them."
            />
          ) : (
            <AdminTableWrap minWidth={1120}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>Payout ID</AdminTh>
                  <AdminTh>User</AdminTh>
                  <AdminTh align="right">Amount</AdminTh>
                  <AdminTh>Method</AdminTh>
                  <AdminTh>Destination</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Initiated</AdminTh>
                  <AdminTh>Processed</AdminTh>
                  <AdminTh>Action</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {requests.map((request) => (
                  <tr key={request.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-3 font-mono text-xs font-semibold text-violet-700">
                      {request.reference}
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${request.user.id}`}
                        className="flex items-center gap-2.5 hover:text-violet-700"
                      >
                        <Avatar name={request.user.name} seed={request.user.id} size={30} />
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">
                            {request.user.name}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {request.user.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-slate-900">
                      {formatInrExact(Number(request.amount))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                      {METHOD_LABELS[request.method] ?? request.method}
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {request.destination}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                        tone={TONES[request.status] ?? "bg-slate-100 text-slate-600"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {reportDateTime(request.requestedAt)}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {request.processedAt ? reportDateTime(request.processedAt) : "—"}
                    </td>
                    <td className="px-5 py-3">
                      <PayoutActions
                        id={request.id}
                        status={request.status}
                        amount={Number(request.amount)}
                        destination={request.destination}
                      />
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
            noun="payouts"
            hrefForPage={(target) => buildHref({ page: target })}
          />
        </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Payout Overview" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={statusSlices}
                total={grandTotal}
                centreLabel="Requested"
                emptyMessage="No withdrawal requests yet."
              />
            </div>
          </AdminCard>

          <AdminCard title="Payouts by Method" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={methodSlices}
                total={methodTotal}
                centreLabel="Total"
                emptyMessage="No withdrawal requests yet."
              />
            </div>
          </AdminCard>

          <AdminCard title="Recent Payout Activity">
            {recentActivity.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing yet.</p>
            ) : (
              <ul className="space-y-3">
                {recentActivity.map((row) => (
                  <li key={row.id} className="flex items-center gap-2.5">
                    <Avatar name={row.user.name} seed={row.user.id} size={28} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {row.user.name}
                      </span>
                      <span className="block truncate text-xs text-slate-400">
                        {formatInrExact(Number(row.amount))} ·{" "}
                        {reportDateTime(row.processedAt ?? row.requestedAt)}
                      </span>
                    </span>
                    <AdminBadge
                      label={row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                      tone={TONES[row.status] ?? "bg-slate-100 text-slate-600"}
                    />
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </aside>
      </div>

      <p className="mt-4 text-xs text-slate-500">
        Marking a payout paid records that the money left your account — this app does not move
        funds itself. Rejecting returns the amount to the user&apos;s available balance and records
        the reversal in their ledger.
      </p>
    </div>
  );
}
