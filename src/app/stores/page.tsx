import { prisma } from "@/lib/db";
import { StoreCard } from "@/components/store/StoreCard";
import { SearchBar } from "@/components/shared/SearchBar";
import { FilterBar } from "@/components/shared/FilterBar";
import { Pagination } from "@/components/shared/Pagination";
import { EmptyState } from "@/components/shared/EmptyState";

const PAGE_SIZE = 12;

export default async function StoresPage({
  searchParams,
}: {
  searchParams: { category?: string; q?: string; page?: string };
}) {
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const category = searchParams.category;
  const q = searchParams.q;

  const where = {
    status: "ACTIVE" as const,
    ...(category ? { category: { slug: category } } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [stores, total, categories] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: [{ featured: "desc" }, { ranking: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.store.count({ where }),
    prisma.storeCategory.findMany({ orderBy: { name: "asc" } }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">All Stores</h1>
      <div className="mt-4 max-w-md">
        <SearchBar />
      </div>
      <div className="mt-4">
        <FilterBar options={categories.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>

      {stores.length === 0 ? (
        <EmptyState message="No stores match your search." ctaLabel="Clear filters" ctaHref="/stores" />
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stores.map((store) => (
            <StoreCard
              key={store.id}
              store={{
                slug: store.slug,
                name: store.name,
                logoUrl: store.logoUrl,
                cashbackDisplayText: store.cashbackDisplayText,
              }}
            />
          ))}
        </div>
      )}

      <Pagination
        page={page}
        totalPages={totalPages}
        basePath="/stores"
        searchParams={{ category, q }}
      />
    </div>
  );
}
