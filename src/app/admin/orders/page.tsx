import Link from "next/link";
import type { Prisma, TransactionStatus } from "@prisma/client";
import { Search } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
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
  searchParams: { status?: string; q?: string; page?: string };
}) {
  await requireAdminSession("/admin/orders");

  const filterKey = FILTERS.some((f) => f.key === searchParams.status)
    ? (searchParams.status as string)
    : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const query = (searchParams.q ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  // Search covers the three things an admin has to hand when chasing an order:
  // the order reference, the store, or who it belongs to.
  const where: Prisma.TransactionWhereInput = {
    ...(filter.statuses ? { status: { in: filter.statuses } } : {}),
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

  const [orders, total, counts] = await Promise.all([
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
    prisma.transaction.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: TransactionStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const hrefFor = (p: number) =>
    `/admin/orders?status=${filterKey}${query ? `&q=${encodeURIComponent(query)}` : ""}${p > 1 ? `&page=${p}` : ""}`;

  return (
    <div>
      <AdminPageHeader
        title="Orders"
        subtitle="Orders placed through the platform, with the cashback owed on each."
        actions={
          <form action="/admin/orders" className="relative">
            <input type="hidden" name="status" value={filterKey} />
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

      <AdminCard padded={false}>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={`/admin/orders?status=${f.key}${query ? `&q=${encodeURIComponent(query)}` : ""}`}
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
                    {dateTime(order.createdAt)}
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
    </div>
  );
}
