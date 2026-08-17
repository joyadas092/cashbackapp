"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

export interface FilterOption {
  slug: string;
  name: string;
}

export function FilterBar({ options }: { options: FilterOption[] }) {
  const searchParams = useSearchParams();
  const active = searchParams.get("category");
  const q = searchParams.get("q");

  function hrefFor(slug?: string) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (slug) params.set("category", slug);
    const qs = params.toString();
    return qs ? `/stores?${qs}` : "/stores";
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Link
        href={hrefFor()}
        className={cn(
          "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
          !active ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
        )}
      >
        All
      </Link>
      {options.map((opt) => (
        <Link
          key={opt.slug}
          href={hrefFor(opt.slug)}
          className={cn(
            "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
            active === opt.slug
              ? "bg-violet-600 text-white"
              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
          )}
        >
          {opt.name}
        </Link>
      ))}
    </div>
  );
}
