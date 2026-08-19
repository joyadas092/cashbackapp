"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Users } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { formatInrExact } from "@/lib/utils";

/**
 * Display status for a referred user.
 *
 * This is not the same thing as Referral.status, which only records whether the
 * referral link itself is still live. A referral can be perfectly ACTIVE while
 * the friend has never ordered anything, and that reads as "Pending" to the
 * person who invited them — so the two are combined here rather than showing a
 * raw enum that answers the wrong question.
 */
export type ReferredUserStatus = "active" | "pending" | "inactive";

export interface ReferredUser {
  id: string;
  name: string;
  email: string;
  joinedAt: string;
  orders: number;
  cashbackEarned: number;
  yourEarnings: number;
  status: ReferredUserStatus;
}

const TABS: Array<{ key: "all" | ReferredUserStatus; label: string }> = [
  { key: "all", label: "All" },
  { key: "active", label: "Active" },
  { key: "pending", label: "Pending" },
  { key: "inactive", label: "Inactive" },
];

const SORTS = [
  { value: "recent", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "earnings", label: "Highest earnings" },
  { value: "orders", label: "Most orders" },
] as const;

const STATUS_STYLES: Record<ReferredUserStatus, string> = {
  active: "bg-cashlime-50 text-cashlime-700",
  pending: "bg-amber-50 text-amber-700",
  inactive: "bg-slate-100 text-slate-500",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function ReferredUsersTable({
  users,
  total,
}: {
  users: ReferredUser[];
  /** Full count, which can exceed the rows loaded onto this page. */
  total: number;
}) {
  const [tab, setTab] = useState<"all" | ReferredUserStatus>("all");
  const [sort, setSort] = useState<string>("recent");

  const counts = useMemo(
    () => ({
      all: users.length,
      active: users.filter((u) => u.status === "active").length,
      pending: users.filter((u) => u.status === "pending").length,
      inactive: users.filter((u) => u.status === "inactive").length,
    }),
    [users]
  );

  const rows = useMemo(() => {
    const filtered = tab === "all" ? users : users.filter((u) => u.status === tab);
    const sorted = [...filtered];

    switch (sort) {
      case "oldest":
        sorted.sort((a, b) => +new Date(a.joinedAt) - +new Date(b.joinedAt));
        break;
      case "earnings":
        sorted.sort((a, b) => b.yourEarnings - a.yourEarnings);
        break;
      case "orders":
        sorted.sort((a, b) => b.orders - a.orders);
        break;
      default:
        sorted.sort((a, b) => +new Date(b.joinedAt) - +new Date(a.joinedAt));
    }
    return sorted;
  }, [users, tab, sort]);

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-0">
        <h2 className="text-lg font-bold text-slate-900">Your Referred Users</h2>

        <div className="relative">
          <select
            aria-label="Sort referred users"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="appearance-none rounded-lg border border-slate-200 bg-white py-2 pl-3.5 pr-9 text-sm font-medium text-slate-700 outline-none focus:border-violet-400"
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            strokeWidth={2}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
        </div>
      </div>

      {/* Tabs */}
      <div role="tablist" className="mt-4 flex gap-1 overflow-x-auto border-b border-slate-200 px-5">
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => setTab(t.key)}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label} ({counts[t.key]})
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Users size={22} strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-700">
            {tab === "all" ? "No referrals yet" : `No ${tab} referrals`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "all"
              ? "Share your link above — you earn from your friends' activity."
              : "Try a different tab."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-slate-400">
              <tr className="border-b border-slate-100">
                <th className="px-5 py-3 font-medium">User</th>
                <th className="px-5 py-3 font-medium">Joined On</th>
                <th className="px-5 py-3 font-medium">Orders</th>
                <th className="px-5 py-3 font-medium">Cashback Earned</th>
                <th className="px-5 py-3 font-medium">Your Earnings</th>
                <th className="px-5 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((user) => (
                <tr key={user.id} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={user.name} seed={user.id} size={36} />
                      <div className="min-w-0">
                        <div className="truncate font-semibold text-slate-900">{user.name}</div>
                        <div className="truncate text-xs text-slate-400">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {formatDate(user.joinedAt)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">{user.orders}</td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-600">
                    {formatInrExact(user.cashbackEarned)}
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 font-semibold text-cashlime-700">
                    {formatInrExact(user.yourEarnings)}
                  </td>
                  <td className="px-5 py-3">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[user.status]}`}
                    >
                      {user.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > users.length && (
        <p className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          Showing your {users.length} most recent referrals of {total}.
        </p>
      )}
    </section>
  );
}
