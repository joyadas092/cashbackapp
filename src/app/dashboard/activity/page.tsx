import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { ActivityFeed } from "@/components/activity/ActivityFeed";
import { EarningsLineChart, type EarningsPoint } from "@/components/activity/EarningsLineChart";
import { EarningsSourceDonut } from "@/components/activity/EarningsSourceDonut";
import { formatInr } from "@/lib/utils";

const DAYS = 90;

/**
 * Prisma's groupBy can't truncate a DateTime to a day, so the earnings-over-time
 * series is bucketed in JS from a bounded window instead of raw SQL. 90 days of
 * one user's ledger rows is a small read (indexed via walletId+createdAt).
 */
function bucketByDay(rows: Array<{ createdAt: Date; amount: unknown }>): EarningsPoint[] {
  const byDay = new Map<string, number>();
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - (DAYS - 1));

  for (let i = 0; i < DAYS; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    byDay.set(d.toISOString().slice(0, 10), 0);
  }

  for (const row of rows) {
    const key = row.createdAt.toISOString().slice(0, 10);
    if (byDay.has(key)) {
      byDay.set(key, (byDay.get(key) ?? 0) + Number(row.amount));
    }
  }

  return Array.from(byDay.entries()).map(([date, amount]) => ({
    date,
    label: new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(
      new Date(date)
    ),
    amount: Math.round(amount * 100) / 100,
  }));
}

export default async function ActivityPage() {
  const session = await auth();
  // Layout also guards /dashboard/**, but every page under it double-guards
  // too — see dashboard/page.tsx's comment on the parallel layout/page fetch race.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/activity");
  }
  const userId = session.user.id;

  const since = new Date();
  since.setDate(since.getDate() - DAYS);

  const [ledgerRows, bySource, clickCount, txnCount] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId, status: "COMPLETED", createdAt: { gte: since } },
      select: { createdAt: true, amount: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.walletTransaction.groupBy({
      by: ["type"],
      where: { userId, status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.click.count({ where: { userId } }),
    prisma.transaction.count({ where: { click: { userId } } }),
  ]);

  const sumFor = (types: string[]) =>
    bySource
      .filter((r) => types.includes(r.type))
      .reduce((sum, r) => sum + Number(r._sum.amount ?? 0), 0);

  const sources = [
    { name: "Shopping Cashback", value: sumFor(["CASHBACK_CONFIRMED"]) },
    { name: "Share & Earn", value: sumFor(["PROFIT_LINK_EARNING"]) },
    { name: "Referral", value: sumFor(["REFERRAL_EARNING"]) },
  ].filter((s) => s.value > 0);

  const totalEarnings = sources.reduce((sum, s) => sum + s.value, 0);
  const series = bucketByDay(ledgerRows);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">My Activity</h1>
      <p className="mt-1 text-slate-500">Track your clicks, transactions and earnings in detail.</p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Clicks</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{clickCount}</div>
        </Card>
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Transactions</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{txnCount}</div>
        </Card>
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Earnings</div>
          <div className="mt-1 text-2xl font-bold text-cashlime-700">
            {formatInr(totalEarnings)}
          </div>
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card variant="light" className="p-6 lg:col-span-2">
          <h2 className="text-base font-bold text-slate-900">Earnings Overview</h2>
          <p className="text-xs text-slate-400">Confirmed earnings, last {DAYS} days</p>
          <div className="mt-4">
            <EarningsLineChart data={series} />
          </div>
        </Card>

        <Card variant="light" className="p-6">
          <h2 className="text-base font-bold text-slate-900">Earnings by Source</h2>
          <p className="text-xs text-slate-400">All confirmed earnings</p>
          <div className="mt-4">
            <EarningsSourceDonut data={sources} />
          </div>
        </Card>
      </div>

      <div className="mt-6">
        <ActivityFeed />
      </div>
    </div>
  );
}
