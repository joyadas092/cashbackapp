import { NextRequest, NextResponse } from "next/server";
import type { WalletTxType } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const PAGE_SIZE = 15;

/**
 * The wallet ledger, grouped the way the wallet page's tabs present it — one
 * group per way this app makes a user money, plus withdrawals.
 *
 * Filtering happens in the query rather than on a fetched page: the ledger is
 * paginated, so client-side filtering would only ever see the most recent page.
 */
const TAB_TYPES: Record<string, WalletTxType[] | null> = {
  all: null,
  cashback: ["CASHBACK_PENDING", "CASHBACK_CONFIRMED", "CASHBACK_REVERSED"],
  profit_link: ["PROFIT_LINK_EARNING", "PROFIT_LINK_EARNING_REVERSED"],
  referral: ["REFERRAL_EARNING", "REFERRAL_EARNING_REVERSED"],
  withdrawals: ["WITHDRAWAL", "WITHDRAWAL_REVERSED"],
  bonuses: ["ADJUSTMENT"],
};

/** Types that take money out of the wallet, so the UI can render the sign. */
const DEBIT_TYPES = new Set<WalletTxType>([
  "WITHDRAWAL",
  "CASHBACK_REVERSED",
  "PROFIT_LINK_EARNING_REVERSED",
  "REFERRAL_EARNING_REVERSED",
]);

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  // An unrecognised tab shows everything rather than erroring — it arrives from
  // a UI control, not a trusted caller.
  const tabParam = params.get("tab") ?? "all";
  const types = tabParam in TAB_TYPES ? TAB_TYPES[tabParam] : null;

  const where = {
    userId: session.user.id,
    ...(types ? { type: { in: types } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.walletTransaction.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((tx) => ({
      id: tx.id,
      type: tx.type,
      amount: Number(tx.amount),
      isDebit: DEBIT_TYPES.has(tx.type),
      status: tx.status,
      description: tx.description,
      source: tx.source,
      sourceTransactionId: tx.sourceTransactionId,
      createdAt: tx.createdAt,
    })),
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    tab: tabParam in TAB_TYPES ? tabParam : "all",
  });
}
