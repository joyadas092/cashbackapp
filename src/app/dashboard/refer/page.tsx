import Link from "next/link";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import {
  ArrowUpRight,
  Gift,
  Info,
  Link2,
  Percent,
  ShoppingCart,
  Timer,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReferralLinkCard } from "@/components/referral/ReferralLinkCard";
import {
  ReferredUsersTable,
  type ReferredUser,
  type ReferredUserStatus,
} from "@/components/referral/ReferredUsersTable";
import { formatInrExact } from "@/lib/utils";

/** How many referred users the table loads. Everything above this is counted, not listed. */
const TABLE_LIMIT = 100;

function startOfMonth(offset: number): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() + offset, 1);
}

/** Percentage change, or null when there's no prior figure to compare against. */
function monthDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

export default async function ReferPage() {
  const session = await auth();
  // The layout guards too, but Next fetches layout and page data in parallel —
  // so this page has to guard itself. Same rationale as dashboard/page.tsx.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/refer");
  }

  const userId = session.user.id;
  const thisMonth = startOfMonth(0);
  const lastMonth = startOfMonth(-1);

  const [
    user,
    wallet,
    referrals,
    totalReferrals,
    referralsThisMonth,
    referralsLastMonth,
    confirmedAgg,
    pendingAgg,
    reversedAgg,
    earnedThisMonthAgg,
    earnedLastMonthAgg,
    referralRule,
    topReferralPct,
  ] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { referralCode: true } }),
    prisma.wallet.findUnique({ where: { userId }, select: { availableBalance: true } }),
    prisma.referral.findMany({
      where: { referrerId: userId },
      orderBy: { createdAt: "desc" },
      take: TABLE_LIMIT,
      include: { referredUser: { select: { id: true, name: true, email: true } } },
    }),
    prisma.referral.count({ where: { referrerId: userId } }),
    prisma.referral.count({ where: { referrerId: userId, createdAt: { gte: thisMonth } } }),
    prisma.referral.count({
      where: { referrerId: userId, createdAt: { gte: lastMonth, lt: thisMonth } },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "REFERRAL_EARNING", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "REFERRAL_EARNING", status: "PENDING" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "REFERRAL_EARNING_REVERSED" },
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
    prisma.referralRule.findFirst({ where: { isActive: true } }),
    prisma.cashbackRule.aggregate({ where: { isActive: true }, _max: { referralPct: true } }),
  ]);

  if (!user) redirect("/login");

  const referredIds = referrals.map((r) => r.referredUserId);

  // Per-friend order counts and lifetime cashback, for the table. Scoped to the
  // referrals actually being displayed rather than every referral ever made.
  const [referredWallets, referredTransactions] = await Promise.all([
    referredIds.length > 0
      ? prisma.wallet.findMany({
          where: { userId: { in: referredIds } },
          select: { userId: true, lifetimeEarned: true },
        })
      : Promise.resolve([]),
    referredIds.length > 0
      ? prisma.transaction.findMany({
          where: { click: { userId: { in: referredIds } } },
          select: { id: true, click: { select: { userId: true } } },
        })
      : Promise.resolve([]),
  ]);

  const cashbackByUser = new Map(
    referredWallets.map((w) => [w.userId, Number(w.lifetimeEarned)])
  );
  const ordersByUser = new Map<string, number>();
  for (const tx of referredTransactions) {
    const id = tx.click.userId;
    if (id) ordersByUser.set(id, (ordersByUser.get(id) ?? 0) + 1);
  }

  const rows: ReferredUser[] = referrals.map((referral) => {
    const orders = ordersByUser.get(referral.referredUserId) ?? 0;

    // A live referral whose friend hasn't ordered yet reads as "pending" —
    // see the note on ReferredUserStatus.
    let status: ReferredUserStatus = "inactive";
    if (referral.status === "ACTIVE") status = orders > 0 ? "active" : "pending";

    return {
      id: referral.referredUser.id,
      name: referral.referredUser.name,
      email: referral.referredUser.email,
      joinedAt: referral.createdAt.toISOString(),
      orders,
      cashbackEarned: cashbackByUser.get(referral.referredUserId) ?? 0,
      yourEarnings: Number(referral.totalEarned),
      status,
    };
  });

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/refer/${user.referralCode}`;

  const confirmed = Number(confirmedAgg._sum.amount ?? 0);
  const reversed = Number(reversedAgg._sum.amount ?? 0);
  const pending = Number(pendingAgg._sum.amount ?? 0);
  const totalEarnings = confirmed - reversed;
  const available = Number(wallet?.availableBalance ?? 0);

  const referralDelta = monthDelta(referralsThisMonth, referralsLastMonth);
  const earningsDelta = monthDelta(
    Number(earnedThisMonthAgg._sum.amount ?? 0),
    Number(earnedLastMonthAgg._sum.amount ?? 0)
  );

  const maxReferralPct = Number(topReferralPct._max.referralPct ?? 0);

  const stats = [
    {
      label: "Total Referrals",
      value: String(totalReferrals),
      icon: Users,
      tone: "bg-violet-50 text-violet-600",
      chip: "All time",
      chipTone: "bg-slate-100 text-slate-600",
      delta: referralDelta,
      note: null as string | null,
    },
    {
      label: "Total Earnings",
      value: formatInrExact(totalEarnings),
      icon: Wallet,
      tone: "bg-cashlime-50 text-cashlime-700",
      chip: "All time",
      chipTone: "bg-slate-100 text-slate-600",
      delta: earningsDelta,
      note: null,
    },
    {
      label: "Pending Earnings",
      value: formatInrExact(pending),
      icon: Timer,
      tone: "bg-amber-50 text-amber-600",
      chip: "In Confirmation",
      chipTone: "bg-amber-50 text-amber-700",
      delta: null,
      note: "Confirmed once the store validates the order",
    },
    {
      label: "Available to Withdraw",
      value: formatInrExact(available),
      icon: Gift,
      tone: "bg-sky-50 text-sky-600",
      chip: available > 0 ? "Ready" : "Nothing yet",
      chipTone: available > 0 ? "bg-sky-50 text-sky-700" : "bg-slate-100 text-slate-500",
      delta: null,
      note: "Your full wallet balance, across all earnings",
    },
  ];

  // "How You Earn" is built from the rules that actually govern payouts, rather
  // than a fixed marketing ladder — every row here is a real constraint the
  // referral engine enforces (src/lib/referral/engine.ts).
  const howYouEarn = [
    {
      icon: Percent,
      title: "On their shopping",
      body: "A share of the store commission each time a friend shops",
      value: maxReferralPct > 0 ? `Up to ${maxReferralPct}%` : "Varies by store",
      tone: "bg-violet-50 text-violet-600",
    },
    referralRule?.fixedBonus
      ? {
          icon: Gift,
          title: "Signup bonus",
          body: "Credited once your friend's first order is confirmed",
          value: formatInrExact(Number(referralRule.fixedBonus)),
          tone: "bg-cashlime-50 text-cashlime-700",
        }
      : null,
    referralRule?.durationDays
      ? {
          icon: Timer,
          title: "Earning window",
          body: "How long you keep earning after a friend joins",
          value: `${referralRule.durationDays} days`,
          tone: "bg-amber-50 text-amber-600",
        }
      : null,
    referralRule?.maxTotalEarning
      ? {
          icon: TrendingUp,
          title: "Cap per friend",
          body: "The most a single referral can earn you",
          value: formatInrExact(Number(referralRule.maxTotalEarning)),
          tone: "bg-sky-50 text-sky-600",
        }
      : null,
    referralRule?.minOrderValue
      ? {
          icon: ShoppingCart,
          title: "Minimum order",
          body: "Orders below this don't earn referral commission",
          value: formatInrExact(Number(referralRule.minOrderValue)),
          tone: "bg-rose-50 text-rose-600",
        }
      : null,
  ].filter((row): row is NonNullable<typeof row> => row !== null);

  const howItWorks = [
    {
      icon: UserPlus,
      title: "Invite Your Friends",
      body: "Share your referral link or code",
      tone: "bg-violet-50 text-violet-600",
    },
    {
      icon: Link2,
      title: "They Sign Up",
      body: "Your friend signs up using your link",
      tone: "bg-sky-50 text-sky-600",
    },
    {
      icon: ShoppingCart,
      title: "They Shop & Earn",
      body: "They shop and earn cashback or share links",
      tone: "bg-cashlime-50 text-cashlime-700",
    },
    {
      icon: Wallet,
      title: "You Earn Rewards",
      body: "You earn a commission on their activity",
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  const friendPerk = referralRule?.fixedBonus
    ? {
        headline: `They get ${formatInrExact(Number(referralRule.fixedBonus))} bonus`,
        sub: "Credited after their first confirmed order",
      }
    : {
        headline: "They earn cashback too",
        sub: "On every eligible order they place",
      };

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      {/* --- Header --- */}
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Refer &amp; Earn</h1>
          <p className="mt-1 text-slate-500">
            Invite your friends and earn rewards when they shop and earn cashback!
          </p>
        </div>
        <Link
          href="#how-refer-earn-works"
          className="flex items-center gap-1.5 text-sm font-medium text-violet-700 hover:underline"
        >
          View Referral Terms &amp; Conditions
          <Info size={14} strokeWidth={2} />
        </Link>
      </header>

      {/* --- KPI cards --- */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card"
          >
            <div className="flex items-start gap-3.5">
              <span
                className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${stat.tone}`}
              >
                <stat.icon size={22} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-sm text-slate-500">{stat.label}</div>
                <div className="mt-0.5 truncate text-2xl font-extrabold text-slate-900">
                  {stat.value}
                </div>
                <span
                  className={`mt-2 inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${stat.chipTone}`}
                >
                  {stat.chip}
                </span>
              </div>
            </div>

            {stat.delta !== null && (
              <div className="mt-3 flex items-center gap-1 text-xs">
                <ArrowUpRight
                  size={13}
                  strokeWidth={2.5}
                  className={stat.delta >= 0 ? "text-cashlime-600" : "rotate-90 text-rose-500"}
                />
                <span
                  className={`font-semibold ${stat.delta >= 0 ? "text-cashlime-700" : "text-rose-600"}`}
                >
                  {stat.delta >= 0 ? "+" : ""}
                  {stat.delta}%
                </span>
                <span className="text-slate-400">vs last month</span>
              </div>
            )}
            {stat.note && <p className="mt-3 text-xs text-slate-400">{stat.note}</p>}
          </div>
        ))}
      </div>

      {/* --- Main grid --- */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-6">
          <ReferralLinkCard
            referralCode={user.referralCode}
            shareUrl={shareUrl}
            friendPerk={friendPerk}
          />
          <ReferredUsersTable users={rows} total={totalReferrals} />
        </div>

        <aside className="space-y-6">
          {/* How You Earn */}
          <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-lg font-bold text-slate-900">How You Earn</h2>
            <ul className="mt-4 space-y-3.5">
              {howYouEarn.map((row) => (
                <li key={row.title} className="flex items-start gap-3">
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${row.tone}`}
                  >
                    <row.icon size={17} strokeWidth={2} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-900">{row.title}</div>
                    <div className="text-xs text-slate-500">{row.body}</div>
                  </div>
                  <span className="shrink-0 text-sm font-bold text-cashlime-700">{row.value}</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 flex items-start gap-2 rounded-lg bg-cashlime-50/70 px-3 py-2.5 text-xs text-slate-600">
              <TrendingUp size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-cashlime-600" />
              More activity from your friends = more earnings for you.
            </p>
          </section>

          {/* How it works */}
          <section
            id="how-refer-earn-works"
            className="scroll-mt-24 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card"
          >
            <h2 className="text-lg font-bold text-slate-900">How Refer &amp; Earn Works?</h2>
            <ol className="mt-4 space-y-4">
              {howItWorks.map((step, i) => (
                <li key={step.title} className="flex items-start gap-3">
                  <span className="relative shrink-0">
                    <span
                      className={`flex h-11 w-11 items-center justify-center rounded-full ${step.tone}`}
                    >
                      <step.icon size={19} strokeWidth={1.75} />
                    </span>
                    <span className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-600 text-[9px] font-bold text-white">
                      {i + 1}
                    </span>
                  </span>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                    <p className="text-xs text-slate-500">{step.body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="mt-5 border-t border-slate-100 pt-4 text-xs leading-relaxed text-slate-500">
              <p className="font-semibold text-slate-700">Referral terms</p>
              <ul className="mt-1.5 space-y-1">
                <li>
                  A friend can be referred once — the first referral to reach them is the one that
                  counts.
                </li>
                {referralRule?.durationDays && (
                  <li>
                    You earn from a friend&apos;s activity for {referralRule.durationDays} days from
                    the day they join.
                  </li>
                )}
                {referralRule?.maxTotalEarning && (
                  <li>
                    Earnings are capped at {formatInrExact(Number(referralRule.maxTotalEarning))} per
                    referred friend.
                  </li>
                )}
                {referralRule?.minOrderValue && (
                  <li>
                    Orders below {formatInrExact(Number(referralRule.minOrderValue))} do not earn referral
                    commission.
                  </li>
                )}
                <li>
                  Referral earnings are reversed if the underlying order is cancelled or returned.
                </li>
              </ul>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
