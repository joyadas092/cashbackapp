import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowUpRight,
  Gift,
  MousePointerClick,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import type { ClickType, WalletTxType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { EarningsLineChart, type EarningsPoint } from "@/components/activity/EarningsLineChart";
import { EarningsSourceDonut } from "@/components/activity/EarningsSourceDonut";
import {
  ActivityTabs,
  isActivityTab,
  type ActivityTabKey,
} from "@/components/activity/ActivityTabs";
import {
  ActivityTable,
  STATUS_TONES,
  type ActivityColumn,
  type ActivityRow,
} from "@/components/activity/ActivityTable";
import { StoreLogo } from "@/components/store/StoreLogo";
import { formatInrExact } from "@/lib/utils";
import { siteUrl } from "@/lib/siteUrl";
import { LocalTime } from "@/components/shared/LocalTime";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import { dateRangeToParams, dateRangeWhere, parseDateRange } from "@/lib/dateRangeFilter";

const CHART_DAYS = 30;
const PAGE_SIZE = 20;

function startOfMonth(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

function monthDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Prisma's groupBy can't truncate a DateTime to a day, so the series is bucketed
 * in JS from a bounded window. One user's ledger rows over 30 days is a small,
 * indexed read (walletId + createdAt).
 */
function bucketByDay(rows: Array<{ createdAt: Date; amount: unknown }>): EarningsPoint[] {
  const byDay = new Map<string, number>();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (CHART_DAYS - 1));

  for (let i = 0; i < CHART_DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) byDay.set(key, (byDay.get(key) ?? 0) + Number(row.amount));
  }

  return Array.from(byDay.entries()).map(([date, amount]) => ({
    date,
    label: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
      new Date(date)
    ),
    amount: Math.round(amount * 100) / 100,
  }));
}

