import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { profileUpdateSchema } from "@/lib/validation/schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({ where: { userId: session.user.id } });
  return NextResponse.json({
    upiId: profile?.upiId ?? null,
    bankDetails: profile?.bankDetails ?? null,
    kycStatus: profile?.kycStatus ?? null,
    notificationPrefs: profile?.notificationPrefs ?? {},
  });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  const profile = await prisma.userProfile.upsert({
    where: { userId: session.user.id },
    update: {
      ...(parsed.data.upiId !== undefined ? { upiId: parsed.data.upiId } : {}),
      ...(parsed.data.bankDetails !== undefined
        ? { bankDetails: parsed.data.bankDetails ?? Prisma.JsonNull }
        : {}),
      ...(parsed.data.notificationPrefs !== undefined
        ? { notificationPrefs: parsed.data.notificationPrefs }
        : {}),
    },
    create: {
      userId: session.user.id,
      upiId: parsed.data.upiId ?? null,
      bankDetails: parsed.data.bankDetails ?? undefined,
      notificationPrefs: parsed.data.notificationPrefs ?? {},
    },
  });

  return NextResponse.json({
    upiId: profile.upiId,
    bankDetails: profile.bankDetails,
    kycStatus: profile.kycStatus,
    notificationPrefs: profile.notificationPrefs,
  });
}
