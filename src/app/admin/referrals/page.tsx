import Link from "next/link";
import { CheckCircle2, Clock, Gift, UserPlus, Users } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { DualMetricChart, TopStoresDonut } from "@/components/admin/AdminCharts";
import { Avatar } from "@/components/shared/Avatar";
import {
  REPORT_WINDOW_DAYS,
  buildDualSeries,
  reportDateTime,
  reportDelta,
  reportWindows,
} from "@/lib/adminReports";
import { formatInr, formatInrExact } from "@/lib/utils";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 15;

const REFERRAL_TONES: Record<string, string> = {
  ACTIVE: "bg-cashlime-50 text-cashlime-700",
  EXPIRED: "bg-slate-100 text-slate-500",
  BLOCKED: "bg-rose-50 text-rose-600",
};

/**
 * Refer & Earn reporting.
 *
 * Rows are referrers — users who have referred at least one person — with what
 * their referrals have actually generated. Referral earnings come from the
 * wallet ledger rather than Referral.totalEarned, so a reversal is reflected
 * instead of showing a figure that was later clawed back.
 */
export default async function AdminReferralsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdminSession("/admin/referrals");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { inPeriod, inPrior } = reportWindows();

  const [
    referrers,
    totalReferrers,
    totalReferrals,
    referralsPeriod,
    referralsPrior,
    statusCounts,
    paidAgg,
    pendingAgg,
    reversedAgg,
    paidPeriod,
    paidPrior,
    seriesReferrals,
    seriesEarnings,
    recentReferrals,
    rule,
  ] = await Promise.all([
    prisma.user.findMany({
      where: { referralsMade: { some: {} } },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        referralCode: true,
        riskStatus: true,
        createdAt: true,
        _count: { select: { referralsMade: true } },
      },
    }),
    prisma.user.count({ where: { referralsMade: { some: {} } } }),
    prisma.referral.count(),
    prisma.referral.count({ where: { createdAt: inPeriod } }),
    prisma.referral.count({ where: { createdAt: inPrior } }),
    prisma.referral.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.walletTransaction.aggregate({
      where: { type: "REFERRAL_EARNING", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "REFERRAL_EARNING", status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "REFERRAL_EARNING_REVERSED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "REFERRAL_EARNING", status: "COMPLETED", createdAt: inPeriod },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "REFERRAL_EARNING", status: "COMPLETED", createdAt: inPrior },
      _sum: { amount: true },
    }),
    prisma.referral.findMany({ where: { createdAt: inPeriod }, select: { createdAt: true } }),
    prisma.walletTransaction.findMany({
      where: { type: "REFERRAL_EARNING", createdAt: inPeriod },
      select: { createdAt: true, amount: true },
    }),
    prisma.referral.findMany({
      orderBy: { createdAt: "desc" },
      take: 6,
      include: {
        referrer: { select: { id: true, name: true } },
        referredUser: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.referralRule.findFirst({ where: { isActive: true } }),
  ]);

  // Per-referrer rollups, scoped to the page being shown.
  const referrerIds = referrers.map((referrer) => referrer.id);
  const [referralRows, earningRows] = await Promise.all([
    referrerIds.length > 0
      ? prisma.referral.groupBy({
          by: ["referrerId", "status"],
          where: { referrerId: { in: referrerIds } },
          _count: { _all: true },
        })
      : Promise.resolve([]),
    referrerIds.length > 0
      ? prisma.walletTransaction.groupBy({
          by: ["userId", "status"],
          where: { userId: { in: referrerIds }, type: "REFERRAL_EARNING" },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const totalByReferrer = new Map<string, number>();
  const activeByReferrer = new Map<string, number>();
  for (const row of referralRows) {
    totalByReferrer.set(
      row.referrerId,
      (totalByReferrer.get(row.referrerId) ?? 0) + row._count._all
    );
    if (row.status === "ACTIVE") {
      activeByReferrer.set(
        row.referrerId,
        (activeByReferrer.get(row.referrerId) ?? 0) + row._count._all
      );
    }
  }

  const paidByReferrer = new Map<string, number>();
  const pendingByReferrer = new Map<string, number>();
  for (const row of earningRows) {
    const amount = Number(row._sum.amount ?? 0);
    if (row.status === "COMPLETED") paidByReferrer.set(row.userId, amount);
    if (row.status === "PENDING") pendingByReferrer.set(row.userId, amount);
  }

  const series = buildDualSeries(seriesReferrals, seriesEarnings, { sumSecondary: true });

  const paid = Number(paidAgg._sum.amount ?? 0);
  const pending = Number(pendingAgg._sum.amount ?? 0);
  const reversed = Number(reversedAgg._sum.amount ?? 0);

  const statusSlices = statusCounts
    .map((row) => ({ name: row.status.charAt(0) + row.status.slice(1).toLowerCase(), value: row._count._all }))
    .filter((slice) => slice.value > 0);

  const topReferrers = [...paidByReferrer.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, amount]) => ({
      user: referrers.find((referrer) => referrer.id === userId),
      amount,
    }))
    .filter((row): row is { user: (typeof referrers)[number]; amount: number } => Boolean(row.user));

  const totalPages = Math.max(1, Math.ceil(totalReferrers / PAGE_SIZE));
  const num = (value: unknown) => Number(value ?? 0);

  const stats = [
    { label: "Referrers", value: String(totalReferrers), icon: Users, tone: "bg-violet-50 text-violet-600", delta: null },
    { label: "Total Referrals", value: String(totalReferrals), icon: UserPlus, tone: "bg-sky-50 text-sky-600", delta: reportDelta(referralsPeriod, referralsPrior) },
    { label: "New This Period", value: String(referralsPeriod), icon: Gift, tone: "bg-indigo-50 text-indigo-600", delta: reportDelta(referralsPeriod, referralsPrior) },
    {
      label: "Paid Out",
      value: formatInr(paid),
      icon: CheckCircle2,
      tone: "bg-cashlime-50 text-cashlime-700",
      delta: reportDelta(num(paidPeriod._sum.amount), num(paidPrior._sum.amount)),
    },
    { label: "Pending", value: formatInr(pending), icon: Clock, tone: "bg-amber-50 text-amber-600", delta: null, invertDelta: true },
    { label: "Reversed", value: formatInr(reversed), icon: Clock, tone: "bg-rose-50 text-rose-600", delta: null, invertDelta: true },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Referrals"
        subtitle="Refer & Earn performance, by the person who did the referring."
        actions={
          <Link
            href="/admin/referral"
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Referral Settings
          </Link>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={`vs prev ${REPORT_WINDOW_DAYS} days`} />
        ))}
      </div>

      {rule && (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-card">
          Current rule:{" "}
          {rule.headlineRatePct ? `${Number(rule.headlineRatePct)}% advertised` : "no advertised rate"}
          {rule.durationDays ? ` · ${rule.durationDays}-day window` : ""}
          {rule.maxTotalEarning ? ` · capped at ${formatInrExact(Number(rule.maxTotalEarning))} per friend` : ""}
          {rule.minOrderValue ? ` · min order ${formatInrExact(Number(rule.minOrderValue))}` : ""}
        </p>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="Referrers" padded={false}>
          <div className="mt-4">
            {referrers.length === 0 ? (
              <AdminEmpty
                title="Nobody has referred anyone yet"
                body="Referrers appear here once someone signs up through their link."
              />
            ) : (
              <AdminTableWrap minWidth={940}>
                <thead>
                  <tr className="border-b border-slate-100">
                    <AdminTh>Referrer</AdminTh>
                    <AdminTh>Code</AdminTh>
                    <AdminTh align="right">Referrals</AdminTh>
                    <AdminTh align="right">Active</AdminTh>
                    <AdminTh align="right">Earned</AdminTh>
                    <AdminTh align="right">Pending</AdminTh>
                    <AdminTh>Status</AdminTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {referrers.map((referrer) => (
                    <tr key={referrer.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/users/${referrer.id}`}
                          className="flex items-center gap-2.5 hover:text-violet-700"
                        >
                          <Avatar name={referrer.name} seed={referrer.id} size={30} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium text-slate-900">
                              {referrer.name}
                            </span>
                            <span className="block truncate text-xs text-slate-400">
                              {referrer.email}
                            </span>
                          </span>
                        </Link>
                      </td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-600">
                        {referrer.referralCode}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {totalByReferrer.get(referrer.id) ?? referrer._count.referralsMade}
                      </td>
                      <td className="px-5 py-3 text-right text-slate-600">
                        {activeByReferrer.get(referrer.id) ?? 0}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                        {formatInrExact(paidByReferrer.get(referrer.id) ?? 0)}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-amber-700">
                        {formatInrExact(pendingByReferrer.get(referrer.id) ?? 0)}
                      </td>
                      <td className="px-5 py-3">
                        <AdminBadge
                          label={referrer.riskStatus === "NORMAL" ? "Active" : referrer.riskStatus}
                          tone={
                            referrer.riskStatus === "NORMAL"
                              ? "bg-cashlime-50 text-cashlime-700"
                              : "bg-amber-50 text-amber-700"
                          }
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={totalReferrers}
            noun="referrers"
            hrefForPage={(target) => `/admin/referrals?page=${target}`}
          />
        </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Referral Performance" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <p className="mb-2 text-xs text-slate-400">Last {REPORT_WINDOW_DAYS} days</p>
              <DualMetricChart data={series} primaryName="Signups" secondaryName="Earnings" />
            </div>
          </AdminCard>

          <AdminCard title="Top Referrers by Earnings">
            {topReferrers.length === 0 ? (
              <p className="text-sm text-slate-500">No referral earnings yet.</p>
            ) : (
              <ol className="space-y-3">
                {topReferrers.map((row, i) => (
                  <li key={row.user.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <Avatar name={row.user.name} seed={row.user.id} size={26} />
                    <Link
                      href={`/admin/users/${row.user.id}`}
                      className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-violet-700"
                    >
                      {row.user.name}
                    </Link>
                    <span className="shrink-0 text-sm font-bold text-slate-900">
                      {formatInrExact(row.amount)}
                    </span>
                  </li>
                ))}
              </ol>
            )}
            <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-400">
              Ranked within the referrers on this page.
            </p>
          </AdminCard>

          <AdminCard title="Referral Status" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={statusSlices}
                total={totalReferrals}
                centreLabel="Referrals"
                valueFormat="count"
                emptyMessage="No referrals yet."
              />
            </div>
          </AdminCard>
        </aside>
      </div>

      <AdminCard title="Recent Referrals" className="mt-6" padded={false}>
        <div className="mt-4">
          {recentReferrals.length === 0 ? (
            <AdminEmpty title="No referrals recorded yet" />
          ) : (
            <AdminTableWrap minWidth={760}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>Referred User</AdminTh>
                  <AdminTh>Referred By</AdminTh>
                  <AdminTh>Code</AdminTh>
                  <AdminTh align="right">Earned So Far</AdminTh>
                  <AdminTh>Status</AdminTh>
                  <AdminTh>Joined</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentReferrals.map((referral) => (
                  <tr key={referral.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${referral.referredUser.id}`}
                        className="flex items-center gap-2.5 hover:text-violet-700"
                      >
                        <Avatar
                          name={referral.referredUser.name}
                          seed={referral.referredUser.id}
                          size={28}
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-slate-800">
                            {referral.referredUser.name}
                          </span>
                          <span className="block truncate text-xs text-slate-400">
                            {referral.referredUser.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${referral.referrer.id}`}
                        className="text-slate-700 hover:text-violet-700"
                      >
                        {referral.referrer.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{referral.code}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                      {formatInrExact(Number(referral.totalEarned))}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={referral.status.charAt(0) + referral.status.slice(1).toLowerCase()}
                        tone={REFERRAL_TONES[referral.status] ?? "bg-slate-100 text-slate-600"}
                      />
                    </td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      <LocalTime value={referral.createdAt.toISOString()} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
