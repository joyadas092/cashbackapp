import Link from "next/link";
import { BadgeCheck, Ban, Download, Search, ShieldAlert, UserCheck, Users } from "lucide-react";
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
import { AddUserDialog } from "@/components/admin/AddUserDialog";
import { UserRowActions } from "@/components/admin/UserRowActions";
import { Avatar } from "@/components/shared/Avatar";
import {
  JOINED_OPTIONS,
  KYC_OPTIONS,
  QUICK_FILTERS,
  STATUS_OPTIONS,
  buildUserWhere,
  parseUserFilters,
  userFiltersToQuery,
} from "@/lib/adminUserFilters";
import { formatInrExact } from "@/lib/utils";

const PAGE_SIZE = 15;
const WINDOW_DAYS = 15;

const RISK_META: Record<string, { label: string; tone: string }> = {
  NORMAL: { label: "Active", tone: "bg-cashlime-50 text-cashlime-700" },
  REVIEW: { label: "Under review", tone: "bg-amber-50 text-amber-700" },
  RESTRICTED: { label: "Restricted", tone: "bg-orange-50 text-orange-700" },
  BLOCKED: { label: "Blocked", tone: "bg-rose-50 text-rose-600" },
};

const KYC_META: Record<string, { label: string; tone: string }> = {
  VERIFIED: { label: "Verified", tone: "bg-cashlime-50 text-cashlime-700" },
  PENDING: { label: "Pending", tone: "bg-amber-50 text-amber-700" },
  REJECTED: { label: "Rejected", tone: "bg-rose-50 text-rose-600" },
};

