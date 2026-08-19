import { redirect } from "next/navigation";
import { Clock, Gift, Wallet as WalletIcon, WalletCards } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { WithdrawForm } from "@/components/wallet/WithdrawForm";
import { WalletLedger } from "@/components/wallet/WalletLedger";
import { formatInrExact } from "@/lib/utils";

const DEFAULT_MIN_WITHDRAWAL = 100;

export default async function WalletPage() {
  const session = await auth();
  // The layout guards too, but Next fetches layout and page data in parallel.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/wallet");
  }
  const userId = session.user.id;

  const [wallet, minSetting, pendingRequests] = await Promise.all([
    prisma.wallet.findUnique({ where: { userId } }),
    prisma.setting.findUnique({ where: { key: "min_withdrawal_amount" } }),
    prisma.withdrawalRequest.findMany({
      where: { userId, status: "REQUESTED" },
      select: { id: true, amount: true },
    }),
  ]);

  const minWithdrawalRaw = Number(minSetting?.value ?? DEFAULT_MIN_WITHDRAWAL);
  const minWithdrawal =
    Number.isFinite(minWithdrawalRaw) && minWithdrawalRaw > 0
      ? minWithdrawalRaw
      : DEFAULT_MIN_WITHDRAWAL;

  const available = Number(wallet?.availableBalance ?? 0);
  const pendingCashback = Number(wallet?.pendingCashback ?? 0);
  const lifetime = Number(wallet?.lifetimeEarned ?? 0);
  const withdrawn = Number(wallet?.withdrawn ?? 0);
  const reserved = pendingRequests.reduce((sum, r) => sum + Number(r.amount), 0);

  const stats = [
    {
      label: "Total Balance",
      value: formatInrExact(lifetime),
      icon: WalletIcon,
      tone: "bg-cashlime-50 text-cashlime-700",
      chip: "Lifetime Earnings",
      chipTone: "bg-cashlime-50 text-cashlime-700",
      note: "All time earnings",
    },
    {
      label: "Pending Balance",
      value: formatInrExact(pendingCashback),
      icon: Clock,
      tone: "bg-amber-50 text-amber-600",
      chip: "In Confirmation",
      chipTone: "bg-amber-50 text-amber-700",
      note: "Confirmed once the store validates the order",
    },
    {
      label: "Available to Withdraw",
      value: formatInrExact(available),
      icon: WalletCards,
      tone: "bg-violet-50 text-violet-600",
      chip: available >= minWithdrawal ? "Ready to Withdraw" : "Below minimum",
      chipTone:
        available >= minWithdrawal
          ? "bg-cashlime-50 text-cashlime-700"
          : "bg-slate-100 text-slate-500",
      note: `Minimum withdrawal: ${formatInrExact(minWithdrawal)}`,
    },
    {
      label: "Withdrawn Amount",
      value: formatInrExact(withdrawn),
      icon: Gift,
      tone: "bg-sky-50 text-sky-600",
      chip: "Total Withdrawn",
      chipTone: "bg-sky-50 text-sky-700",
      note: "Total amount paid out",
    },
  ];

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Wallet</h1>
        <p className="mt-1 text-slate-500">
          Manage your earnings and withdraw your cashback easily.
        </p>
      </header>

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
            <p className="mt-3 text-xs text-slate-400">{stat.note}</p>
          </div>
        ))}
      </div>

      {reserved > 0 && (
        <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm text-amber-800">
          {formatInrExact(reserved)} is reserved for{" "}
          {pendingRequests.length === 1
            ? "a withdrawal request"
            : `${pendingRequests.length} withdrawal requests`}{" "}
          awaiting processing. It has already been deducted from your available balance — you can
          cancel a request from the Withdrawals tab below to get it back.
        </p>
      )}

      <div className="mt-6 space-y-6">
        <WithdrawForm availableBalance={available} minWithdrawal={minWithdrawal} />
        <WalletLedger pendingWithdrawalIds={pendingRequests.map((r) => r.id)} />
      </div>
    </div>
  );
}
