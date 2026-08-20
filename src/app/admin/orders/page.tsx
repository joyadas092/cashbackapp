import Link from "next/link";
import type { Prisma, TransactionStatus } from "@prisma/client";
import { CheckCircle2, Clock, IndianRupee, Package, Search, Undo2, XCircle } from "lucide-react";
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
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { DualMetricChart, TopStoresDonut } from "@/components/admin/AdminCharts";
import { StoreLogo } from "@/components/store/StoreLogo";
import {
  REPORT_WINDOW_DAYS,
  buildDualSeries,
  reportDelta,
  reportWindows,
} from "@/lib/adminReports";
import { formatInr, formatInrExact } from "@/lib/utils";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 25;

const FILTERS: Array<{ key: string; label: string; statuses: TransactionStatus[] | null }> = [
  { key: "all", label: "All Orders", statuses: null },
  { key: "pending", label: "Pending", statuses: ["PENDING"] },
  { key: "confirmed", label: "Confirmed", statuses: ["CONFIRMED", "PAID"] },
  { key: "rejected", label: "Rejected", statuses: ["REJECTED", "CANCELLED", "REVERSED"] },
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

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminSession("/admin/orders");

  const one = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const statusParam = one("status");
  const filterKey = FILTERS.some((f) => f.key === statusParam) ? (statusParam as string) : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const query = (one("q") ?? "").trim();
  const page = Math.max(1, parseInt(one("page") ?? "1", 10) || 1);

  const range = parseDateRangeFromSearchParams(searchParams);
  const createdAtFilter = dateRangeWhere(range);
  const rangeSuffix = dateRangeToParams(range).toString();
  const rangeQs = rangeSuffix ? `&${rangeSuffix}` : "";

  // Search covers the three things an admin has to hand when chasing an order:
  // the order reference, the store, or who it belongs to.
  const where: Prisma.TransactionWhereInput = {
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
    ...(query
      ? {
          OR: [
            { orderId: { contains: query, mode: "insensitive" } },
            { cuelinksTransactionId: { contains: query, mode: "insensitive" } },
            { store: { name: { contains: query, mode: "insensitive" } } },
            { click: { user: { name: { contains: query, mode: "insensitive" } } } },
            { click: { user: { email: { contains: query, mode: "insensitive" } } } },
          ],
        }
      : {}),
  };

  const { inPeriod, inPrior } = reportWindows();

  const [
    orders,
    total,
    counts,
    valueAgg,
    ordersPeriod,
    ordersPrior,
    valuePeriod,
    valuePrior,
    seriesOrders,
    ordersByStore,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        store: { select: { name: true, slug: true, logoUrl: true } },
        click: { select: { user: { select: { id: true, name: true, email: true } } } },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({
      by: ["status"],
      where: createdAtFilter ? { createdAt: createdAtFilter } : {},
      _count: { _all: true },
    }),
    prisma.transaction.aggregate({ _sum: { saleAmount: true } }),
    prisma.transaction.count({ where: { createdAt: inPeriod } }),
    prisma.transaction.count({ where: { createdAt: inPrior } }),
    prisma.transaction.aggregate({
      where: { createdAt: inPeriod },
      _sum: { saleAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { createdAt: inPrior },
      _sum: { saleAmount: true },
    }),
    prisma.transaction.findMany({
      where: { createdAt: inPeriod },
      select: { createdAt: true, saleAmount: true },
    }),
    prisma.transaction.groupBy({ by: ["storeId"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: TransactionStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) =>
    `/admin/orders?status=${filterKey}${query ? `&q=${encodeURIComponent(query)}` : ""}${p > 1 ? `&page=${p}` : ""}${rangeQs}`;

  // Orders per day against the rupee value they carried.
  const series = buildDualSeries(
    seriesOrders,
    seriesOrders.map((tx) => ({ createdAt: tx.createdAt, amount: tx.saleAmount })),
    { sumSecondary: true }
  );

  const statusSlices = counts
    .map((row) => ({
      name: row.status.charAt(0) + row.status.slice(1).toLowerCase(),
      value: row._count._all,
    }))
    .filter((slice) => slice.value > 0);
  const allOrders = counts.reduce((sum, row) => sum + row._count._all, 0);

  const topStoreRows = [...ordersByStore]
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, 5);
  const topStoreRecords =
    topStoreRows.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: topStoreRows.map((row) => row.storeId) } },
          select: { id: true, name: true, slug: true, logoUrl: true },
        })
      : [];
  const storeById = new Map(topStoreRecords.map((store) => [store.id, store]));

  const num = (value: unknown) => Number(value ?? 0);
  const stats = [
    { label: "Total Orders", value: String(allOrders), icon: Package, tone: "bg-violet-50 text-violet-600", delta: reportDelta(ordersPeriod, ordersPrior) },
    { label: "Confirmed", value: String(countFor(["CONFIRMED", "PAID"])), icon: CheckCircle2, tone: "bg-cashlime-50 text-cashlime-700", delta: null },
    { label: "Pending", value: String(countFor(["PENDING"])), icon: Clock, tone: "bg-amber-50 text-amber-600", delta: null, invertDelta: true },
    { label: "Rejected", value: String(countFor(["REJECTED", "CANCELLED"])), icon: XCircle, tone: "bg-rose-50 text-rose-600", delta: null, invertDelta: true },
    { label: "Reversed", value: String(countFor(["REVERSED"])), icon: Undo2, tone: "bg-slate-100 text-slate-600", delta: null, invertDelta: true },
    {
      label: "Total Order Value",
      value: formatInr(num(valueAgg._sum.saleAmount)),
      icon: IndianRupee,
      tone: "bg-sky-50 text-sky-600",
      delta: reportDelta(num(valuePeriod._sum.saleAmount), num(valuePrior._sum.saleAmount)),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Orders placed through the platform, with the cashback owed on each."
        actions={
          <form action="/admin/orders" className="relative">
            <input type="hidden" name="status" value={filterKey} />
            {range.preset === "custom" ? (
              <>
                <input type="hidden" name="from" value={range.from} />
                <input type="hidden" name="to" value={range.to} />
              </>
            ) : (
              range.preset !== "all" && <input type="hidden" name="range" value={range.preset} />
            )}
            <Search
              size={15}
              strokeWidth={2}
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              name="q"
              defaultValue={query}
              placeholder="Order ID, store or user"
              aria-label="Search orders"
              className="w-64 rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
            />
          </form>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={`vs prev ${REPORT_WINDOW_DAYS} days`} />
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
                href={`/admin/orders?status=${f.key}${query ? `&q=${encodeURIComponent(query)}` : ""}${rangeQs}`}
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

        {/* GET form so the range stays in the URL and Export reuses the same query. */}
        <form
          action="/admin/orders"
          className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5"
        >
          <input type="hidden" name="status" value={filterKey} />
          {query && <input type="hidden" name="q" value={query} />}
          <DateRangeFilter
            range={range}
            basePath="/admin/orders"
            hiddenFields={{ status: filterKey, q: query }}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Apply
          </button>
        </form>

        {orders.length === 0 ? (
          <AdminEmpty
            title={query ? `No orders match "${query}"` : "No orders here"}
            body={query ? "Try the order reference, store name, or the user's email." : undefined}
          />
        ) : (
          <AdminTableWrap minWidth={940}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>Order ID</AdminTh>
                <AdminTh>User</AdminTh>
                <AdminTh>Store</AdminTh>
                <AdminTh align="right">Amount</AdminTh>
                <AdminTh align="right">Cashback</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Date</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3 font-mono text-xs text-violet-700">
                    {order.orderId ?? order.cuelinksTransactionId}
                  </td>
                  <td className="px-5 py-3">
                    {order.click.user ? (
                      <Link
                        href={`/admin/users/${order.click.user.id}`}
                        className="hover:text-violet-700"
                      >
                        <span className="block text-slate-800">{order.click.user.name}</span>
                        <span className="block text-xs text-slate-400">
                          {order.click.user.email}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-slate-400">Guest (via shared link)</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className="flex items-center gap-2 text-slate-800">
                      <span className="shrink-0 rounded-md ring-1 ring-slate-200">
                        <StoreLogo
                          src={order.store.logoUrl}
                          alt={order.store.name}
                          size={22}
                          fallbackSlug={order.store.slug}
                        />
                      </span>
                      {order.store.name}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                    {formatInrExact(Number(order.saleAmount))}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                    {formatInrExact(Number(order.customerAmount))}
                  </td>
                  <td className="px-5 py-3">
                    <AdminBadge
                      label={order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                      tone={TONES[order.status] ?? "bg-slate-100 text-slate-600"}
                    />
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    <LocalTime value={order.createdAt.toISOString()} />
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
          noun="orders"
          hrefForPage={hrefFor}
        />
      </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Orders Overview" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <p className="mb-2 text-xs text-slate-400">Last {REPORT_WINDOW_DAYS} days</p>
              <DualMetricChart data={series} primaryName="Orders" secondaryName="Order Value" />
            </div>
          </AdminCard>

          <AdminCard title="Order Status Distribution" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={statusSlices}
                total={allOrders}
                centreLabel="Orders"
                valueFormat="count"
                emptyMessage="No orders yet."
              />
            </div>
          </AdminCard>

          <AdminCard title="Top Stores by Orders">
            {topStoreRows.length === 0 ? (
              <p className="text-sm text-slate-500">No orders yet.</p>
            ) : (
              <ol className="space-y-3">
                {topStoreRows.map((row, i) => {
                  const store = storeById.get(row.storeId);
                  if (!store) return null;
                  return (
                    <li key={row.storeId} className="flex items-center gap-3">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                        {i + 1}
                      </span>
                      <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                        <StoreLogo
                          src={store.logoUrl}
                          alt={store.name}
                          size={24}
                          fallbackSlug={store.slug}
                        />
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                        {store.name}
                      </span>
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {row._count._all}
                      </span>
                      <span className="w-14 shrink-0 text-right text-xs text-slate-400">
                        {allOrders > 0 ? `${((row._count._all / allOrders) * 100).toFixed(1)}%` : "—"}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
