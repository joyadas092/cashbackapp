import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { CircleSlash, LayoutGrid, Search, Store as StoreIcon, Tag, ToggleRight } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { DualMetricChart, TopStoresDonut } from "@/components/admin/AdminCharts";
import { StoreStatusToggle } from "@/components/admin/StoreStatusToggle";
import { StoreLogoEditor } from "@/components/admin/StoreLogoEditor";
import { StoreLogo } from "@/components/store/StoreLogo";
import {
  REPORT_WINDOW_DAYS,
  buildDualSeries,
  reportDateTime,
  reportDelta,
  reportWindows,
} from "@/lib/adminReports";
import { formatInr, formatInrExact } from "@/lib/utils";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 15;

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400";

export default async function AdminStoresPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; category?: string; page?: string };
}) {
  await requireAdminSession("/admin/stores");

  const query = (searchParams.q ?? "").trim();
  const status =
    searchParams.status === "ACTIVE" || searchParams.status === "INACTIVE"
      ? searchParams.status
      : "all";
  const categoryId = (searchParams.category ?? "").trim();
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.StoreWhereInput = {
    ...(query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
            { merchantDomains: { has: query.toLowerCase() } },
          ],
        }
      : {}),
    ...(status !== "all" ? { status } : {}),
    ...(categoryId ? { categoryId } : {}),
  };

  const { inPeriod, inPrior } = reportWindows();

  const [
    stores,
    total,
    totalStores,
    activeStores,
    inactiveStores,
    offerCount,
    categories,
    newPeriod,
    newPrior,
    periodClicks,
    periodTxs,
    commissionByStore,
    clicksByStore,
    categoryCounts,
  ] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        category: { select: { name: true } },
        _count: { select: { offers: true } },
      },
    }),
    prisma.store.count({ where }),
    prisma.store.count(),
    prisma.store.count({ where: { status: "ACTIVE" } }),
    prisma.store.count({ where: { status: "INACTIVE" } }),
    prisma.storeOffer.count({ where: { isActive: true } }),
    prisma.storeCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.store.count({ where: { createdAt: inPeriod } }),
    prisma.store.count({ where: { createdAt: inPrior } }),
    prisma.click.findMany({ where: { createdAt: inPeriod }, select: { createdAt: true } }),
    prisma.transaction.findMany({
      where: { createdAt: inPeriod, status: { in: ["CONFIRMED", "PAID"] } },
      select: { createdAt: true, commissionAmount: true },
    }),
    prisma.transaction.groupBy({
      by: ["storeId"],
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { commissionAmount: true },
    }),
    prisma.click.groupBy({ by: ["storeId"], _count: { _all: true } }),
    prisma.store.groupBy({ by: ["categoryId"], _count: { _all: true } }),
  ]);

  const commissionMap = new Map(
    commissionByStore.map((row) => [row.storeId, Number(row._sum.commissionAmount ?? 0)])
  );
  const clickMap = new Map(clicksByStore.map((row) => [row.storeId, row._count._all]));

  // Clicks against confirmed commission, platform-wide.
  const series = buildDualSeries(
    periodClicks,
    periodTxs.map((tx) => ({ createdAt: tx.createdAt, amount: tx.commissionAmount })),
    { sumSecondary: true }
  );

  const topStoreRows = [...commissionByStore]
    .sort((a, b) => Number(b._sum.commissionAmount ?? 0) - Number(a._sum.commissionAmount ?? 0))
    .slice(0, 5);
  const topStoreRecords =
    topStoreRows.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: topStoreRows.map((row) => row.storeId) } },
          select: { id: true, name: true, slug: true, logoUrl: true },
        })
      : [];
  const storeById = new Map(topStoreRecords.map((store) => [store.id, store]));

  const categoryNameById = new Map(categories.map((category) => [category.id, category.name]));
  const categorySlices = categoryCounts
    .map((row) => ({
      name: categoryNameById.get(row.categoryId) ?? "Uncategorised",
      value: row._count._all,
    }))
    .sort((a, b) => b.value - a.value);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    if (categoryId) params.set("category", categoryId);
    if (target > 1) params.set("page", String(target));
    const search = params.toString();
    return `/admin/stores${search ? `?${search}` : ""}`;
  };

  const stats = [
    { label: "Total Stores", value: String(totalStores), icon: StoreIcon, tone: "bg-violet-50 text-violet-600", delta: reportDelta(newPeriod, newPrior) },
    { label: "Active Stores", value: String(activeStores), icon: ToggleRight, tone: "bg-cashlime-50 text-cashlime-700", delta: null },
    { label: "Inactive Stores", value: String(inactiveStores), icon: CircleSlash, tone: "bg-amber-50 text-amber-600", delta: null },
    { label: "Categories", value: String(categories.length), icon: LayoutGrid, tone: "bg-sky-50 text-sky-600", delta: null },
    { label: "Live Offers", value: String(offerCount), icon: Tag, tone: "bg-rose-50 text-rose-600", delta: null },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Stores"
        subtitle="Every partner store, with the clicks and commission it has produced."
        actions={
          <Link
            href="/admin/campaigns"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500"
          >
            Import from Cuelinks
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={`vs prev ${REPORT_WINDOW_DAYS} days`} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard padded={false}>
          <form action="/admin/stores" className="flex flex-wrap items-center gap-2 p-5">
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
                placeholder="Search store name or domain..."
                aria-label="Search stores"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
              />
            </div>

            <select name="status" defaultValue={status} aria-label="Filter by status" className={selectClass}>
              <option value="all">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </select>

            <select
              name="category"
              defaultValue={categoryId}
              aria-label="Filter by category"
              className={selectClass}
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>

            {(query || status !== "all" || categoryId) && (
              <Link
                href="/admin/stores"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          {stores.length === 0 ? (
            <AdminEmpty
              title="No stores match these filters"
              body="Import one from Cuelinks, or clear the search."
            />
          ) : (
            <AdminTableWrap minWidth={1120}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>Store</AdminTh>
                  <AdminTh>Category</AdminTh>
                  <AdminTh>Logo URL</AdminTh>
                  <AdminTh align="right">Offers</AdminTh>
                  <AdminTh align="right">Clicks</AdminTh>
                  <AdminTh align="right">Commission</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Added On</AdminTh>
                  <AdminTh>Action</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stores.map((store) => (
                  <tr key={store.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/stores/${store.slug}`}
                        target="_blank"
                        className="flex items-center gap-2.5 hover:text-violet-700"
                      >
                        <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                          <StoreLogo
                            src={store.logoUrl}
                            alt={store.name}
                            size={30}
                            fallbackSlug={store.slug}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-medium text-slate-900">
                            {store.name}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {store.merchantDomains[0] ?? store.slug}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge label={store.category.name} tone="bg-violet-50 text-violet-700" />
                    </td>
                    <td className="px-5 py-3">
                      <StoreLogoEditor storeId={store.id} logoUrl={store.logoUrl} />
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{store._count.offers}</td>
                    <td className="px-5 py-3 text-right text-slate-600">
                      {clickMap.get(store.id) ?? 0}
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                      {formatInrExact(commissionMap.get(store.id) ?? 0)}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={store.status === "ACTIVE" ? "Active" : "Inactive"}
                        tone={
                          store.status === "ACTIVE"
                            ? "bg-cashlime-50 text-cashlime-700"
                            : "bg-slate-100 text-slate-500"
                        }
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      <LocalTime value={store.createdAt.toISOString()} />
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <StoreStatusToggle storeId={store.id} status={store.status} />
                        <Link
                          href={`/admin/stores/${store.id}/rates`}
                          className="text-xs font-medium text-violet-700 hover:underline"
                        >
                          Rates
                        </Link>
                        <Link
                          href={`/admin/stores/${store.id}/page-content`}
                          className="text-xs font-medium text-violet-700 hover:underline"
                        >
                          Content
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, total)} of {total} stores
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={pageHref(page - 1)}
                    className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Previous
                  </Link>
                ) : (
                  <span className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-300">
                    Previous
                  </span>
                )}
                <span className="rounded-lg bg-violet-600 px-3 py-1.5 text-xs font-semibold text-white">
                  {page}
                </span>
                {page < totalPages ? (
                  <Link
                    href={pageHref(page + 1)}
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
            )}
          </div>
        </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Store Performance" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <p className="mb-2 text-xs text-slate-400">Last {REPORT_WINDOW_DAYS} days</p>
              <DualMetricChart data={series} primaryName="Clicks" secondaryName="Commission" />
            </div>
          </AdminCard>

          <AdminCard title="Top Stores by Commission">
            {topStoreRows.length === 0 ? (
              <p className="text-sm text-slate-500">No confirmed commission yet.</p>
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
                        {formatInr(Number(row._sum.commissionAmount ?? 0))}
                      </span>
                    </li>
                  );
                })}
              </ol>
            )}
          </AdminCard>

          <AdminCard title="Store Categories" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={categorySlices}
                total={totalStores}
                centreLabel="Stores"
                valueFormat="count"
                emptyMessage="No stores yet."
              />
            </div>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
