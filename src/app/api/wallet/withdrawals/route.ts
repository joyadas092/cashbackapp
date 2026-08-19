import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Withdrawal requests.
 *
 * Requesting reserves the money immediately: `availableBalance` is debited and a
 * PENDING WITHDRAWAL ledger row is written, so the same rupees can't be
 * requested twice while a request is outstanding. `withdrawn` only moves when a
 * request is actually COMPLETED.
 *
 * The debit is a conditional updateMany rather than a read-then-write. Two
 * requests submitted at the same moment would both pass a read-first balance
 * check and overdraw the wallet; making the balance a condition of the UPDATE
 * means the database decides, and the loser gets zero rows back.
 */

const DEFAULT_MIN_WITHDRAWAL = 100;

const requestSchema = z.object({
  amount: z.coerce.number().positive().max(9_999_999),
  method: z.enum(["UPI", "BANK_TRANSFER", "PAYTM", "AMAZON_PAY"]),
  destination: z.string().trim().min(3).max(120),
});

async function minWithdrawal(): Promise<number> {
  const setting = await prisma.setting.findUnique({ where: { key: "min_withdrawal_amount" } });
  const value = Number(setting?.value ?? DEFAULT_MIN_WITHDRAWAL);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_MIN_WITHDRAWAL;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid withdrawal request" },
      { status: 400 }
    );
  }
  const { amount, method, destination } = parsed.data;

  // Money is stored to 2dp; anything finer would round on write and not match
  // what the user was shown.
  const rounded = Math.round(amount * 100) / 100;
  if (rounded !== amount) {
    return NextResponse.json({ error: "Amount can have at most 2 decimal places" }, { status: 400 });
  }

  const minimum = await minWithdrawal();
  if (amount < minimum) {
    return NextResponse.json(
      { error: `Minimum withdrawal is ₹${minimum}.` },
      { status: 400 }
    );
  }

  if (method === "UPI" && !/^[\w.\-]{2,64}@[a-zA-Z]{2,32}$/.test(destination)) {
    return NextResponse.json({ error: "Enter a valid UPI ID, e.g. name@bank" }, { status: 400 });
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      // The balance is a condition of the write, so a concurrent request can
      // never take the wallet negative.
      const debited = await tx.wallet.updateMany({
        where: { userId, availableBalance: { gte: amount } },
        data: { availableBalance: { decrement: amount } },
      });

      if (debited.count === 0) {
        return { ok: false as const, reason: "insufficient_balance" };
      }

      const request = await tx.withdrawalRequest.create({
        data: { userId, amount, method, destination, status: "REQUESTED" },
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          userId,
          type: "WITHDRAWAL",
          amount,
          status: "PENDING",
          source: "withdrawal",
          sourceTransactionId: request.id,
          description: `Withdrawal to ${destination}`,
        },
      });

      return { ok: true as const, request };
    });

    if (!result.ok) {
      return NextResponse.json(
        { error: "That's more than your available balance." },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        id: result.request.id,
        amount: Number(result.request.amount),
        method: result.request.method,
        status: result.request.status,
        requestedAt: result.request.requestedAt,
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: "Could not submit that request." }, { status: 500 });
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.withdrawalRequest.findMany({
    where: { userId: session.user.id },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    items: requests.map((r) => ({
      id: r.id,
      amount: Number(r.amount),
      method: r.method,
      destination: r.destination,
      status: r.status,
      requestedAt: r.requestedAt,
      processedAt: r.processedAt,
    })),
  });
}