function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await requireAdminSession("/admin/users");

  const params = new URLSearchParams(
    Object.entries(searchParams).flatMap(([key, value]) =>
      typeof value === "string" ? [[key, value] as [string, string]] : []
    )
  );
  const filters = parseUserFilters(params);
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const where = buildUserWhere(filters);

  const periodStart = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);
  const priorStart = new Date(Date.now() - WINDOW_DAYS * 2 * 24 * 60 * 60 * 1000);

  const [
    users,
    total,
    totalUsers,
    riskCounts,
    verifiedCount,
    newPeriod,
    newPrior,
    activePeriod,
    activePrior,
    topEarners,
  ] = await Promise.all([
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        riskStatus: true,
        createdAt: true,
        profile: { select: { kycStatus: true } },
        wallet: { select: { lifetimeEarned: true } },
      },
    }),
    prisma.user.count({ where }),
    prisma.user.count(),
    prisma.user.groupBy({ by: ["riskStatus"], _count: { _all: true } }),
    prisma.userProfile.count({ where: { kycStatus: "VERIFIED" } }),
    prisma.user.count({ where: { createdAt: { gte: periodStart } } }),
    prisma.user.count({ where: { createdAt: { gte: priorStart, lt: periodStart } } }),
    // "Active" here means genuinely used the platform in the window, not just a
    // status flag — a count of accounts that clicked something.
    prisma.user.count({ where: { clicks: { some: { createdAt: { gte: periodStart } } } } }),
    prisma.user.count({
      where: { clicks: { some: { createdAt: { gte: priorStart, lt: periodStart } } } },
    }),
    prisma.user.findMany({
      where: { wallet: { is: { lifetimeEarned: { gt: 0 } } } },
      orderBy: { wallet: { lifetimeEarned: "desc" } },
      take: 5,
      select: { id: true, name: true, wallet: { select: { lifetimeEarned: true } } },
    }),
  ]);

  const countFor = (status: string) =>
    riskCounts.find((row) => row.riskStatus === status)?._count._all ?? 0;

  const blocked = countFor("BLOCKED");
  const restricted = countFor("RESTRICTED");
  const review = countFor("REVIEW");
  const normal = countFor("NORMAL");

  // Per-user order counts, scoped to the rows actually on screen.
  const userIds = users.map((user) => user.id);
  const orderRows =
    userIds.length > 0
      ? await prisma.transaction.findMany({
          where: { click: { userId: { in: userIds } } },
          select: { id: true, click: { select: { userId: true } } },
        })
      : [];
  const ordersByUser = new Map<string, number>();
  for (const row of orderRows) {
    const id = row.click.userId;
    if (id) ordersByUser.set(id, (ordersByUser.get(id) ?? 0) + 1);
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const periodNote = `vs prev ${WINDOW_DAYS} days`;
  const link = (overrides: Parameters<typeof userFiltersToQuery>[1]) =>
    `/admin/users${userFiltersToQuery(filters, overrides)}`;

  const stats = [
    { label: "Total Users", value: String(totalUsers), icon: Users, tone: "bg-violet-50 text-violet-600", delta: delta(newPeriod, newPrior) },
    { label: "Active Users", value: String(normal), icon: UserCheck, tone: "bg-cashlime-50 text-cashlime-700", delta: null },
    { label: "New Users", value: String(newPeriod), icon: Users, tone: "bg-amber-50 text-amber-600", delta: delta(newPeriod, newPrior) },
    { label: "KYC Verified", value: String(verifiedCount), icon: BadgeCheck, tone: "bg-sky-50 text-sky-600", delta: null },
    {
      label: "Blocked / Restricted",
      value: String(blocked + restricted),
      icon: Ban,
      tone: "bg-rose-50 text-rose-600",
      delta: null,
      invertDelta: true,
    },
  ];

  const summary = [
    { label: "Active", value: normal, tone: "bg-cashlime-500" },
    { label: "Under review", value: review, tone: "bg-amber-500" },
    { label: "Restricted", value: restricted, tone: "bg-orange-500" },
    { label: "Blocked", value: blocked, tone: "bg-rose-500" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Users"
        subtitle="Manage and monitor all registered users"
        actions={
          <>
            <Link
              href={`/api/admin/users/export${userFiltersToQuery(filters)}`}
              prefetch={false}
              className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <Download size={15} strokeWidth={2} />
              Export
            </Link>
            <AddUserDialog />
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={periodNote} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <AdminCard padded={false}>
          {/* Filters — a GET form, so every combination is a shareable URL and
              the Export link can reuse exactly the same query. */}
          <form action="/admin/users" className="flex flex-wrap items-center gap-2 p-5">
            <div className="relative min-w-[220px] flex-1">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                name="q"
                defaultValue={filters.q}
                placeholder="Search by name, email, mobile or code..."
                aria-label="Search users"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
              />
            </div>

            <select name="status" defaultValue={filters.status} aria-label="Filter by status" className={selectClass}>
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select name="kyc" defaultValue={filters.kyc} aria-label="Filter by KYC" className={selectClass}>
              {KYC_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <select name="joined" defaultValue={filters.joined} aria-label="Filter by join date" className={selectClass}>
              {JOINED_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            {filters.quick && <input type="hidden" name="quick" value={filters.quick} />}

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>

            {(filters.q || filters.status !== "all" || filters.kyc !== "all" || filters.joined !== "all" || filters.quick) && (
              <Link
                href="/admin/users"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          {users.length === 0 ? (
            <AdminEmpty
              title="No users match these filters"
              body="Try clearing the search or widening the join date."
            />
          ) : (
            <AdminTableWrap minWidth={1040}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>User</AdminTh>
                  <AdminTh>Email / Mobile</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>KYC</AdminTh>
                  <AdminTh align="right">Total Earnings</AdminTh>
                  <AdminTh align="right">Orders</AdminTh>
                  <AdminTh>Joined On</AdminTh>
                  <AdminTh>Action</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((user) => {
                  const risk = RISK_META[user.riskStatus] ?? {
                    label: user.riskStatus,
                    tone: "bg-slate-100 text-slate-600",
                  };
                  const kyc = user.profile?.kycStatus
                    ? KYC_META[user.profile.kycStatus]
                    : undefined;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/users/${user.id}`}
                          className="flex items-center gap-2.5 hover:text-violet-700"
                        >
                          <Avatar name={user.name} seed={user.id} size={32} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">
                              {user.name}
                            </span>
                            {user.role === "ADMIN" && (
                              <span className="text-xs font-semibold text-violet-700">Admin</span>
                            )}
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3">
                        <span className="block truncate text-slate-600">{user.email}</span>
                        <span className="block text-xs text-slate-400">{user.phone ?? "—"}</span>
                      </td>
                      <td className="px-5 py-3">
                        <AdminBadge label={risk.label} tone={risk.tone} />
                      </td>
                      <td className="px-5 py-3">
                        {kyc ? (
                          <AdminBadge label={kyc.label} tone={kyc.tone} />
                        ) : (
                          <span className="text-xs text-slate-400">Not submitted</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                        {formatInrExact(Number(user.wallet?.lifetimeEarned ?? 0))}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {ordersByUser.get(user.id) ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {dateTime(user.createdAt)}
                      </td>
                      <td className="px-5 py-3">
                        <UserRowActions
                          userId={user.id}
                          userName={user.name}
                          riskStatus={user.riskStatus}
                          isAdmin={user.role === "ADMIN"}
                          isSelf={user.id === session.user.id}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </AdminTableWrap>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 px-5 py-3">
            <span className="text-xs text-slate-400">
              Showing {total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to{" "}
              {Math.min(page * PAGE_SIZE, total)} of {total} users
            </span>
            {totalPages > 1 && (
              <div className="flex gap-2">
                {page > 1 ? (
                  <Link
                    href={link({ page: page - 1 })}
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
                    href={link({ page: page + 1 })}
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
          <AdminCard title="User Summary">
            <div className="mt-2 space-y-3">
              {summary.map((row) => (
                <div key={row.label}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2 text-slate-600">
                      <span className={`h-2.5 w-2.5 rounded-full ${row.tone}`} />
                      {row.label}
                    </span>
                    <span className="font-semibold text-slate-900">
                      {row.value}
                      <span className="ml-1 text-xs font-normal text-slate-400">
                        ({totalUsers > 0 ? ((row.value / totalUsers) * 100).toFixed(1) : "0.0"}%)
                      </span>
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className={`h-full rounded-full ${row.tone}`}
                      style={{
                        width: `${totalUsers > 0 ? (row.value / totalUsers) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-4 flex items-start gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
              <ShieldAlert size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-slate-400" />
              Blocked accounts can&apos;t sign in. Restricted ones can sign in and earn, but
              can&apos;t withdraw.
            </p>
          </AdminCard>

          <AdminCard
            title="Top Users by Earnings"
            action={
              <Link
                href="/admin/users?quick=high"
                className="text-sm font-medium text-violet-700 hover:underline"
              >
                View All
              </Link>
            }
          >
            {topEarners.length === 0 ? (
              <p className="text-sm text-slate-500">Nobody has earned yet.</p>
            ) : (
              <ol className="space-y-3">
                {topEarners.map((user, i) => (
                  <li key={user.id} className="flex items-center gap-3">
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0
                          ? "bg-amber-100 text-amber-700"
                          : i === 1
                            ? "bg-slate-200 text-slate-600"
                            : i === 2
                              ? "bg-orange-100 text-orange-700"
                              : "bg-slate-100 text-slate-500"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <Avatar name={user.name} seed={user.id} size={28} />
                    <Link
                      href={`/admin/users/${user.id}`}
                      className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-violet-700"
                    >
                      {user.name}
                    </Link>
                    <span className="shrink-0 text-sm font-bold text-slate-900">
                      {formatInrExact(Number(user.wallet?.lifetimeEarned ?? 0))}
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>

          <AdminCard title="Quick Filters">
            <div className="grid grid-cols-1 gap-2">
              {QUICK_FILTERS.map((quick) => {
                const isActive = filters.quick === quick.value;
                return (
                  <Link
                    key={quick.value}
                    href={link({ quick: isActive ? "" : quick.value, page: 1 })}
                    className={`rounded-xl border px-4 py-3 text-center transition-colors ${
                      isActive
                        ? "border-violet-600 bg-violet-50"
                        : "border-slate-200 hover:border-violet-300"
                    }`}
                  >
                    <span
                      className={`block text-sm font-semibold ${
                        isActive ? "text-violet-700" : "text-slate-800"
                      }`}
                    >
                      {quick.label}
                    </span>
                    <span className="block text-xs text-slate-400">{quick.hint}</span>
                  </Link>
                );
              })}
            </div>
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
