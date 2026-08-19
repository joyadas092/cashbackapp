"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Search } from "lucide-react";

/** Search box that routes to the article list — results are rendered on the
 *  server, so the query lives in the URL and stays shareable. */
export function HelpSearch({
  placeholder = "Search for help articles, topics or questions...",
  initialQuery = "",
  size = "lg",
}: {
  placeholder?: string;
  initialQuery?: string;
  size?: "lg" | "sm";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(
      trimmed ? `/dashboard/help/articles?q=${encodeURIComponent(trimmed)}` : "/dashboard/help/articles"
    );
  }

  return (
    <form onSubmit={submit} className="relative">
      <Search
        size={size === "lg" ? 18 : 15}
        strokeWidth={2}
        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        aria-label="Search help"
        className={`w-full rounded-xl border border-slate-200 bg-white pl-11 pr-4 text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 ${
          size === "lg" ? "py-3.5 text-sm shadow-card" : "py-2.5 text-sm"
        }`}
      />
    </form>
  );
}
