import Link from "next/link";
import {
  BarChart3,
  Bell,
  Gift,
  LifeBuoy,
  MousePointerClick,
  Package,
  Store as StoreIcon,
  Ticket,
  Users,
  Wallet,
  WalletCards,
} from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminPageHeader,
  AdminStat,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import {
  EarningsClicksChart,
  TopStoresDonut,
  UserGrowthChart,
  type EarningsClicksPoint,
  type UserGrowthPoint,
} from "@/components/admin/AdminCharts";
import { Avatar } from "@/components/shared/Avatar";
import { StoreLogo } from "@/components/store/StoreLogo";
import { formatInr, formatInrExact } from "@/lib/utils";

const WINDOW_DAYS = 15;

/** Percentage change, or null when there's no prior period to compare against. */
function delta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function shortDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function dateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const TX_TONES: Record<string, string> = {
  CONFIRMED: "bg-cashlime-50 text-cashlime-700",
  PAID: "bg-violet-50 text-violet-700",
  PENDING: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
  REVERSED: "bg-slate-100 text-slate-500",
};

const PAYOUT_TONES: Record<string, string> = {
  COMPLETED: "bg-cashlime-50 text-cashlime-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  REQUESTED: "bg-amber-50 text-amber-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

export default async function AdminDashboardPage() {
  await requireAdminSession("/admin");

  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(now.getDate() - WINDOW_DAYS);
  const priorStart = new Date(now);
  priorStart.setDate(now.getDate() - WINDOW_DAYS * 2);

  const inPeriod = { gte: periodStart };
  const inPrior = { gte: priorStart, lt: periodStart };

  const [
    users,
    usersPeriod,
    usersPrior,
    clicks,
    clicksPeriod,
    clicksPrior,
    orders,
    ordersPeriod,
    ordersPrior,
    earnings,
    earningsPeriod,
    earningsPrior,
    payouts,
    payoutsPeriod,
    payoutsPrior,
    pendingPayouts,
    pendingPayoutsPeriod,
    pendingPayoutsPrior,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { createdAt: inPeriod } }),
    prisma.user.count({ where: { createdAt: inPrior } }),
    prisma.click.count(),
    prisma.click.count({ where: { createdAt: inPeriod } }),
    prisma.click.count({ where: { createdAt: inPrior } }),
    prisma.transaction.count(),
    prisma.transaction.count({ where: { createdAt: inPeriod } }),
    prisma.transaction.count({ where: { createdAt: inPrior } }),
    // Platform earnings = the commission stores actually paid us on confirmed
    // orders, not the share handed back to users.
    prisma.transaction.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { commissionAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] }, createdAt: inPeriod },
      _sum: { commissionAmount: true },
    }),
    prisma.transaction.aggregate({
      where: { status: { in: ["CONFIRMED", "PAID"] }, createdAt: inPrior },
      _sum: { commissionAmount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "COMPLETED", requestedAt: inPeriod },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: "COMPLETED", requestedAt: inPrior },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["REQUESTED", "PROCESSING"] } },
      _sum: { amount: true },
      _count: { _all: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["REQUESTED", "PROCESSING"] }, requestedAt: inPeriod },
      _sum: { amount: true },
    }),
    prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["REQUESTED", "PROCESSING"] }, requestedAt: inPrior },
      _sum: { amount: true },
    }),
  ]);

  const [
    periodTxs,
    periodClicks,
    periodUsers,
    storeCommission,
    recentOrders,
    recentPayouts,
    recentUsers,
    sourceTotals,
    storeCount,
    articleCount,
    openTickets,
  ] = await Promise.all([
    prisma.transaction.findMany({
      where: { createdAt: inPeriod, status: { in: ["CONFIRMED", "PAID"] } },
      select: { createdAt: true, commissionAmount: true },
    }),
    prisma.click.findMany({ where: { createdAt: inPeriod }, select: { createdAt: true } }),
    prisma.user.findMany({ where: { createdAt: inPeriod }, select: { createdAt: true } }),
    prisma.transaction.groupBy({
      by: ["storeId"],
      where: { status: { in: ["CONFIRMED", "PAID"] } },
      _sum: { commissionAmount: true },
    }),
    prisma.transaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        store: { select: { name: true, slug: true, logoUrl: true } },
        click: { select: { user: { select: { name: true } } } },
      },
    }),
    prisma.withdrawalRequest.findMany({
      orderBy: { requestedAt: "desc" },
      take: 5,
      include: { user: { select: { name: true } } },
    }),
    prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 4,
      select: { id: true, name: true, email: true, createdAt: true, riskStatus: true },
    }),
    prisma.walletTransaction.groupBy({
      by: ["type"],
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.store.count(),
    prisma.helpArticle.count({ where: { isPublished: true } }),
    prisma.supportTicket.count({ where: { status: { in: ["OPEN", "IN_PROGRESS"] } } }),
  ]);

  // --- Series, bucketed in JS: Prisma's groupBy can't truncate to a day ------
  const buckets = new Map<string, { earnings: number; clicks: number; users: number }>();
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    buckets.set(dayKey(d), { earnings: 0, clicks: 0, users: 0 });
  }
  for (const tx of periodTxs) {
    const bucket = buckets.get(dayKey(tx.createdAt));
    if (bucket) bucket.earnings += Number(tx.commissionAmount);
  }
  for (const click of periodClicks) {
    const bucket = buckets.get(dayKey(click.createdAt));
    if (bucket) bucket.clicks += 1;
  }
  for (const user of periodUsers) {
    const bucket = buckets.get(dayKey(user.createdAt));
    if (bucket) bucket.users += 1;
  }

  const earningsSeries: EarningsClicksPoint[] = [];
  const growthSeries: UserGrowthPoint[] = [];
  // Growth is cumulative, so it starts from the count before the window rather
  // than from zero — starting at zero would imply the platform was empty.
  let runningUsers = users - usersPeriod;
  for (const [key, value] of buckets) {
    const label = shortDate(new Date(key));
    earningsSeries.push({
      label,
      earnings: Math.round(value.earnings * 100) / 100,
      clicks: value.clicks,
    });
    runningUsers += value.users;
    growthSeries.push({ label, users: runningUsers });
  }

  // --- Top stores by commission --------------------------------------------
  const topStores = storeCommission
    .sort((a, b) => Number(b._sum.commissionAmount ?? 0) - Number(a._sum.commissionAmount ?? 0))
    .slice(0, 5);
  const storeNames =
    topStores.length > 0
      ? await prisma.store.findMany({
          where: { id: { in: topStores.map((s) => s.storeId) } },
          select: { id: true, name: true },
        })
      : [];
  const nameById = new Map(storeNames.map((s) => [s.id, s.name]));
  const storeSlices = topStores.map((s) => ({
    name: nameById.get(s.storeId) ?? "Unknown",
    value: Number(s._sum.commissionAmount ?? 0),
  }));
  const storeSliceTotal = storeSlices.reduce((sum, s) => sum + s.value, 0);

  // --- What users earned, split by route ------------------------------------
  const sumOf = (types: string[]) =>
    sourceTotals
      .filter((row) => types.includes(row.type))
      .reduce((sum, row) => sum + Number(row._sum.amount ?? 0), 0);

  const sources = [
    { label: "Shopping Cashback", value: sumOf(["CASHBACK_CONFIRMED"]), icon: Package, tone: "bg-violet-50 text-violet-600" },
    { label: "Profit Link Earnings", value: sumOf(["PROFIT_LINK_EARNING"]), icon: BarChart3, tone: "bg-sky-50 text-sky-600" },
    { label: "Referral Earnings", value: sumOf(["REFERRAL_EARNING"]), icon: Gift, tone: "bg-cashlime-50 text-cashlime-700" },
    { label: "Bonuses & Others", value: sumOf(["ADJUSTMENT"]), icon: Ticket, tone: "bg-amber-50 text-amber-600" },
  ].filter((source) => source.value > 0);
  const sourceTotal = sources.reduce((sum, source) => sum + source.value, 0);

  const periodNote = `vs prev ${WINDOW_DAYS} days`;
  const num = (value: unknown) => Number(value ?? 0);

  const stats = [
    { label: "Total Users", value: String(users), icon: Users, tone: "bg-violet-50 text-violet-600", delta: delta(usersPeriod, usersPrior) },
    { label: "Total Clicks", value: String(clicks), icon: MousePointerClick, tone: "bg-sky-50 text-sky-600", delta: delta(clicksPeriod, clicksPrior) },
    { label: "Total Orders", value: String(orders), icon: Package, tone: "bg-cashlime-50 text-cashlime-700", delta: delta(ordersPeriod, ordersPrior) },
    {
      label: "Platform Earnings",
      value: formatInr(num(earnings._sum.commissionAmount)),
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
      delta: delta(
        num(earningsPeriod._sum.commissionAmount),
        num(earningsPrior._sum.commissionAmount)
      ),
    },
    {
      label: "Total Payouts",
      value: formatInr(num(payouts._sum.amount)),
      icon: WalletCards,
      tone: "bg-indigo-50 text-indigo-600",
      delta: delta(num(payoutsPeriod._sum.amount), num(payoutsPrior._sum.amount)),
    },
    {
      label: "Pending Payouts",
      value: formatInr(num(pendingPayouts._sum.amount)),
      icon: Bell,
      tone: "bg-rose-50 text-rose-600",
      delta: delta(num(pendingPayoutsPeriod._sum.amount), num(pendingPayoutsPrior._sum.amount)),
      // A growing pending pile is a backlog, not growth.
      invertDelta: true,
    },
  ];

  const systemRows = [
    { label: "Total Stores", value: String(storeCount), icon: StoreIcon, tone: "bg-violet-50 text-violet-600" },
    { label: "Published Help Articles", value: String(articleCount), icon: LifeBuoy, tone: "bg-sky-50 text-sky-600" },
    { label: "Payouts Awaiting Action", value: String(pendingPayouts._count._all), icon: WalletCards, tone: "bg-amber-50 text-amber-600" },
    { label: "Open Tickets", value: String(openTickets), icon: Ticket, tone: "bg-rose-50 text-rose-600" },
  ];

  const quickActions = [
    { label: "Manage Stores", href: "/admin/stores", icon: StoreIcon, tone: "bg-violet-50 text-violet-600" },
    { label: "Process Payouts", href: "/admin/payouts", icon: WalletCards, tone: "bg-cashlime-50 text-cashlime-700" },
    { label: "Support Queue", href: "/admin/support", icon: LifeBuoy, tone: "bg-sky-50 text-sky-600" },
    { label: "Help Articles", href: "/admin/help-articles", icon: BarChart3, tone: "bg-amber-50 text-amber-600" },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Dashboard"
        subtitle="Overview of your platform performance"
        actions={
          <span className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-sm text-slate-600">
            Last {WINDOW_DAYS} days
          </span>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} deltaNote={periodNote} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)] 2xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
        <AdminCard title="Earnings Overview" padded={false}>
          <div className="px-5 pb-5 pt-4">
            <EarningsClicksChart data={earningsSeries} />
          </div>
        </AdminCard>

        <AdminCard
          title="Top Stores"
          padded={false}
          action={
            <Link href="/admin/stores" className="text-sm font-medium text-violet-700 hover:underline">
              View All
            </Link>
          }
        >
          <div className="px-5 pb-5 pt-4">
            <TopStoresDonut data={storeSlices} total={storeSliceTotal} />
          </div>
        </AdminCard>

        <AdminCard title="User Growth" padded={false} className="xl:col-span-2 2xl:col-span-1">
          <div className="px-5 pb-5 pt-4">
            <UserGrowthChart data={growthSeries} />
            <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
              <div>
                <div className="text-lg font-extrabold text-slate-900">{users}</div>
                <div className="text-xs text-slate-400">Total Users</div>
              </div>
              <div className="text-sm font-semibold text-cashlime-700">
                +{usersPeriod} this period
              </div>
            </div>
          </div>
        </AdminCard>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminCard
          title="Recent Orders"
          padded={false}
          action={
            <Link href="/admin/orders" className="text-sm font-medium text-violet-700 hover:underline">
              View All
            </Link>
          }
        >
          <div className="mt-4">
            {recentOrders.length === 0 ? (
              <p className="px-5 pb-6 text-sm text-slate-500">No orders tracked yet.</p>
            ) : (
              <AdminTableWrap minWidth={720}>
                <thead>
                  <tr className="border-b border-slate-100">
                    <AdminTh>Order ID</AdminTh>
                    <AdminTh>User</AdminTh>
                    <AdminTh>Store</AdminTh>
                    <AdminTh align="right">Amount</AdminTh>
                    <AdminTh align="right">Commission</AdminTh>
                    <AdminTh>Status</AdminTh>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-50/60">
                      <td className="px-5 py-3 font-mono text-xs text-violet-700">
                        {tx.orderId ?? tx.cuelinksTransactionId}
                      </td>
                      <td className="px-5 py-3 text-slate-700">{tx.click.user?.name ?? "Guest"}</td>
                      <td className="px-5 py-3">
                        <span className="flex items-center gap-2 text-slate-800">
                          <span className="shrink-0 rounded-md ring-1 ring-slate-200">
                            <StoreLogo
                              src={tx.store.logoUrl}
                              alt={tx.store.name}
                              size={22}
                              fallbackSlug={tx.store.slug}
                            />
                          </span>
                          {tx.store.name}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right text-slate-700">
                        {formatInrExact(Number(tx.saleAmount))}
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-cashlime-700">
                        {formatInrExact(Number(tx.commissionAmount))}
                      </td>
                      <td className="px-5 py-3">
                        <AdminBadge
                          label={tx.status.charAt(0) + tx.status.slice(1).toLowerCase()}
                          tone={TX_TONES[tx.status] ?? "bg-slate-100 text-slate-600"}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </AdminTableWrap>
            )}
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard title="Earnings by Source">
            {sources.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing credited yet.</p>
            ) : (
              <ul className="space-y-3">
                {sources.map((source) => (
                  <li key={source.label} className="flex items-center gap-3">
                    <span
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${source.tone}`}
                    >
                      <source.icon size={16} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm text-slate-700">
                      {source.label}
                    </span>
                    <span className="shrink-0 text-sm font-bold text-slate-900">
                      {formatInrExact(source.value)}
                    </span>
                    <span className="w-12 shrink-0 text-right text-xs text-slate-400">
                      {sourceTotal > 0 ? `${((source.value / sourceTotal) * 100).toFixed(1)}%` : "—"}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>

          <AdminCard title="System Overview">
            <ul className="space-y-3">
              {systemRows.map((row) => (
                <li key={row.label} className="flex items-center gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.tone}`}
                  >
                    <row.icon size={16} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{row.label}</span>
                  <span className="shrink-0 text-sm font-bold text-slate-900">{row.value}</span>
                </li>
              ))}
            </ul>
          </AdminCard>
        </div>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <AdminCard
          title="Recent Registered Users"
          padded={false}
          action={
            <Link href="/admin/users" className="text-sm font-medium text-violet-700 hover:underline">
              View All
            </Link>
          }
        >
          <div className="mt-4">
            <AdminTableWrap minWidth={620}>
              <thead>
                <tr className="border-b border-slate-100">
                  <AdminTh>User</AdminTh>
                  <AdminTh>Email</AdminTh>
                  <AdminTh>Joined On</AdminTh>
                  <AdminTh>Status</AdminTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60">
                    <td className="px-5 py-3">
                      <Link
                        href={`/admin/users/${user.id}`}
                        className="flex items-center gap-2.5 font-medium text-slate-900 hover:text-violet-700"
                      >
                        <Avatar name={user.name} seed={user.id} size={30} />
                        {user.name}
                      </Link>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{user.email}</td>
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      {dateTime(user.createdAt)}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={user.riskStatus === "NORMAL" ? "Active" : user.riskStatus}
                        tone={
                          user.riskStatus === "NORMAL"
                            ? "bg-cashlime-50 text-cashlime-700"
                            : "bg-amber-50 text-amber-700"
                        }
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </AdminTableWrap>
          </div>
        </AdminCard>

        <div className="space-y-6">
          <AdminCard
            title="Recent Payouts"
            padded={false}
            action={
              <Link href="/admin/payouts" className="text-sm font-medium text-violet-700 hover:underline">
                View All
              </Link>
            }
          >
            <div className="mt-4">
              {recentPayouts.length === 0 ? (
                <p className="px-5 pb-6 text-sm text-slate-500">No withdrawal requests yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {recentPayouts.map((payout) => (
                    <li key={payout.id} className="flex items-center gap-3 px-5 py-3">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">
                          {payout.user.name}
                        </span>
                        <span className="block text-xs text-slate-400">
                          {dateTime(payout.requestedAt)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatInrExact(Number(payout.amount))}
                      </span>
                      <AdminBadge
                        label={payout.status.charAt(0) + payout.status.slice(1).toLowerCase()}
                        tone={PAYOUT_TONES[payout.status] ?? "bg-slate-100 text-slate-600"}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AdminCard>

          <AdminCard title="Quick Actions">
            <div className="grid grid-cols-2 gap-3">
              {quickActions.map((action) => (
                <Link
                  key={action.label}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-xl border border-slate-200 p-4 text-center transition-colors hover:border-violet-300 hover:bg-violet-50/40"
                >
                  <span
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${action.tone}`}
                  >
                    <action.icon size={18} strokeWidth={1.75} />
                  </span>
                  <span className="text-xs font-semibold text-slate-700">{action.label}</span>
                </Link>
              ))}
            </div>
          </AdminCard>
        </div>
      </div>
    </div>
  );
}
