"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Copy, Search } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { formatInrExact } from "@/lib/utils";

export interface GoLinkRow {
  storeId: string;
  name: string;
  slug: string;
  logoUrl: string;
  cashbackText: string;
  url: string;
  used: boolean;
  clicks: number;
  orders: number;
  earned: number;
}

/**
 * Every store's goURL for this user, with how each has performed.
 *
 * Lists all active stores rather than only the links that exist, because a
 * goURL works before it has ever been used — the link row is created on the
 * first click. Showing only "created" links would hide the ones the user has
 * yet to try, which are the whole point.
 */
export function GoLinkTable({ rows }: { rows: GoLinkRow[] }) {
  const [query, setQuery] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [onlyUsed, setOnlyUsed] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows
      .filter((row) => (onlyUsed ? row.used : true))
      .filter((row) => (q ? row.name.toLowerCase().includes(q) : true))
      // Best performing first, then alphabetical for the untouched ones.
      .sort((a, b) => b.earned - a.earned || b.clicks - a.clicks || a.name.localeCompare(b.name));
  }, [rows, query, onlyUsed]);

  async function copy(row: GoLinkRow) {
    await navigator.clipboard.writeText(row.url);
    setCopiedId(row.storeId);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 border-y border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a store..."
            aria-label="Find a store"
            className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
          />
        </div>
        <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600">
          <input
            type="checkbox"
            checked={onlyUsed}
            onChange={(e) => setOnlyUsed(e.target.checked)}
            className="h-3.5 w-3.5 rounded border-slate-300"
          />
          Used only
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-slate-500">
          {onlyUsed
            ? "None of your goURLs have been used yet. Try one from the address bar."
            : "No stores match that search."}
        </p>
      ) : (
        <>
          {/* Cards on phones — a six-column table cannot be read at 390px. */}
          <ul className="divide-y divide-slate-100 sm:hidden">
            {filtered.map((row) => (
              <li key={row.storeId} className="p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                      <StoreLogo
                        src={row.logoUrl}
                        alt={row.name}
                        size={26}
                        fallbackSlug={row.slug}
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {row.name}
                      </span>
                      <span className="block truncate text-[11px] text-cashlime-700">
                        {row.cashbackText}
                      </span>
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => copy(row)}
                    aria-label={`Copy goURL for ${row.name}`}
                    className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 hover:border-violet-300 hover:text-violet-700"
                  >
                    {copiedId === row.storeId ? (
                      <Check size={14} strokeWidth={2.5} className="text-cashlime-600" />
                    ) : (
                      <Copy size={14} strokeWidth={2} />
                    )}
                  </button>
                </div>

                <a
                  href={row.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all font-mono text-[11px] leading-tight text-violet-700 hover:underline"
                >
                  {row.url}
                </a>

                <div className="mt-2 flex items-center gap-3 text-[11px] text-slate-500">
                  <span>{row.clicks} clicks</span>
                  <span>{row.orders} orders</span>
                  <span className="font-bold text-cashlime-700">{formatInrExact(row.earned)}</span>
                </div>
              </li>
            ))}
          </ul>

          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Store</th>
                  <th className="px-5 py-3 font-medium">Your goURL</th>
                  <th className="px-5 py-3 text-right font-medium">Clicks</th>
                  <th className="px-5 py-3 text-right font-medium">Orders</th>
                  <th className="px-5 py-3 text-right font-medium">Earned</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((row) => (
                  <tr key={row.storeId} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/stores/${row.slug}`}
                        className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-violet-700"
                      >
                        <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                          <StoreLogo
                            src={row.logoUrl}
                            alt={row.name}
                            size={26}
                            fallbackSlug={row.slug}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate">{row.name}</span>
                          <span className="block truncate text-xs text-cashlime-700">
                            {row.cashbackText}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <a
                        href={row.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="break-all font-mono text-xs text-violet-700 hover:underline"
                      >
                        {row.url}
                      </a>
                    </td>
                    <td className="px-5 py-3 text-right text-slate-600">{row.clicks}</td>
                    <td className="px-5 py-3 text-right text-slate-600">{row.orders}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                      {formatInrExact(row.earned)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => copy(row)}
                        aria-label={`Copy goURL for ${row.name}`}
                        className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-violet-300 hover:text-violet-700"
                      >
                        {copiedId === row.storeId ? (
                          <Check size={14} strokeWidth={2.5} className="text-cashlime-600" />
                        ) : (
                          <Copy size={14} strokeWidth={2} />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </>
  );
}
