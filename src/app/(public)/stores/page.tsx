import { LayoutGrid, Percent, Store } from "lucide-react";
import { prisma } from "@/lib/db";
import { StoreCard } from "@/components/store/StoreCard";
import { SearchBar } from "@/components/shared/SearchBar";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";
import { StoreFilterSidebar, RATE_BUCKETS } from "@/components/store/StoreFilterSidebar";

const PAGE_SIZE = 12;

export default async function StoresPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string; rate?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { category, q, rate } = searchParams;

  const bucket = RATE_BUCKETS.find((b) => b.key === rate);
  const where = {
    status: "ACTIVE" as const,
    ...(category ? { category: { slug: category } } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
    ...(bucket
      ? { cashbackRate: { gte: bucket.gte, ...(bucket.lt != null ? { lt: bucket.lt } : {}) } }
      : {}),
  };

  const [stores, total, categories, categoryCounts, activeTotal] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: [{ featured: "desc" }, { ranking: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.store.count({ where }),
    prisma.storeCategory.findMany({ orderBy: { name: "asc" } }),
    prisma.store.groupBy({
      by: ["categoryId"],
      where: { status: "ACTIVE" },
      _count: { _all: true },
    }),
    prisma.store.count({ where: { status: "ACTIVE" } }),
  ]);

  const countByCategoryId = new Map(categoryCounts.map((c) => [c.categoryId, c._count._all]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-3xl font-extrabold text-slate-900">All Stores</h1>
        <p className="mt-1 text-slate-500">
          Shop from our partner stores and earn real cashback.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            {
              icon: Store,
              value: activeTotal,
              label: "Total Stores",
              chip: "bg-violet-50 text-violet-700",
              accent: "text-violet-700",
            },
            {
              icon: LayoutGrid,
              value: categories.length,
              label: "Categories",
              chip: "bg-cyan-50 text-cyan-700",
              accent: "text-cyan-700",
            },
            {
              icon: Percent,
              value: total,
              label: "Matching Your Filters",
              chip: "bg-cashlime-50 text-cashlime-700",
              accent: "text-cashlime-700",
            },
          ].map((tile) => (
            <div
              key={tile.label}
              className="flex items-center gap-3 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card"
            >
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile.chip}`}
              >
                <tile.icon size={20} strokeWidth={1.75} />
              </span>
              <div>
                <div className={`text-2xl font-bold ${tile.accent}`}>{tile.value}</div>
                <div className="text-xs text-slate-500">{tile.label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 max-w-md">
          <SearchBar variant="light" />
        </div>

        <div className="mt-6 flex flex-col gap-6 sm:flex-row">
          <StoreFilterSidebar
            categories={categories.map((c) => ({
              slug: c.slug,
              name: c.name,
              count: countByCategoryId.get(c.id) ?? 0,
            }))}
            totalStores={activeTotal}
            activeCategory={category}
            activeRate={rate}
            q={q}
          />

          <div className="min-w-0 flex-1">
            {stores.length === 0 ? (
              <EmptyState
                message="No stores match your search."
                ctaLabel="Clear filters"
                ctaHref="/stores"
              />
            ) : (
              <>
                <p className="mb-4 text-sm text-slate-500">
                  Showing {(page - 1) * PAGE_SIZE + 1} – {(page - 1) * PAGE_SIZE + stores.length} of{" "}
                  {total} stores
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  {stores.map((store) => (
                    <StoreCard
                      key={store.id}
                      store={{
                        slug: store.slug,
                        name: store.name,
                        logoUrl: store.logoUrl,
                        cashbackDisplayText: store.cashbackDisplayText,
                        featured: store.featured,
                      }}
                    />
                  ))}
                </div>
              </>
            )}

            <Pagination
              page={page}
              totalPages={totalPages}
              basePath="/stores"
              searchParams={{ category, q, rate }}
              variant="light"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
