import Link from "next/link";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/utils";

export default async function AdminDashboardPage() {
  await requireAdminSession("/admin");

  const [userCount, storeCount, activeStoreCount, pendingTxns, confirmedTxns, storesWithoutRule] =
    await Promise.all([
      prisma.user.count(),
      prisma.store.count(),
      prisma.store.count({ where: { status: "ACTIVE" } }),
      prisma.transaction.count({ where: { status: "PENDING" } }),
      prisma.transaction.aggregate({
        where: { status: "CONFIRMED" },
        _sum: { commissionAmount: true },
      }),
      prisma.store.count({ where: { cashbackRules: { none: {} } } }),
    ]);

  const tiles = [
    { label: "Total Users", value: userCount },
    { label: "Total Stores", value: storeCount },
    { label: "Active Stores", value: activeStoreCount },
    { label: "Pending Transactions", value: pendingTxns },
    { label: "Confirmed Commission", value: formatInr(Number(confirmedTxns._sum.commissionAmount ?? 0)) },
    { label: "Stores Missing a Rate", value: storesWithoutRule },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Card key={tile.label} className="p-5">
            <div className="text-xs font-medium uppercase tracking-wide text-white/50">
              {tile.label}
            </div>
            <div className="mt-2 text-2xl font-bold text-white">{tile.value}</div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/admin/stores" className="text-sm font-medium text-violet-400 hover:underline">
          Manage Stores &rarr;
        </Link>
        <Link href="/admin/campaigns" className="text-sm font-medium text-violet-400 hover:underline">
          Browse Cuelinks Campaigns &rarr;
        </Link>
        <Link href="/admin/users" className="text-sm font-medium text-violet-400 hover:underline">
          Search Users &rarr;
        </Link>
      </div>
    </div>
  );
}
