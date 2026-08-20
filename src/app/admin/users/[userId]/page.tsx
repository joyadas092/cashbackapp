import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Pagination } from "@/components/shared/Pagination";
import { formatInr, cn } from "@/lib/utils";

const PAGE_SIZE = 20;
const TABS = ["clicks", "transactions", "wallet"] as const;
type Tab = (typeof TABS)[number];

export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: { userId: string };
  searchParams: { tab?: string; page?: string };
}) {
  await requireAdminSession(`/admin/users/${params.userId}`);

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    include: { wallet: true },
  });
  if (!user) notFound();

  const tab: Tab = TABS.includes(searchParams.tab as Tab) ? (searchParams.tab as Tab) : "clicks";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  let rows: Array<Record<string, unknown>> = [];
  let total = 0;

  if (tab === "clicks") {
    const [items, count] = await Promise.all([
      prisma.click.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { store: true },
      }),
      prisma.click.count({ where: { userId: user.id } }),
    ]);
    rows = items;
    total = count;
  } else if (tab === "transactions") {
    const [items, count] = await Promise.all([
      prisma.transaction.findMany({
        where: { click: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { store: true, click: true },
      }),
      prisma.transaction.count({ where: { click: { userId: user.id } } }),
    ]);
    rows = items;
    total = count;
  } else {
    const [items, count] = await Promise.all([
      prisma.walletTransaction.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
      }),
      prisma.walletTransaction.count({ where: { userId: user.id } }),
    ]);
    rows = items;
    total = count;
  }

  return (
    <div>
      <Link href="/admin/users" className="text-sm text-slate-500 hover:underline">
        &larr; Back to Users
      </Link>
      <h1 className="mt-2 text-2xl font-bold">{user.name}</h1>
      <p className="text-sm text-slate-600">{user.email}</p>

      {user.wallet && (
        <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Card className="p-4">
            <div className="text-xs text-slate-500">Available</div>
            <div className="font-bold text-cashlime-700">{formatInr(Number(user.wallet.availableBalance))}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-500">Pending</div>
            <div className="font-bold text-cyan-300">{formatInr(Number(user.wallet.pendingCashback))}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-500">Lifetime</div>
            <div className="font-bold text-slate-900">{formatInr(Number(user.wallet.lifetimeEarned))}</div>
          </Card>
          <Card className="p-4">
            <div className="text-xs text-slate-500">Withdrawn</div>
            <div className="font-bold text-slate-600">{formatInr(Number(user.wallet.withdrawn))}</div>
          </Card>
        </div>
      )}

      <div className="mt-6 flex gap-2">
        {TABS.map((t) => (
          <Link
            key={t}
            href={`/admin/users/${user.id}?tab=${t}`}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium capitalize transition-colors",
              tab === t ? "bg-violet-600 text-white" : "bg-slate-100 text-slate-700 hover:bg-white/20"
            )}
          >
            {t}
          </Link>
        ))}
      </div>

      <div className="mt-4 overflow-x-auto rounded-xl2 border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              {tab === "clicks" && (
                <>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </>
              )}
              {tab === "transactions" && (
                <>
                  <th className="px-4 py-3">Store</th>
                  <th className="px-4 py-3">Sale</th>
                  <th className="px-4 py-3">Commission</th>
                  <th className="px-4 py-3">Customer Cut</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </>
              )}
              {tab === "wallet" && (
                <>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                </>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {rows.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                  No records.
                </td>
              </tr>
            )}
            {tab === "clicks" &&
              rows.map((r) => {
                const click = r as unknown as { id: string; store: { name: string }; clickType: string; status: string; createdAt: Date };
                return (
                  <tr key={click.id}>
                    <td className="px-4 py-3 text-slate-900">{click.store.name}</td>
                    <td className="px-4 py-3 text-slate-600">{click.clickType}</td>
                    <td className="px-4 py-3 text-slate-600">{click.status}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(click.createdAt)}
                    </td>
                  </tr>
                );
              })}
            {tab === "transactions" &&
              rows.map((r) => {
                const txn = r as unknown as {
                  id: string;
                  store: { name: string };
                  saleAmount: unknown;
                  commissionAmount: unknown;
                  customerAmount: unknown;
                  status: string;
                  createdAt: Date;
                };
                return (
                  <tr key={txn.id}>
                    <td className="px-4 py-3 text-slate-900">{txn.store.name}</td>
                    <td className="px-4 py-3 text-slate-600">{formatInr(Number(txn.saleAmount))}</td>
                    <td className="px-4 py-3 text-slate-600">{formatInr(Number(txn.commissionAmount))}</td>
                    <td className="px-4 py-3 text-cashlime-700">{formatInr(Number(txn.customerAmount))}</td>
                    <td className="px-4 py-3 text-slate-600">{txn.status}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(txn.createdAt)}
                    </td>
                  </tr>
                );
              })}
            {tab === "wallet" &&
              rows.map((r) => {
                const wtx = r as unknown as { id: string; type: string; amount: unknown; status: string; createdAt: Date };
                return (
                  <tr key={wtx.id}>
                    <td className="px-4 py-3 text-slate-900">{wtx.type}</td>
                    <td className="px-4 py-3 text-slate-600">{formatInr(Number(wtx.amount))}</td>
                    <td className="px-4 py-3 text-slate-600">{wtx.status}</td>
                    <td className="px-4 py-3 text-slate-400">
                      {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(wtx.createdAt)}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>

      <Pagination
        page={page}
        totalPages={Math.max(1, Math.ceil(total / PAGE_SIZE))}
        basePath={`/admin/users/${user.id}`}
        searchParams={{ tab }}
      />
    </div>
  );
}
