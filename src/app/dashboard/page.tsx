import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { WalletSummary } from "@/components/wallet/WalletSummary";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

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
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-bold">
        {greeting()}, {session.user.name?.split(" ")[0] ?? "there"}
      </h1>

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
            Shop & Earn
          </Button>
        </Link>
        <Button variant="outline" className="w-full" disabled title="Coming in a later phase">
          Share & Earn
        </Button>
        <Button variant="outline" className="w-full" disabled title="Coming in a later phase">
          Refer & Earn
        </Button>
        <Button variant="outline" className="w-full" disabled title="Coming in a later phase">
          Withdraw
        </Button>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-bold">Recent Clicks</h2>
        {recentClicks.length === 0 ? (
          <p className="mt-3 text-sm text-white/50">
            No activity yet. Head to Stores and start earning.
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-white/10">
            {recentClicks.map((click) => (
              <li key={click.id} className="flex items-center justify-between py-3 text-sm">
                <span>{click.store.name}</span>
                <span className="text-white/50">
                  {click.clickType === "DIRECT_CASHBACK" ? "Direct Cashback" : "Visit Store"}
                </span>
                <span className="text-white/40">
                  {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(
                    click.createdAt
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
