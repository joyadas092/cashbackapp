import Link from "next/link";
import { cn } from "@/lib/utils";

type Variant = "dark" | "light";

export function Pagination({
  page,
  totalPages,
  basePath,
  searchParams,
  variant = "dark",
}: {
  page: number;
  totalPages: number;
  basePath: string;
  searchParams?: Record<string, string | undefined>;
  variant?: Variant;
}) {
  if (totalPages <= 1) return null;

  function hrefFor(p: number) {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams ?? {})) {
      if (value) params.set(key, value);
    }
    params.set("page", String(p));
    return `${basePath}?${params.toString()}`;
  }

  return (
    <div className="flex items-center justify-center gap-2 py-6">
      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
        <Link
          key={p}
          href={hrefFor(p)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full text-sm font-medium transition-colors",
            p === page
              ? "bg-violet-600 text-white"
              : variant === "light"
                ? "bg-slate-100 text-slate-600 hover:bg-slate-200"
                : "bg-white/10 text-white/70 hover:bg-white/20"
          )}
        >
          {p}
        </Link>
      ))}
    </div>
  );
}
