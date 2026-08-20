import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  riskStatus: z.enum(["NORMAL", "REVIEW", "RESTRICTED", "BLOCKED"]).optional(),
  kycStatus: z.enum(["VERIFIED", "PENDING", "REJECTED", "NONE"]).optional(),
});

/**
 * Change a user's risk or KYC status.
 *
 * riskStatus is not cosmetic: BLOCKED stops the account signing in at all, and
 * BLOCKED or RESTRICTED stops withdrawals. Both are enforced server-side, so
 * this endpoint really does cut off access.
 */
export async function PATCH(req: NextRequest, { params }: { params: { userId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.riskStatus && !parsed.data.kycStatus)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: { id: true, role: true, riskStatus: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Locking yourself out of the admin panel is not a recoverable mistake from
  // inside the admin panel.
  if (user.id === session.user.id && parsed.data.riskStatus && parsed.data.riskStatus !== "NORMAL") {
    return NextResponse.json(
      { error: "You can't restrict or block your own account." },
      { status: 400 }
    );
  }

  // Same reasoning one step out: an admin who can block other admins can take
  // the whole panel down. Demote first if that's genuinely intended.
  if (user.role === "ADMIN" && parsed.data.riskStatus && parsed.data.riskStatus !== "NORMAL") {
    return NextResponse.json(
      { error: "Admin accounts can't be restricted or blocked." },
      { status: 400 }
    );
  }

  await prisma.$transaction(async (tx) => {
    if (parsed.data.riskStatus) {
      await tx.user.update({
        where: { id: user.id },
        data: { riskStatus: parsed.data.riskStatus },
      });
    }

    if (parsed.data.kycStatus) {
      // NONE means "not submitted", stored as null rather than the string.
      const value = parsed.data.kycStatus === "NONE" ? null : parsed.data.kycStatus;
      await tx.userProfile.upsert({
        where: { userId: user.id },
        update: { kycStatus: value },
        create: { userId: user.id, kycStatus: value },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "user_status_update",
        entityType: "User",
        entityId: user.id,
        metadata: {
          riskFrom: user.riskStatus,
          riskTo: parsed.data.riskStatus ?? null,
          kycTo: parsed.data.kycStatus ?? null,
        },
      },
    });
  });

  return NextResponse.json({ ok: true });
}
