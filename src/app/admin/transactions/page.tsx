import Link from "next/link";
import type { TransactionStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import {
  dateRangeToParams,
  dateRangeWhere,
  parseDateRangeFromSearchParams,
} from "@/lib/dateRangeFilter";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { StoreLogo } from "@/components/store/StoreLogo";
import { formatInrExact } from "@/lib/utils";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 25;

const FILTERS: Array<{ key: string; label: string; statuses: TransactionStatus[] | null }> = [
  { key: "all", label: "All", statuses: null },
  { key: "pending", label: "Pending", statuses: ["PENDING"] },
  { key: "confirmed", label: "Confirmed", statuses: ["CONFIRMED", "PAID"] },
  { key: "reversed", label: "Rejected / Reversed", statuses: ["REJECTED", "CANCELLED", "REVERSED"] },
];

const TONES: Record<string, string> = {
  CONFIRMED: "bg-cashlime-50 text-cashlime-700",
  PAID: "bg-violet-50 text-violet-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
  REVERSED: "bg-slate-100 text-slate-500",
};

function dateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminTransactionsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminSession("/admin/transactions");

  const one = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const statusParam = one("status");
  const filterKey = FILTERS.some((f) => f.key === statusParam) ? (statusParam as string) : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, parseInt(one("page") ?? "1", 10) || 1);

  const range = parseDateRangeFromSearchParams(searchParams);
  const createdAtFilter = dateRangeWhere(range);
  const rangeSuffix = dateRangeToParams(range).toString();
  const rangeQs = rangeSuffix ? `&${rangeSuffix}` : "";

  const where = {
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
  };

  const [transactions, total, counts, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        store: { select: { name: true, slug: true, logoUrl: true } },
        click: {
          select: {
            clickType: true,
            user: { select: { id: true, name: true } },
            profitLink: { select: { code: true, user: { select: { name: true } } } },
          },
        },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["status"],
      where: createdAtFilter ? { createdAt: createdAtFilter } : {},
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({
      where,
      _sum: { saleAmount: true, commissionAmount: true, customerAmount: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: TransactionStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const summary = [
    { label: "Sale value", value: formatInrExact(Number(totals._sum.saleAmount ?? 0)) },
    { label: "Commission earned", value: formatInrExact(Number(totals._sum.commissionAmount ?? 0)) },
    { label: "Paid to users", value: formatInrExact(Number(totals._sum.customerAmount ?? 0)) },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Transactions"
        subtitle="Every tracked order, with what the store paid us and what we passed on."
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {summary.map((item) => (
          <div key={item.label} className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
            <div className="text-sm text-slate-500">{item.label}</div>
            <div className="mt-1 text-xl font-extrabold text-slate-900">{item.value}</div>
            <div className="mt-0.5 text-xs text-slate-400">In the current filter</div>
          </div>
        ))}
      </div>

      <AdminCard padded={false}>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={`/admin/transactions?status=${f.key}${rangeQs}`}
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

        {/* GET form so the range stays in the URL and survives paging. */}
        <form
          action="/admin/transactions"
          className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5"
        >
          <input type="hidden" name="status" value={filterKey} />
          <DateRangeFilter
            range={range}
            basePath="/admin/transactions"
            hiddenFields={{ status: filterKey }}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Apply
          </button>
        </form>

        {transactions.length === 0 ? (
          <AdminEmpty title="No transactions here" />
        ) : (
          <AdminTableWrap minWidth={1040}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>Date</AdminTh>
                <AdminTh>Order</AdminTh>
                <AdminTh>Store</AdminTh>
                <AdminTh>Attributed to</AdminTh>
                <AdminTh align="right">Sale</AdminTh>
                <AdminTh align="right">Commission</AdminTh>
                <AdminTh align="right">User share</AdminTh>
                <AdminTh>Status</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {transactions.map((tx) => {
                // A profit-link sale belongs to the sharer, not the buyer — the
                // buyer is usually someone with no account at all.
                const viaProfitLink = tx.click.clickType === "PROFIT_LINK";
                const owner = viaProfitLink
                  ? tx.click.profitLink?.user.name
                  : tx.click.user?.name;

                return (
                  <tr key={tx.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      <LocalTime value={tx.createdAt.toISOString()} />
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">
                      {tx.orderId ?? tx.cuelinksTransactionId}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className="shrink-0 rounded-md ring-1 ring-slate-200">
                          <StoreLogo
                            src={tx.store.logoUrl}
                            alt={tx.store.name}
                            size={22}
                            fallbackSlug={tx.store.slug}
                          />
                        </span>
                        {tx.store.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="block text-slate-700">{owner ?? "Guest"}</span>
                      <span className="block text-xs text-slate-400">
                        {viaProfitLink
                          ? `Profit link ${tx.click.profitLink?.code ?? ""}`
                          : "Own shopping"}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                      {formatInrExact(Number(tx.saleAmount))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                      {formatInrExact(Number(tx.commissionAmount))}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right text-cashlime-700">
                      {formatInrExact(
                        Number(tx.customerAmount) +
                          Number(tx.profitLinkAmount) +
                          Number(tx.referralAmount)
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                        tone={TONES[tx.status] ?? "bg-slate-100 text-slate-600"}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="transactions"
          hrefForPage={(p) => `/admin/transactions?status=${filterKey}&page=${p}${rangeQs}`}
        />
      </AdminCard>
    </div>
  );
}
