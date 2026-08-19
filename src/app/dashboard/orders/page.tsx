import Link from "next/link";
import { redirect } from "next/navigation";
import type { TransactionStatus } from "@prisma/client";
import { CheckCircle2, Clock, Package, XCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { OrdersList, type OrderRow } from "@/components/orders/OrdersList";
import { daysUntil, estimateConfirmationDate } from "@/lib/orders";
import { formatInrExact } from "@/lib/utils";

const PAGE_SIZE = 20;

const FILTERS: Array<{ key: string; label: string; statuses: TransactionStatus[] | null }> = [
  { key: "all", label: "All Orders", statuses: null },
  { key: "pending", label: "Pending", statuses: ["PENDING"] },
  { key: "confirmed", label: "Confirmed", statuses: ["CONFIRMED", "PAID"] },
  { key: "rejected", label: "Rejected", statuses: ["REJECTED", "CANCELLED", "REVERSED"] },
];

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  const session = await auth();
  // Layout guards too, but Next fetches layout and page data in parallel.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/orders");
  }
  const userId = session.user.id;

  const filterKey = FILTERS.some((f) => f.key === searchParams.status)
    ? (searchParams.status as string)
    : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  // Orders are the user's own shopping. Purchases other people made through a
  // shared profit link are earnings, not this user's orders, and live under
  // My Activity instead.
  const baseWhere = { click: { userId, clickType: { not: "PROFIT_LINK" as const } } };
  const where = {
    ...baseWhere,
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
  };

  const [orders, total, counts, totals] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        store: {
          select: {
            name: true,
            slug: true,
            logoUrl: true,
            trackingTime: true,
            paymentTime: true,
          },
        },
        cashbackRule: { select: { validityDays: true } },
      },
    }),
    prisma.transaction.count({ where }),
    prisma.transaction.groupBy({ by: ["status"], where: baseWhere, _count: { _all: true } }),
    prisma.transaction.aggregate({
      where: baseWhere,
      _sum: { saleAmount: true, customerAmount: true },
      _count: { _all: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: TransactionStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const pendingCashback = await prisma.transaction.aggregate({
    where: { ...baseWhere, status: "PENDING" },
    _sum: { customerAmount: true },
  });

  const rows: OrderRow[] = orders.map((tx) => {
    const placedAt = tx.transactionDate ?? tx.createdAt;
    const estimate = estimateConfirmationDate({
      placedAt,
      validityDays: tx.cashbackRule?.validityDays ?? null,
      paymentTime: tx.store.paymentTime,
    });

    return {
      id: tx.id,
      orderId: tx.orderId ?? tx.cuelinksTransactionId,
      placedAt: placedAt.toISOString(),
      store: {
        name: tx.store.name,
        slug: tx.store.slug,
        logoUrl: tx.store.logoUrl,
      },
      saleAmount: Number(tx.saleAmount),
      cashback: Number(tx.customerAmount),
      status: tx.status,
      estimatedConfirmation: estimate ? estimate.toISOString() : null,
      daysRemaining: estimate ? daysUntil(estimate) : null,
      confirmedAt: tx.confirmedAt ? tx.confirmedAt.toISOString() : null,
      reversedAt: tx.reversedAt ? tx.reversedAt.toISOString() : null,
      trackingTime: tx.store.trackingTime,
      paymentTime: tx.store.paymentTime,
    };
  });

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (status: string, p = 1) =>
    `/dashboard/orders?status=${status}${p > 1 ? `&page=${p}` : ""}`;

  const summary = [
    {
      label: "Total Orders",
      value: String(totals._count._all),
      icon: Package,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Order Value",
      value: formatInrExact(Number(totals._sum.saleAmount ?? 0)),
      icon: CheckCircle2,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Cashback Earned",
      value: formatInrExact(Number(totals._sum.customerAmount ?? 0)),
      icon: CheckCircle2,
      tone: "bg-cashlime-50 text-cashlime-700",
    },
    {
      label: "Awaiting Confirmation",
      value: formatInrExact(Number(pendingCashback._sum.customerAmount ?? 0)),
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Orders</h1>
        <p className="mt-1 text-slate-500">
          Every order you placed through CashbackApp, with its cashback status and when to expect
          confirmation.
        </p>
      </header>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summary.map((item) => (
          <div
            key={item.label}
            className="flex items-start gap-3.5 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card"
          >
            <span
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${item.tone}`}
            >
              <item.icon size={22} strokeWidth={1.75} />
            </span>
            <div className="min-w-0">
              <div className="text-sm text-slate-500">{item.label}</div>
              <div className="mt-0.5 truncate text-2xl font-extrabold text-slate-900">
                {item.value}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        <nav
          aria-label="Filter orders"
          className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5"
        >
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={hrefFor(f.key)}
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

        <OrdersList orders={rows} />

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Page {page} of {totalPages} · {total} orders
            </span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Link
                  href={hrefFor(filterKey, page - 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Previous
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Previous
                </span>
              )}
              {page < totalPages ? (
                <Link
                  href={hrefFor(filterKey, page + 1)}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Next
                </Link>
              ) : (
                <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-300">
                  Next
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <p className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <XCircle size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
        Confirmation dates are estimates based on each store&apos;s published payment timeline.
        Returns and cancellations reverse cashback even after it&apos;s confirmed.
      </p>
    </div>
  );
}
