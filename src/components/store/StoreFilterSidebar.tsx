import Link from "next/link";
import { cn } from "@/lib/utils";

export interface CategoryFilterOption {
  slug: string;
  name: string;
  count: number;
}

/** Cashback-rate buckets, filtered against the real Store.cashbackRate column. */
export const RATE_BUCKETS = [
  { key: "0-5", label: "1% – 5%", gte: 0, lt: 5 },
  { key: "5-10", label: "5% – 10%", gte: 5, lt: 10 },
  { key: "10-15", label: "10% – 15%", gte: 10, lt: 15 },
  { key: "15+", label: "15% & Above", gte: 15, lt: null },
] as const;

export function StoreFilterSidebar({
  categories,
  totalStores,
  activeCategory,
  activeRate,
  q,
}: {
  categories: CategoryFilterOption[];
  totalStores: number;
  activeCategory?: string;
  activeRate?: string;
  q?: string;
}) {
  function hrefFor(params: { category?: string; rate?: string }) {
    const sp = new URLSearchParams();
    if (q) sp.set("q", q);
    if (params.category) sp.set("category", params.category);
    if (params.rate) sp.set("rate", params.rate);
    const qs = sp.toString();
    return qs ? `/stores?${qs}` : "/stores";
  }

  return (
    <aside className="w-full shrink-0 sm:w-56">
      <div className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card">
        <h2 className="mb-3 text-sm font-bold text-slate-900">Categories</h2>
        <ul className="flex flex-col gap-0.5">
          <li>
            <Link
              href={hrefFor({ rate: activeRate })}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                !activeCategory
                  ? "bg-violet-50 font-semibold text-violet-700"
                  : "text-slate-600 hover:bg-slate-50"
              )}
            >
              All Stores
              <span className="text-xs text-slate-400">{totalStores}</span>
            </Link>
          </li>
          {categories.map((c) => (
            <li key={c.slug}>
              <Link
                href={hrefFor({ category: c.slug, rate: activeRate })}
                className={cn(
                  "flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors",
                  activeCategory === c.slug
                    ? "bg-violet-50 font-semibold text-violet-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                {c.name}
                <span className="text-xs text-slate-400">{c.count}</span>
              </Link>
            </li>
          ))}
        </ul>

        <h2 className="mb-3 mt-6 text-sm font-bold text-slate-900">Cashback</h2>
        <ul className="flex flex-col gap-0.5">
          {RATE_BUCKETS.map((b) => (
            <li key={b.key}>
              <Link
                href={
                  activeRate === b.key
                    ? hrefFor({ category: activeCategory })
                    : hrefFor({ category: activeCategory, rate: b.key })
                }
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  activeRate === b.key
                    ? "bg-violet-50 font-semibold text-violet-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span
                  className={cn(
                    "flex h-4 w-4 items-center justify-center rounded border text-[10px]",
                    activeRate === b.key
                      ? "border-violet-600 bg-violet-600 text-white"
                      : "border-slate-300"
                  )}
                >
                  {activeRate === b.key ? "✓" : ""}
                </span>
                {b.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}
