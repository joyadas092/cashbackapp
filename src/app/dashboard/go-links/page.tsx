import Link from "next/link";
import { redirect } from "next/navigation";
import { Link2, MousePointerClick, Package, Wallet } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/siteUrl";
import { formatInrExact } from "@/lib/utils";
import { GoLinkExplainer } from "@/components/go-links/GoLinkExplainer";
import { GoLinkTable } from "@/components/go-links/GoLinkTable";

export const metadata = {
  title: "goURL — Cashback straight from your address bar",
  description:
    "Type your goURL to shop and earn without opening the app, and share it to earn from your friends' purchases.",
};

export default async function GoLinksPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/go-links");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { username: true, userCode: true },
  });
  if (!user) redirect("/login");

  const handle = user.username ?? user.userCode;
  const base = siteUrl();

  const [stores, goLinks, clickRows, txAgg] = await Promise.all([
    prisma.store.findMany({
      where: { status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, logoUrl: true, cashbackDisplayText: true },
    }),
    prisma.profitLink.findMany({
      where: { userId: session.user.id, source: "GO_URL" },
      select: { id: true, storeId: true, createdAt: true },
    }),
    // Counted from Click rather than the cached ProfitLink.clickCount, which can
    // drift — a report should read the source of truth.
    prisma.click.groupBy({
      by: ["storeId"],
      where: { profitLink: { userId: session.user.id, source: "GO_URL" } },
      _count: { _all: true },
    }),
    prisma.transaction.groupBy({
      by: ["storeId"],
      where: { click: { profitLink: { userId: session.user.id, source: "GO_URL" } } },
      _sum: { profitLinkAmount: true },
      _count: { _all: true },
    }),
  ]);

  const linkByStore = new Map(goLinks.map((link) => [link.storeId, link]));
  const clicksByStore = new Map(clickRows.map((row) => [row.storeId, row._count._all]));
  const ordersByStore = new Map(txAgg.map((row) => [row.storeId, row._count._all]));
  const earnedByStore = new Map(
    txAgg.map((row) => [row.storeId, Number(row._sum.profitLinkAmount ?? 0)])
  );

  const rows = stores.map((store) => ({
    storeId: store.id,
    name: store.name,
    slug: store.slug,
    logoUrl: store.logoUrl,
    cashbackText: store.cashbackDisplayText,
    url: `${base}/go/${handle}/${store.slug}`,
    // A goURL works before it has ever been used — the link row is minted on
    // the first click, so "not used yet" is a normal state, not an error.
    used: linkByStore.has(store.id),
    clicks: clicksByStore.get(store.id) ?? 0,
    orders: ordersByStore.get(store.id) ?? 0,
    earned: earnedByStore.get(store.id) ?? 0,
  }));

  const totalClicks = rows.reduce((sum, row) => sum + row.clicks, 0);
  const totalOrders = rows.reduce((sum, row) => sum + row.orders, 0);
  const totalEarned = rows.reduce((sum, row) => sum + row.earned, 0);

  const stats = [
    {
      label: "Active goURLs",
      value: String(rows.filter((row) => row.used).length),
      icon: Link2,
      tone: "bg-violet-50 text-violet-600",
    },
    {
      label: "Total Clicks",
      value: String(totalClicks),
      icon: MousePointerClick,
      tone: "bg-sky-50 text-sky-600",
    },
    {
      label: "Orders",
      value: String(totalOrders),
      icon: Package,
      tone: "bg-cashlime-50 text-cashlime-700",
    },
    {
      label: "Earned",
      value: formatInrExact(totalEarned),
      icon: Wallet,
      tone: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-3.5 py-5 sm:px-6 sm:py-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          goURL
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Cashback made easy. Type your goURL straight into the address bar — no need to open the
          app first — or share it and earn from your friends&apos; purchases.
        </p>
      </header>

      <div className="mt-5 sm:mt-6">
        <GoLinkExplainer
          handle={handle}
          userCode={user.userCode}
          hasCustomUsername={Boolean(user.username)}
          baseUrl={base}
        />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-4 xl:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl2 border border-slate-200 bg-white p-3 shadow-card sm:p-4"
          >
            <div className="flex items-start gap-2.5 sm:gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full sm:h-11 sm:w-11 ${stat.tone}`}
              >
                <stat.icon size={18} strokeWidth={1.75} />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-slate-500 sm:text-sm">{stat.label}</div>
                <div className="mt-0.5 truncate text-lg font-extrabold text-slate-900 sm:text-xl">
                  {stat.value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-4 sm:px-5">
          <h2 className="text-base font-bold text-slate-900">Your goURLs</h2>
          <Link
            href="/dashboard/activity?tab=affiliate-clicks"
            className="text-sm font-medium text-violet-700 hover:underline"
          >
            Full click history
          </Link>
        </div>
        <div className="mt-3">
          <GoLinkTable rows={rows} />
        </div>
      </div>
    </div>
  );
}