export default async function ActivityPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const session = await auth();
  // Layout guards too, but Next fetches layout and page data in parallel.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/activity");
  }
  const userId = session.user.id;

  // Next hands repeated keys through as arrays; every filter here is single-valued.
  const one = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const tabParam = one("tab");
  const tab: ActivityTabKey = isActivityTab(tabParam) ? tabParam : "overview";
  const page = Math.max(1, parseInt(one("page") ?? "1", 10) || 1);
  const skip = (page - 1) * PAGE_SIZE;

  // One date range applies to whichever tab is open. Held in the URL so a
  // filtered view stays shareable and paging keeps the filter.
  const rangeParams = new URLSearchParams();
  for (const key of ["range", "from", "to"]) {
    const value = one(key);
    if (value) rangeParams.set(key, value);
  }
  const range = parseDateRange(rangeParams);
  const createdAtFilter = dateRangeWhere(range);
  const inRange = createdAtFilter ? { createdAt: createdAtFilter } : {};

  const rangeSuffix = dateRangeToParams(range).toString();
  const hrefForPage = (p: number) =>
    `/dashboard/activity?tab=${tab}&page=${p}${rangeSuffix ? `&${rangeSuffix}` : ""}`;

  const thisMonth = startOfMonth(0);
  const lastMonth = startOfMonth(-1);

  // --- Who this user referred. Needed by both a KPI and one of the tabs. -----
  const referrals = await prisma.referral.findMany({
    where: { referrerId: userId },
    select: { referredUserId: true },
  });
  const referredIds = referrals.map((r) => r.referredUserId);

  // --- KPI strip, shown above every tab ------------------------------------
  const [
    totalClicks,
    clicksThisMonth,
    clicksLastMonth,
    totalTransactions,
    txThisMonth,
    txLastMonth,
    earnedAllTime,
    earnedThisMonth,
    earnedLastMonth,
    referralAllTime,
    referralThisMonth,
    referralLastMonth,
  ] = await Promise.all([
    prisma.click.count({ where: { userId } }),
    prisma.click.count({ where: { userId, createdAt: { gte: thisMonth } } }),
    prisma.click.count({ where: { userId, createdAt: { gte: lastMonth, lt: thisMonth } } }),
    prisma.transaction.count({ where: { click: { userId } } }),
    prisma.transaction.count({ where: { click: { userId }, createdAt: { gte: thisMonth } } }),
    prisma.transaction.count({
      where: { click: { userId }, createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, status: "COMPLETED", type: { notIn: ["WITHDRAWAL", "WITHDRAWAL_REVERSED"] } },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        type: { notIn: ["WITHDRAWAL", "WITHDRAWAL_REVERSED"] },
        createdAt: { gte: thisMonth },
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        type: { notIn: ["WITHDRAWAL", "WITHDRAWAL_REVERSED"] },
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "REFERRAL_EARNING", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        type: "REFERRAL_EARNING",
        status: "COMPLETED",
        createdAt: { gte: thisMonth },
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        type: "REFERRAL_EARNING",
        status: "COMPLETED",
        createdAt: { gte: lastMonth, lt: thisMonth },
      },
      _sum: { amount: true },
    }),
  ]);

  const stats = [
    {
      label: "Total Clicks",
      value: String(totalClicks),
      icon: MousePointerClick,
      tone: "bg-violet-50 text-violet-600",
      period: "All time",
      delta: monthDelta(clicksThisMonth, clicksLastMonth),
    },
    {
      label: "Total Transactions",
      value: String(totalTransactions),
      icon: Receipt,
      tone: "bg-cashlime-50 text-cashlime-700",
      period: "All time",
      delta: monthDelta(txThisMonth, txLastMonth),
    },
    {
      label: "Total Earnings",
      value: formatInrExact(Number(earnedAllTime._sum.amount ?? 0)),
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
      period: "All time",
      delta: monthDelta(
        Number(earnedThisMonth._sum.amount ?? 0),
        Number(earnedLastMonth._sum.amount ?? 0)
      ),
    },
    {
      label: "Referred Users",
      value: String(referredIds.length),
      icon: Users,
      tone: "bg-sky-50 text-sky-600",
      period: "Total",
      delta: null,
    },
    {
      label: "Referral Earnings",
      value: formatInrExact(Number(referralAllTime._sum.amount ?? 0)),
      icon: Gift,
      tone: "bg-rose-50 text-rose-600",
      period: "All time",
      delta: monthDelta(
        Number(referralThisMonth._sum.amount ?? 0),
        Number(referralLastMonth._sum.amount ?? 0)
      ),
    },
  ];

  // --- Per-tab content ------------------------------------------------------
  let tabTitle = "Overview";
  /** Extra headline stat for tabs that have one, shown beside the entry count. */
  let tabNote = "";
  let columns: ActivityColumn[] = [];
  let rows: ActivityRow[] = [];
  let total = 0;
  let empty = { title: "Nothing here yet", body: "" };

  if (tab === "own-clicks") {
    tabTitle = "Own Click History";
    empty = {
      title: "No store visits yet",
      body: "Every time you start a shopping trip from a store page, it's logged here.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "store", label: "Store" },
      { key: "type", label: "Type" },
      { key: "status", label: "Status" },
    ];

    const where = {
      userId,
      clickType: { in: ["DIRECT_CASHBACK", "VISIT_STORE"] as ClickType[] },
      ...inRange,
    };
    const [clicks, count] = await Promise.all([
      prisma.click.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: { store: { select: { name: true, slug: true, logoUrl: true } } },
      }),
      prisma.click.count({ where }),
    ]);
    total = count;
    rows = clicks.map((click) => ({
      id: click.id,
      cells: {
        date: { iso: click.createdAt.toISOString(), tone: "muted", nowrap: true },
        store: { store: click.store },
        type: {
          text: click.clickType === "DIRECT_CASHBACK" ? "Cashback trip" : "Store visit",
          tone: "muted",
        },
        status: {
          badge: { label: click.status, tone: STATUS_TONES[click.status] ?? "bg-slate-100" },
        },
      },
    }));
  } else if (tab === "own-transactions") {
    tabTitle = "Transaction History";
    empty = {
      title: "No cashback transactions yet",
      body: "Orders you place after starting a trip from here will appear once tracked.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "store", label: "Store" },
      { key: "order", label: "Order ID" },
      { key: "amount", label: "Order Amount", align: "right" },
      { key: "earnings", label: "Your Cashback", align: "right" },
      { key: "status", label: "Status" },
    ];

    // Own shopping only — profit-link clicks are a different tab.
    const where = { click: { userId, clickType: { not: "PROFIT_LINK" as const } }, ...inRange };
    const [txs, count] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: { store: { select: { name: true, slug: true, logoUrl: true } } },
      }),
      prisma.transaction.count({ where }),
    ]);
    total = count;
    rows = txs.map((tx) => ({
      id: tx.id,
      cells: {
        date: { iso: tx.createdAt.toISOString(), tone: "muted", nowrap: true },
        store: { store: tx.store },
        order: { text: tx.orderId ?? tx.cuelinksTransactionId, tone: "mono" },
        amount: { text: formatInrExact(Number(tx.saleAmount)), nowrap: true },
        earnings: { text: formatInrExact(Number(tx.customerAmount)), tone: "money", nowrap: true },
        status: { badge: { label: tx.status, tone: STATUS_TONES[tx.status] ?? "bg-slate-100" } },
      },
    }));
  } else if (tab === "affiliate-clicks") {
    tabTitle = "Affiliate Click History";
    empty = {
      title: "No clicks on your profit links yet",
      body: "When someone opens a link you shared, it shows up here.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "store", label: "Store" },
      { key: "link", label: "Your Link" },
      { key: "clicks", label: "Clicks on this link", align: "right" },
      { key: "status", label: "Status" },
    ];

    // Clicks on links this user created — the clicker is someone else, so this
    // filters on the profit link's owner, never on Click.userId.
    const where = { profitLink: { userId }, ...inRange };
    const [clicks, count] = await Promise.all([
      prisma.click.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          store: { select: { name: true, slug: true, logoUrl: true } },
          profitLink: { select: { code: true } },
        },
      }),
      prisma.click.count({ where }),
    ]);
    total = count;

    // All-time total across every link this user owns, so the headline number
    // doesn't move when a date range is applied to the table below it.
    const allTimeClicks = await prisma.click.count({ where: { profitLink: { userId } } });
    tabNote = `${allTimeClicks} total ${allTimeClicks === 1 ? "click" : "clicks"} on your links`;

    // Clicks per link, so each row shows how the link it belongs to is doing
    // overall — not just that one click. Counted from Click rather than
    // ProfitLink.clickCount, which is a cached column.
    const linkIds = [...new Set(clicks.map((c) => c.profitLinkId).filter(Boolean))] as string[];
    const perLink =
      linkIds.length > 0
        ? await prisma.click.groupBy({
            by: ["profitLinkId"],
            where: { profitLinkId: { in: linkIds } },
            _count: { _all: true },
          })
        : [];
    const clicksByLink = new Map(perLink.map((row) => [row.profitLinkId, row._count._all]));

    const base = siteUrl();
    rows = clicks.map((click) => ({
      id: click.id,
      cells: {
        date: { iso: click.createdAt.toISOString(), tone: "muted", nowrap: true },
        store: { store: click.store },
        link: click.profitLink
          ? { link: { href: `${base}/p/${click.profitLink.code}` } }
          : { text: "—" },
        clicks: { text: String(clicksByLink.get(click.profitLinkId) ?? 0), nowrap: true },
        status: {
          badge: { label: click.status, tone: STATUS_TONES[click.status] ?? "bg-slate-100" },
        },
      },
    }));
  } else if (tab === "affiliate-transactions") {
    tabTitle = "Affiliate Transaction History";
    empty = {
      title: "No purchases through your links yet",
      body: "Keep sharing — earnings from other people's purchases land here.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "store", label: "Store" },
      { key: "code", label: "Link Code" },
      { key: "amount", label: "Order Amount", align: "right" },
      { key: "earnings", label: "Your Earnings", align: "right" },
      { key: "status", label: "Status" },
    ];

    const where = { click: { profitLink: { userId } }, ...inRange };
    const [txs, count] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
        include: {
          store: { select: { name: true, slug: true, logoUrl: true } },
          click: { select: { profitLink: { select: { code: true } } } },
        },
      }),
      prisma.transaction.count({ where }),
    ]);
    total = count;
    rows = txs.map((tx) => ({
      id: tx.id,
      cells: {
        date: { iso: tx.createdAt.toISOString(), tone: "muted", nowrap: true },
        store: { store: tx.store },
        code: { text: tx.click.profitLink?.code ?? "—", tone: "mono" },
        amount: { text: formatInrExact(Number(tx.saleAmount)), nowrap: true },
        // The profit-link share, not the buyer's cashback.
        earnings: {
          text: formatInrExact(Number(tx.profitLinkAmount)),
          tone: "money",
          nowrap: true,
        },
        status: { badge: { label: tx.status, tone: STATUS_TONES[tx.status] ?? "bg-slate-100" } },
      },
    }));
  } else if (tab === "referred-transactions") {
    tabTitle = "Referred User Transactions";
    empty = {
      title: "No orders from referred friends yet",
      body: "Orders placed by people you referred appear here, along with your cut.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "store", label: "Store" },
      { key: "amount", label: "Order Amount", align: "right" },
      { key: "earnings", label: "Your Referral Cut", align: "right" },
      { key: "status", label: "Status" },
    ];

    if (referredIds.length > 0) {
      const where = { click: { userId: { in: referredIds } }, ...inRange };
      const [txs, count] = await Promise.all([
        prisma.transaction.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: PAGE_SIZE,
          include: { store: { select: { name: true, slug: true, logoUrl: true } } },
        }),
        prisma.transaction.count({ where }),
      ]);
      total = count;
      rows = txs.map((tx) => ({
        id: tx.id,
        cells: {
          date: { iso: tx.createdAt.toISOString(), tone: "muted", nowrap: true },
          store: { store: tx.store },
          amount: { text: formatInrExact(Number(tx.saleAmount)), nowrap: true },
          earnings: {
            text: formatInrExact(Number(tx.referralAmount)),
            tone: "money",
            nowrap: true,
          },
          status: { badge: { label: tx.status, tone: STATUS_TONES[tx.status] ?? "bg-slate-100" } },
        },
      }));
    }
  } else if (tab === "referral-earnings") {
    tabTitle = "Referral Transaction History";
    empty = {
      title: "No referral earnings yet",
      body: "Your share of what referred friends generate is credited here.",
    };
    columns = [
      { key: "date", label: "Date & Time" },
      { key: "description", label: "Description" },
      { key: "amount", label: "Amount", align: "right" },
      { key: "status", label: "Status" },
    ];

    const where = {
      userId,
      type: { in: ["REFERRAL_EARNING", "REFERRAL_EARNING_REVERSED"] as WalletTxType[] },
      ...inRange,
    };
    const [entries, count] = await Promise.all([
      prisma.walletTransaction.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip,
        take: PAGE_SIZE,
      }),
      prisma.walletTransaction.count({ where }),
    ]);
    total = count;
    rows = entries.map((entry) => {
      const isReversal = entry.type === "REFERRAL_EARNING_REVERSED";
      return {
        id: entry.id,
        cells: {
          date: { iso: entry.createdAt.toISOString(), tone: "muted", nowrap: true },
          description: { text: entry.description ?? "Referral earning" },
          amount: {
            text: `${isReversal ? "−" : "+"} ${formatInrExact(Number(entry.amount))}`,
            tone: isReversal ? "debit" : "money",
            nowrap: true,
          },
          status: {
            badge: { label: entry.status, tone: STATUS_TONES[entry.status] ?? "bg-slate-100" },
          },
        },
      };
    });
  }

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // --- Overview-only data ---------------------------------------------------
  let overview: {
    recent: Array<{
      id: string;
      date: string;
      store: { name: string; slug: string; logoUrl: string };
      orderId: string;
      amount: number;
      earnings: number;
      status: string;
    }>;
    topStores: Array<{ name: string; slug: string; logoUrl: string; earnings: number; clicks: number }>;
    series: EarningsPoint[];
    sources: Array<{ name: string; value: number }>;
    summary: Array<{ label: string; value: string }>;
  } | null = null;

  if (tab === "overview") {
    const since = new Date();
    since.setDate(since.getDate() - CHART_DAYS);

    const [recentTxs, ledgerRows, bySource, storeEarnings, storeClicks, saleAgg] =
      await Promise.all([
        prisma.transaction.findMany({
          where: { click: { userId } },
          orderBy: { createdAt: "desc" },
          take: 5,
          include: { store: { select: { name: true, slug: true, logoUrl: true } } },
        }),
        prisma.walletTransaction.findMany({
          where: {
            userId,
            status: "COMPLETED",
            type: { notIn: ["WITHDRAWAL", "WITHDRAWAL_REVERSED"] },
            createdAt: { gte: since },
          },
          select: { createdAt: true, amount: true },
          orderBy: { createdAt: "asc" },
        }),
        prisma.walletTransaction.groupBy({
          by: ["type"],
          where: { userId, status: "COMPLETED" },
          _sum: { amount: true },
        }),
        prisma.transaction.groupBy({
          by: ["storeId"],
          where: { click: { userId } },
          _sum: { customerAmount: true },
        }),
        prisma.click.groupBy({ by: ["storeId"], where: { userId }, _count: { _all: true } }),
        prisma.transaction.aggregate({
          where: { click: { userId } },
          _sum: { saleAmount: true },
        }),
      ]);

    const clicksByStore = new Map(storeClicks.map((c) => [c.storeId, c._count._all]));
    const topStoreIds = storeEarnings
      .sort((a, b) => Number(b._sum.customerAmount ?? 0) - Number(a._sum.customerAmount ?? 0))
      .slice(0, 5)
      .map((s) => s.storeId);

    const storeRecords =
      topStoreIds.length > 0
        ? await prisma.store.findMany({
            where: { id: { in: topStoreIds } },
            select: { id: true, name: true, slug: true, logoUrl: true },
          })
        : [];
    const storeById = new Map(storeRecords.map((s) => [s.id, s]));

    const sumFor = (types: string[]) =>
      bySource
        .filter((r) => types.includes(r.type))
        .reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);

    // The three ways this app pays out, kept distinct.
    const sources = [
      { name: "Shopping Cashback", value: sumFor(["CASHBACK_CONFIRMED"]) },
      { name: "Share & Earn", value: sumFor(["PROFIT_LINK_EARNING"]) },
      { name: "Referral", value: sumFor(["REFERRAL_EARNING"]) },
      { name: "Bonuses & Others", value: sumFor(["ADJUSTMENT"]) },
    ].filter((s) => s.value > 0);

    const totalSales = Number(saleAgg._sum.saleAmount ?? 0);
    const conversion = totalClicks > 0 ? (totalTransactions / totalClicks) * 100 : 0;
    const avgOrder = totalTransactions > 0 ? totalSales / totalTransactions : 0;

    overview = {
      recent: recentTxs.map((tx) => ({
        id: tx.id,
        date: tx.createdAt.toISOString(),
        store: tx.store,
        orderId: tx.orderId ?? tx.cuelinksTransactionId,
        amount: Number(tx.saleAmount),
        earnings: Number(tx.customerAmount),
        status: tx.status,
      })),
      topStores: topStoreIds
        .map((id) => {
          const store = storeById.get(id);
          if (!store) return null;
          const earnings = storeEarnings.find((s) => s.storeId === id);
          return {
            name: store.name,
            slug: store.slug,
            logoUrl: store.logoUrl,
            earnings: Number(earnings?._sum.customerAmount ?? 0),
            clicks: clicksByStore.get(id) ?? 0,
          };
        })
        .filter((s): s is NonNullable<typeof s> => s !== null),
      series: bucketByDay(ledgerRows),
      sources,
      summary: [
        { label: "Total Clicks", value: String(totalClicks) },
        { label: "Total Transactions", value: String(totalTransactions) },
        { label: "Conversion Rate", value: `${conversion.toFixed(2)}%` },
        { label: "Avg. Order Value", value: formatInrExact(avgOrder) },
        {
          label: "Total Earnings",
          value: formatInrExact(Number(earnedAllTime._sum.amount ?? 0)),
        },
      ],
    };
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Activity</h1>
        <p className="mt-1 text-slate-500">
          Track your clicks, transactions and earnings in detail — from your own shopping, the
          links you share, and the friends you refer.
        </p>
      </header>

      {/* KPI strip */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl2 border border-slate-200 bg-white p-4 shadow-card"
          >
            <div className="flex items-start gap-3">
              <span
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
              >
                <stat.icon size={20} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-sm text-slate-500">{stat.label}</div>
                <div className="mt-0.5 truncate text-xl font-extrabold text-slate-900">
                  {stat.value}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs">
              <span className="text-slate-400">{stat.period}</span>
              {stat.delta !== null && (
                <span
                  className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 font-semibold ${
                    stat.delta >= 0
                      ? "bg-cashlime-50 text-cashlime-700"
                      : "bg-rose-50 text-rose-600"
                  }`}
                >
                  <ArrowUpRight
                    size={11}
                    strokeWidth={2.5}
                    className={stat.delta >= 0 ? "" : "rotate-90"}
                  />
                  {stat.delta >= 0 ? "+" : ""}
                  {stat.delta}%
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        <ActivityTabs active={tab} />

        {tab === "overview" && overview ? (
          <div className="space-y-6 p-5">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
              {/* Recent transactions */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-slate-900">Recent Transactions</h2>
                  <Link
                    href="/dashboard/activity?tab=own-transactions"
                    className="text-sm font-medium text-violet-700 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                {overview.recent.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    No transactions yet. Start a shopping trip from any store page.
                  </p>
                ) : (
                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[640px] text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-400">
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-2.5 font-medium">Date &amp; Time</th>
                          <th className="px-4 py-2.5 font-medium">Store</th>
                          <th className="px-4 py-2.5 font-medium">Order ID</th>
                          <th className="px-4 py-2.5 text-right font-medium">Amount</th>
                          <th className="px-4 py-2.5 text-right font-medium">Earnings</th>
                          <th className="px-4 py-2.5 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overview.recent.map((tx) => (
                          <tr key={tx.id}>
                            <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">
                              <LocalTime value={tx.date} />
                            </td>
                            <td className="px-4 py-2.5">
                              <Link
                                href={`/stores/${tx.store.slug}`}
                                className="flex items-center gap-2 font-medium text-slate-800 hover:text-violet-700"
                              >
                                <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                                  <StoreLogo
                                    src={tx.store.logoUrl}
                                    alt={tx.store.name}
                                    size={24}
                                    fallbackSlug={tx.store.slug}
                                  />
                                </span>
                                {tx.store.name}
                              </Link>
                            </td>
                            <td className="px-4 py-2.5 font-mono text-xs text-slate-600">
                              {tx.orderId}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right text-slate-700">
                              {formatInrExact(tx.amount)}
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-cashlime-700">
                              {formatInrExact(tx.earnings)}
                            </td>
                            <td className="px-4 py-2.5">
                              <span
                                className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  STATUS_TONES[tx.status] ?? "bg-slate-100 text-slate-600"
                                }`}
                              >
                                {tx.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              {/* Top earning stores */}
              <section>
                <div className="mb-3 flex items-center justify-between gap-4">
                  <h2 className="text-base font-bold text-slate-900">Top Earning Stores</h2>
                  <Link href="/stores" className="text-sm font-medium text-violet-700 hover:underline">
                    View All
                  </Link>
                </div>

                {overview.topStores.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                    Nothing to rank yet.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left text-sm">
                      <thead className="text-xs uppercase tracking-wide text-slate-400">
                        <tr className="border-b border-slate-100">
                          <th className="px-4 py-2.5 font-medium">Store</th>
                          <th className="px-4 py-2.5 text-right font-medium">Earnings</th>
                          <th className="px-4 py-2.5 text-right font-medium">Clicks</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {overview.topStores.map((store) => (
                          <tr key={store.slug}>
                            <td className="px-4 py-2.5">
                              <Link
                                href={`/stores/${store.slug}`}
                                className="flex items-center gap-2 font-medium text-slate-800 hover:text-violet-700"
                              >
                                <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                                  <StoreLogo
                                    src={store.logoUrl}
                                    alt={store.name}
                                    size={24}
                                    fallbackSlug={store.slug}
                                  />
                                </span>
                                {store.name}
                              </Link>
                            </td>
                            <td className="whitespace-nowrap px-4 py-2.5 text-right font-semibold text-cashlime-700">
                              {formatInrExact(store.earnings)}
                            </td>
                            <td className="px-4 py-2.5 text-right text-slate-600">
                              {store.clicks}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </div>

            {/* Charts + summary */}
            <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)]">
              <section className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Earnings Overview</h2>
                <p className="text-xs text-slate-400">Confirmed earnings, last {CHART_DAYS} days</p>
                <div className="mt-4">
                  <EarningsLineChart data={overview.series} />
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Earnings by Source</h2>
                <p className="text-xs text-slate-400">All confirmed earnings</p>
                <div className="mt-4">
                  {overview.sources.length === 0 ? (
                    <p className="py-8 text-center text-sm text-slate-500">
                      No confirmed earnings yet.
                    </p>
                  ) : (
                    <EarningsSourceDonut data={overview.sources} />
                  )}
                </div>
              </section>

              <section className="rounded-xl border border-slate-200 p-4">
                <h2 className="text-base font-bold text-slate-900">Activity Summary</h2>
                <dl className="mt-4 divide-y divide-slate-100">
                  {overview.summary.map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-4 py-2.5">
                      <dt className="flex items-center gap-2 text-sm text-slate-600">
                        <TrendingUp size={14} strokeWidth={2} className="text-slate-400" />
                        {item.label}
                      </dt>
                      <dd className="text-sm font-bold text-slate-900">{item.value}</dd>
                    </div>
                  ))}
                </dl>
              </section>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between gap-4 px-5 pt-4">
              <h2 className="text-base font-bold text-slate-900">{tabTitle}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-400">
                {tabNote && <span>{tabNote}</span>}
                {total > 0 && (
                  <span>
                    {total} {total === 1 ? "entry" : "entries"}
                  </span>
                )}
              </div>
            </div>

            {/* GET form so the chosen range stays in the URL and survives paging. */}
            <form
              method="get"
              action="/dashboard/activity"
              className="mt-3 border-y border-slate-100 bg-slate-50/60 px-5 py-3"
            >
              <input type="hidden" name="tab" value={tab} />
              <div className="flex flex-wrap items-center gap-2">
                <DateRangeFilter range={range} basePath="/dashboard/activity" hiddenFields={{ tab }} />
                <button
                  type="submit"
                  className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
                >
                  Apply
                </button>
              </div>
            </form>

            <div>
              <ActivityTable
                columns={columns}
                rows={rows}
                empty={empty}
                page={page}
                totalPages={totalPages}
                total={total}
                hrefForPage={hrefForPage}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
