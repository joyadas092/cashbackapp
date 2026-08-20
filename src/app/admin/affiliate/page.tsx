import Link from "next/link";
import { CheckCircle2, Clock, Link2, MousePointerClick, Package, Users } from "lucide-react";
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

const PAGE_SIZE = 15;

/**
 * Share & Earn reporting.
 *
 * An "affiliate" here is simply a user who has created at least one profit
 * link — there is no separate affiliate account type, so the report is built
 * from ProfitLink ownership rather than a role flag.
 *
 * Every figure attributes to the link's owner, never to whoever clicked it. The
 * person who buys through a shared link is usually a stranger with no account.
 */
export default async function AdminAffiliatePage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  await requireAdminSession("/admin/affiliate");

  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);
  const { inPeriod, inPrior } = reportWindows();

  const affiliateFilter = { profitLinks: { some: {} } };
  const profitClick = { clickType: "PROFIT_LINK" as const };

  const [
    affiliates,
    totalAffiliates,
    affiliatesPeriod,
    affiliatesPrior,
    clicksTotal,
    clicksPeriod,
    clicksPrior,
    ordersTotal,
    ordersPeriod,
    ordersPrior,
    commissionTotal,
    commissionPeriod,
    commissionPrior,
    paidAgg,
    pendingAgg,
    reversedAgg,
    seriesClicks,
    seriesEarnings,
    recentAffiliates,
    linkCount,
  ] = await Promise.all([
    prisma.user.findMany({
      where: affiliateFilter,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      select: {
        id: true,
        name: true,
        email: true,
        riskStatus: true,
        createdAt: true,
        _count: { select: { profitLinks: true } },
      },
    }),
    prisma.user.count({ where: affiliateFilter }),
    prisma.user.count({ where: { profitLinks: { some: { createdAt: inPeriod } } } }),
    prisma.user.count({ where: { profitLinks: { some: { createdAt: inPrior } } } }),
    prisma.click.count({ where: profitClick }),
    prisma.click.count({ where: { ...profitClick, createdAt: inPeriod } }),
    prisma.click.count({ where: { ...profitClick, createdAt: inPrior } }),
    prisma.transaction.count({ where: { click: profitClick } }),
    prisma.transaction.count({ where: { click: profitClick, createdAt: inPeriod } }),
    prisma.transaction.count({ where: { click: profitClick, createdAt: inPrior } }),
    prisma.transaction.aggregate({
      where: { click: profitClick },
      _sum: { profitLinkAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { click: profitClick, createdAt: inPeriod },
      _sum: { profitLinkAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { click: profitClick, createdAt: inPrior },
      _sum: { profitLinkAmount: true },
    }),
    // Ledger view: what has actually been credited, is still pending, or was
    // clawed back. The transaction table says what was earned; the ledger says
    // what was paid.
    prisma.walletTransaction.aggregate({
      where: { type: "PROFIT_LINK_EARNING", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "PROFIT_LINK_EARNING", status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { type: "PROFIT_LINK_EARNING_REVERSED" },
      _sum: { amount: true },
    }),
    prisma.click.findMany({
      where: { ...profitClick, createdAt: inPeriod },
      select: { createdAt: true },
    }),
    prisma.transaction.findMany({
      where: { click: profitClick, createdAt: inPeriod },
      select: { createdAt: true, profitLinkAmount: true },
    }),
    prisma.profitLink.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: {
        id: true,
        code: true,
        createdAt: true,
        user: { select: { id: true, name: true, email: true } },
        store: { select: { name: true } },
      },
    }),
    prisma.profitLink.count(),
  ]);

  // Per-affiliate rollups, scoped to the page being shown.
  const affiliateIds = affiliates.map((affiliate) => affiliate.id);
  const [linkRows, clickRows, txRows, earningRows] = await Promise.all([
    affiliateIds.length > 0
      ? prisma.profitLink.findMany({
          where: { userId: { in: affiliateIds } },
          select: { id: true, userId: true },
        })
      : Promise.resolve([]),
    affiliateIds.length > 0
      ? prisma.click.findMany({
          where: { profitLink: { userId: { in: affiliateIds } } },
          select: { id: true, profitLink: { select: { userId: true } } },
        })
      : Promise.resolve([]),
    affiliateIds.length > 0
      ? prisma.transaction.findMany({
          where: { click: { profitLink: { userId: { in: affiliateIds } } } },
          select: {
            id: true,
            profitLinkAmount: true,
            click: { select: { profitLink: { select: { userId: true } } } },
          },
        })
      : Promise.resolve([]),
    affiliateIds.length > 0
      ? prisma.walletTransaction.groupBy({
          by: ["userId", "status"],
          where: { userId: { in: affiliateIds }, type: "PROFIT_LINK_EARNING" },
          _sum: { amount: true },
        })
      : Promise.resolve([]),
  ]);

  const linksByUser = new Map<string, number>();
  for (const row of linkRows) linksByUser.set(row.userId, (linksByUser.get(row.userId) ?? 0) + 1);

  const clicksByUser = new Map<string, number>();
  for (const row of clickRows) {
    const id = row.profitLink?.userId;
    if (id) clicksByUser.set(id, (clicksByUser.get(id) ?? 0) + 1);
  }

  const ordersByUser = new Map<string, number>();
  const commissionByUser = new Map<string, number>();
  for (const row of txRows) {
    const id = row.click.profitLink?.userId;
    if (!id) continue;
    ordersByUser.set(id, (ordersByUser.get(id) ?? 0) + 1);
    commissionByUser.set(id, (commissionByUser.get(id) ?? 0) + Number(row.profitLinkAmount));
  }

  const paidByUser = new Map<string, number>();
  const pendingByUser = new Map<string, number>();
  for (const row of earningRows) {
    const amount = Number(row._sum.amount ?? 0);
    if (row.status === "COMPLETED") paidByUser.set(row.userId, amount);
    if (row.status === "PENDING") pendingByUser.set(row.userId, amount);
  }

  const series = buildDualSeries(
    seriesClicks,
    seriesEarnings.map((tx) => ({ createdAt: tx.createdAt, amount: tx.profitLinkAmount })),
    { sumSecondary: true }
  );

  const paid = Number(paidAgg._sum.amount ?? 0);
  const pending = Number(pendingAgg._sum.amount ?? 0);
  const reversed = Number(reversedAgg._sum.amount ?? 0);
  const commissionSlices = [
    { name: "Paid", value: paid },
    { name: "Pending", value: pending },
    { name: "Reversed", value: reversed },
  ].filter((slice) => slice.value > 0);
  const commissionSliceTotal = commissionSlices.reduce((sum, slice) => sum + slice.value, 0);

  const topEarners = [...commissionByUser.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, amount]) => ({
      user: affiliates.find((affiliate) => affiliate.id === userId),
      amount,
    }))
    .filter((row): row is { user: (typeof affiliates)[number]; amount: number } => Boolean(row.user));

  const totalPages = Math.max(1, Math.ceil(totalAffiliates / PAGE_SIZE));
  const num = (value: unknown) => Number(value ?? 0);

  const stats = [
    { label: "Affiliates", value: String(totalAffiliates), icon: Users, tone: "bg-violet-50 text-violet-600", delta: reportDelta(affiliatesPeriod, affiliatesPrior) },
    { label: "Profit Links", value: String(linkCount), icon: Link2, tone: "bg-sky-50 text-sky-600", delta: null },
    { label: "Link Clicks", value: String(clicksTotal), icon: MousePointerClick, tone: "bg-indigo-50 text-indigo-600", delta: reportDelta(clicksPeriod, clicksPrior) },
    { label: "Orders", value: String(ordersTotal), icon: Package, tone: "bg-cashlime-50 text-cashlime-700", delta: reportDelta(ordersPeriod, ordersPrior) },
    {
      label: "Total Commission",
      value: formatInr(num(commissionTotal._sum.profitLinkAmount)),
      icon: CheckCircle2,
      tone: "bg-amber-50 text-amber-600",
      delta: reportDelta(
        num(commissionPeriod._sum.profitLinkAmount),
        num(commissionPrior._sum.profitLinkAmount)
      ),
    },
    { label: "Pending Commission", value: formatInr(pending), icon: Clock, tone: "bg-rose-50 text-rose-600", delta: null, invertDelta: true },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Affiliate"
        subtitle="Share & Earn performance — everything attributed to the person who shared the link, not the person who clicked it."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={`vs prev ${REPORT_WINDOW_DAYS} days`} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard title="Top Affiliates" padded={false}>
          <div className="mt-4">
            {affiliates.length === 0 ? (
              <AdminEmpty
                title="Nobody has created a profit link yet"
                body="Affiliates appear here as soon as a user generates their first link."
              />
            ) : (
              <AdminTableWrap minWidth={1020}>
                <thead>
                  <tr className="border-b border-slate-100">
                    <AdminTh>Affiliate</AdminTh>
                    <AdminTh align="right">Links</AdminTh>
                    <AdminTh align="right">Clicks</AdminTh>
                    <AdminTh align="right">Orders</AdminTh>
                    <AdminTh align="right">Commission</AdminTh>
                    <AdminTh align="right">Pending</AdminTh>
                    <AdminTh align="right">Paid</AdminTh>
                    <AdminTh align="right">Conversion</AdminTh>
                    <AdminTh>Status</AdminTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {affiliates.map((affiliate) => {
                    const clicks = clicksByUser.get(affiliate.id) ?? 0;
                    const orders = ordersByUser.get(affiliate.id) ?? 0;
                    // Undefined, not zero, when nobody has clicked — a 0.00%
                    // conversion rate on zero clicks is a made-up number.
                    const conversion = clicks > 0 ? (orders / clicks) * 100 : null;

                    return (
                      <tr key={affiliate.id} className="hover:bg-slate-50/60">
                        <td className="px-5 py-3">
                          <Link
                            href={`/admin/users/${affiliate.id}`}
                            className="flex items-center gap-2.5 hover:text-violet-700"
                          >
                            <Avatar name={affiliate.name} seed={affiliate.id} size={30} />
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-slate-900">
                                {affiliate.name}
                              </span>
                              <span className="block truncate text-xs text-slate-400">
                                {affiliate.email}
                              </span>
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {linksByUser.get(affiliate.id) ?? affiliate._count.profitLinks}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">{clicks}</td>
                        <td className="px-5 py-3 text-right text-slate-600">{orders}</td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                          {formatInrExact(commissionByUser.get(affiliate.id) ?? 0)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-amber-700">
                          {formatInrExact(pendingByUser.get(affiliate.id) ?? 0)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right text-cashlime-700">
                          {formatInrExact(paidByUser.get(affiliate.id) ?? 0)}
                        </td>
                        <td className="px-5 py-3 text-right text-slate-600">
                          {conversion === null ? "—" : `${conversion.toFixed(2)}%`}
                        </td>
                        <td className="px-5 py-3">
                          <AdminBadge
                            label={affiliate.riskStatus === "NORMAL" ? "Active" : affiliate.riskStatus}
                            tone={
                              affiliate.riskStatus === "NORMAL"
                                ? "bg-cashlime-50 text-cashlime-700"
                                : "bg-amber-50 text-amber-700"
                            }
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </AdminTableWrap>
            )}
          </div>

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={totalAffiliates}
            noun="affiliates"
            hrefForPage={(target) => `/admin/affiliate?page=${target}`}
          />
        </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Affiliate Performance" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <p className="mb-2 text-xs text-slate-400">Last {REPORT_WINDOW_DAYS} days</p>
              <DualMetricChart data={series} primaryName="Clicks" secondaryName="Commission" />
            </div>
          </AdminCard>

          <AdminCard title="Top Earning Affiliates">
            {topEarners.length === 0 ? (
              <p className="text-sm text-slate-500">No commission earned yet.</p>
            ) : (
              <ol className="space-y-3">
                {topEarners.map((row, i) => (
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
              Ranked within the affiliates on this page.
            </p>
          </AdminCard>

          <AdminCard title="Commission Status" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={commissionSlices}
                total={commissionSliceTotal}
                centreLabel="Total"
                emptyMessage="Nothing credited yet."
              />
            </div>
          </AdminCard>
        </aside>
      </div>

      <AdminCard title="Recent Profit Links" className="mt-6" padded={false}>
        <div className="mt-4">
          {recentAffiliates.length === 0 ? (
            <AdminEmpty title="No profit links created yet" />
          ) : (
            <AdminTableWrap minWidth={680}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>Affiliate</AdminTh>
                  <AdminTh>Store</AdminTh>
                  <AdminTh>Link Code</AdminTh>
                  <AdminTh>Created</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentAffiliates.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${link.user.id}`}
                        className="flex items-center gap-2.5 hover:text-violet-700"
                      >
                        <Avatar name={link.user.name} seed={link.user.id} size={28} />
                        <span className="min-w-0">
                          <span className="block truncate text-slate-800">{link.user.name}</span>
                          <span className="block truncate text-xs text-slate-400">
                            {link.user.email}
                          </span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-600">{link.store.name}</td>
                    <td className="px-5 py-3 font-mono text-xs text-slate-600">{link.code}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {reportDateTime(link.createdAt)}
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
