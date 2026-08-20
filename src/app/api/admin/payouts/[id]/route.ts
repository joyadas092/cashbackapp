import { NextRequest, NextResponse } from "next/server";
import type { WithdrawalStatus } from "@prisma/client";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Process a withdrawal request.
 *
 * The money was already reserved when the user requested it — `availableBalance`
 * was debited then and a PENDING WITHDRAWAL ledger row written. So the three
 * transitions here do different things:
 *
 *   PROCESSING  no money moves; it only marks the request as picked up.
 *   COMPLETED   the payout actually happened outside this system, so the ledger
 *               row settles and `withdrawn` finally moves. availableBalance is
 *               untouched, because it was debited at request time.
 *   REJECTED    the money comes back: availableBalance is credited, the original
 *               debit is marked REVERSED, and a WITHDRAWAL_REVERSED row records
 *               the return. The ledger stays append-only.
 *
 * Every transition is a compare-and-swap against the statuses it is legal to
 * move from, so two admins acting at once cannot pay the same request twice or
 * refund a completed one.
 */

const patchSchema = z.object({
  status: z.enum(["PROCESSING", "COMPLETED", "REJECTED"]),
  note: z.string().trim().max(500).optional(),
});

/** Which statuses each target may be reached from. */
const LEGAL_FROM: Record<"PROCESSING" | "COMPLETED" | "REJECTED", WithdrawalStatus[]> = {
  PROCESSING: ["REQUESTED"],
  COMPLETED: ["REQUESTED", "PROCESSING"],
  REJECTED: ["REQUESTED", "PROCESSING"],
};

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid payout update" },
      { status: 400 }
    );
  }
  const { status, note } = parsed.data;

  const request = await prisma.withdrawalRequest.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, amount: true, status: true, destination: true },
  });
  if (!request) {
    return NextResponse.json({ error: "Payout request not found" }, { status: 404 });
  }

  const legalFrom = LEGAL_FROM[status];
  if (!legalFrom.includes(request.status)) {
    return NextResponse.json(
      { error: `A ${request.status.toLowerCase()} payout can't be marked ${status.toLowerCase()}.` },
      { status: 409 }
    );
  }

  const amount = Number(request.amount);

  const applied = await prisma.$transaction(async (tx) => {
    const moved = await tx.withdrawalRequest.updateMany({
      where: { id: request.id, status: { in: legalFrom } },
      data: {
        status,
        adminNote: note ?? null,
        processedAt: status === "PROCESSING" ? null : new Date(),
      },
    });

    // Someone else moved it between our read and this write.
    if (moved.count === 0) return false;

    if (status === "COMPLETED") {
      await tx.walletTransaction.updateMany({
        where: {
          userId: request.userId,
          type: "WITHDRAWAL",
          sourceTransactionId: request.id,
          status: "PENDING",
        },
        data: { status: "COMPLETED" },
      });

      // Only now is the money genuinely gone.
      await tx.wallet.update({
        where: { userId: request.userId },
        data: { withdrawn: { increment: amount } },
      });
    }

    if (status === "REJECTED") {
      await tx.wallet.update({
        where: { userId: request.userId },
        data: { availableBalance: { increment: amount } },
      });

      await tx.walletTransaction.updateMany({
        where: {
          userId: request.userId,
          type: "WITHDRAWAL",
          sourceTransactionId: request.id,
          status: "PENDING",
        },
        data: { status: "REVERSED" },
      });

      const wallet = await tx.wallet.findUnique({
        where: { userId: request.userId },
        select: { id: true },
      });
      if (wallet) {
        await tx.walletTransaction.create({
          data: {
            walletId: wallet.id,
            userId: request.userId,
            type: "WITHDRAWAL_REVERSED",
            amount,
            status: "COMPLETED",
            source: "withdrawal",
            sourceTransactionId: request.id,
            description: `Rejected withdrawal to ${request.destination}`,
          },
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "withdrawal_process",
        entityType: "WithdrawalRequest",
        entityId: request.id,
        metadata: { from: request.status, to: status, amount, note: note ?? null },
      },
    });

    return true;
  });

  if (!applied) {
    return NextResponse.json(
      { error: "That request was just updated by someone else. Refresh and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, id: request.id, status });
}
