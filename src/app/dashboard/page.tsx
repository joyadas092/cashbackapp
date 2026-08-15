import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { WalletSummary } from "@/components/wallet/WalletSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { StoreLogo } from "@/components/store/StoreLogo";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const session = await auth();
  // DashboardLayout also redirects unauthenticated requests, but Next.js
  // fetches layout and page data in parallel, so this page's own auth()
  // call can resolve before the layout's redirect takes effect — guard here too.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }
  const userId = session.user.id;

  const [wallet, recentClicks] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.click.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { store: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">
        {greeting()}, {session.user.name?.split(" ")[0] ?? "there"}
      </h1>
      <p className="mt-1 text-sm text-slate-500">
        Here&apos;s an overview of your earnings and recent activity.
      </p>

      <div className="mt-6">
        <WalletSummary
          wallet={{
            availableBalance: Number(wallet?.availableBalance ?? 0),
            pendingCashback: Number(wallet?.pendingCashback ?? 0),
            lifetimeEarned: Number(wallet?.lifetimeEarned ?? 0),
            withdrawn: Number(wallet?.withdrawn ?? 0),
          }}
        />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Link href="/stores">
          <Button variant="primary" className="w-full">
            Shop &amp; Earn
          </Button>
        </Link>
        <Link href="/dashboard/share-earn">
          <Button variant="outlineLight" className="w-full">
            Share &amp; Earn
          </Button>
        </Link>
        <Link href="/dashboard/refer">
          <Button variant="outlineLight" className="w-full">
            Refer &amp; Earn
          </Button>
        </Link>
        <Button variant="outlineLight" className="w-full" disabled title="Coming in a later phase">
          Withdraw
        </Button>
      </div>

      <Card variant="light" className="mt-8 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-900">Recent Clicks</h2>
          <Link
            href="/dashboard/activity"
            className="text-sm font-medium text-violet-700 hover:underline"
          >
            View All &rarr;
          </Link>
        </div>
        {recentClicks.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            No activity yet. Head to Stores and start earning.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-slate-100">
            {recentClicks.map((click) => (
              <li key={click.id} className="flex items-center gap-3 py-3 text-sm">
                <div className="rounded-xl ring-1 ring-slate-200">
                  <StoreLogo src={click.store.logoUrl} alt={click.store.name} size={36} />
                </div>
                <span className="flex-1 font-medium text-slate-900">{click.store.name}</span>
                <span className="text-slate-500">
                  {click.clickType === "DIRECT_CASHBACK"
                    ? "Direct Cashback"
                    : click.clickType === "PROFIT_LINK"
                      ? "Profit Link"
                      : "Visit Store"}
                </span>
                <span className="hidden text-slate-400 sm:inline">
                  {new Intl.DateTimeFormat("en-IN", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(click.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
