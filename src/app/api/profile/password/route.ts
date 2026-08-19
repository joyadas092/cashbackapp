import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { passwordChangeSchema } from "@/lib/validation/schemas";

/**
 * Change the signed-in user's password.
 *
 * The current password is required and verified even though the caller already
 * holds a valid session: a session can be left open on a shared machine, and
 * proving knowledge of the existing password is what stops someone who finds an
 * unlocked browser from locking the real owner out of their wallet.
 *
 * The new hash uses the same cost factor as registration, so an old account's
 * password isn't quietly weaker than a new one's.
 */
const BCRYPT_COST = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = passwordChangeSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid password" },
      { status: 400 }
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  });
  if (!user) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const currentIsValid = await bcrypt.compare(parsed.data.currentPassword, user.passwordHash);
  if (!currentIsValid) {
    return NextResponse.json({ error: "Your current password is incorrect." }, { status: 403 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.newPassword, BCRYPT_COST);

  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  await prisma.auditLog.create({
    data: {
      actorUserId: user.id,
      action: "password_change",
      entityType: "User",
      entityId: user.id,
      // Never log either password, or any part of them.
      metadata: { at: new Date().toISOString() },
    },
  });

  return NextResponse.json({ ok: true });
}
