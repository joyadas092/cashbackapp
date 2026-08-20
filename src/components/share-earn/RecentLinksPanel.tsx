"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowUpDown, CalendarDays, Check, Copy, History, MousePointerClick } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { LocalTime } from "@/components/shared/LocalTime";

interface RecentLink {
  id: string;
  code: string;
  shareUrl: string;
  clickCount: number;
  createdAt: string;
  store: { name: string; slug: string; logoUrl: string };
}

const SORTS = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "clicks", label: "Most clicks" },
] as const;

const RANGES = [
  { value: "all", label: "All time" },
  { value: "today", label: "Today" },
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
] as const;

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const control =
  "rounded-lg border border-slate-200 bg-white py-1.5 pl-7 pr-2 text-xs font-medium text-slate-700 outline-none focus:border-violet-400";

/**
 * Sidebar panel of the visitor's own profit links.
 *
 * Sorting and date filtering are query parameters, not client-side array work —
 * the list is paginated, so filtering the ten rows that happened to arrive would
 * silently ignore everything past page one.
 */
export function RecentLinksPanel({
  isLoggedIn,
  refreshKey,
}: {
  isLoggedIn: boolean;
  /** Bumped by the generator after a successful create, to pull the new link in. */
  refreshKey: number;
}) {
  const [links, setLinks] = useState<RecentLink[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(isLoggedIn);
  const [sort, setSort] = useState<string>("newest");
  const [range, setRange] = useState<string>("all");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    const res = await fetch(`/api/profit-links?sort=${sort}&range=${range}`).catch(() => null);
    setLoading(false);
    if (!res?.ok) return;
    const body = await res.json().catch(() => null);
    if (!body) return;
    setLinks(body.items ?? []);
    setTotal(body.total ?? 0);
  }, [isLoggedIn, sort, range]);

  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  async function copy(link: RecentLink) {
    await navigator.clipboard.writeText(link.shareUrl);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
      <div className="flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
          <History size={16} strokeWidth={2} />
        </span>
        <h2 className="text-base font-bold text-slate-900">Recent Links</h2>
        {total > 0 && (
          <span className="ml-auto rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
            {total}
          </span>
        )}
      </div>

      {!isLoggedIn ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <Link href="/login?callbackUrl=/share-earn" className="font-semibold text-violet-700 hover:underline">
            Log in
          </Link>{" "}
          to see the links you&apos;ve created and how many clicks each one has.
        </p>
      ) : (
        <>
          {/* Sort + date filter */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            <div className="relative">
              <ArrowUpDown
                size={13}
                strokeWidth={2}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                aria-label="Sort links"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
                className={`${control} w-full`}
              >
                {SORTS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <CalendarDays
                size={13}
                strokeWidth={2}
                className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                aria-label="Filter links by date"
                value={range}
                onChange={(e) => setRange(e.target.value)}
                className={`${control} w-full`}
              >
                {RANGES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-2.5">
            {loading && <p className="py-4 text-center text-sm text-slate-400">Loading…</p>}

            {!loading && links.length === 0 && (
              <p className="rounded-xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                {range === "all"
                  ? "No links yet. Generate your first one on the left."
                  : "No links in this period."}
              </p>
            )}

            {!loading &&
              links.map((link) => (
                <div
                  key={link.id}
                  className="flex items-center gap-3 rounded-xl border border-slate-200 p-2.5 transition-colors hover:border-violet-200"
                >
                  <div className="shrink-0 rounded-lg ring-1 ring-slate-200">
                    <StoreLogo
                      src={link.store.logoUrl}
                      alt={link.store.name}
                      size={32}
                      fallbackSlug={link.store.slug}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-slate-900">
                      {link.store.name}
                    </div>
                    {/* Full URL, not the bare code — this is the thing people
                        paste, so it has to be readable and selectable. */}
                    <a
                      href={link.shareUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 block break-all font-mono text-[11px] leading-tight text-violet-700 hover:underline"
                    >
                      {link.shareUrl}
                    </a>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <span><LocalTime value={link.createdAt} format="date" /></span>
                      <span className="flex items-center gap-0.5">
                        <MousePointerClick size={11} strokeWidth={2} />
                        {link.clickCount}
                      </span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => copy(link)}
                    title="Copy link"
                    className="shrink-0 rounded-lg border border-slate-200 p-1.5 text-slate-500 transition-colors hover:border-violet-300 hover:text-violet-700"
                  >
                    {copiedId === link.id ? (
                      <Check size={14} strokeWidth={2.5} className="text-cashlime-600" />
                    ) : (
                      <Copy size={14} strokeWidth={2} />
                    )}
                  </button>
                </div>
              ))}
          </div>

          {total > links.length && (
            <Link
              href="/dashboard/activity"
              className="mt-3 block text-center text-sm font-semibold text-violet-700 hover:underline"
            >
              View all links
            </Link>
          )}
        </>
      )}
    </div>
  );
}
