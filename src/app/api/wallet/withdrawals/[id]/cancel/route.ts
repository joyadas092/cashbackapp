import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Cancel a withdrawal request that hasn't been picked up for processing yet,
 * returning the reserved money to the available balance.
 *
 * The status change is a compare-and-swap on REQUESTED, scoped to the caller's
 * own id. That does two jobs at once: a double-click can't refund twice, and a
 * request that an admin has already moved to PROCESSING can't be pulled out
 * from under them.
 *
 * The refund is a new WITHDRAWAL_REVERSED row rather than an edit to the
 * original WITHDRAWAL row — the ledger stays append-only, so the history still
 * shows the request was made.
 */
export async function POST(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  const request = await prisma.withdrawalRequest.findFirst({
    where: { id: params.id, userId },
    select: { id: true, amount: true, status: true, destination: true },
  });

  if (!request) {
    return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
  }
  if (request.status !== "REQUESTED") {
    return NextResponse.json(
      { error: `This request is already ${request.status.toLowerCase()} and can't be cancelled.` },
      { status: 409 }
    );
  }

  const wallet = await prisma.wallet.findUnique({ where: { userId }, select: { id: true } });
  if (!wallet) {
    return NextResponse.json({ error: "Wallet not found" }, { status: 404 });
  }

  const amount = Number(request.amount);

  const cancelled = await prisma.$transaction(async (tx) => {
    const moved = await tx.withdrawalRequest.updateMany({
      where: { id: request.id, userId, status: "REQUESTED" },
      data: { status: "CANCELLED", processedAt: new Date() },
    });

    // Someone else already moved it between our read and this write.
    if (moved.count === 0) return false;

    await tx.wallet.update({
      where: { userId },
      data: { availableBalance: { increment: amount } },
    });

    // Close out the original debit so it stops reading as in-flight...
    await tx.walletTransaction.updateMany({
      where: {
        userId,
        type: "WITHDRAWAL",
        sourceTransactionId: request.id,
        status: "PENDING",
      },
      data: { status: "REVERSED" },
    });

    // ...and record the credit back as its own row.
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId,
        type: "WITHDRAWAL_REVERSED",
        amount,
        status: "COMPLETED",
        source: "withdrawal",
        sourceTransactionId: request.id,
        description: `Cancelled withdrawal to ${request.destination}`,
      },
    });

    return true;
  });

  if (!cancelled) {
    return NextResponse.json(
      { error: "That request was just updated. Refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, refunded: amount });
}
