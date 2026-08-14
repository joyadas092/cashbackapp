import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const referrals = await prisma.referral.findMany({
    where: { referrerId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { referredUser: { select: { name: true } } },
  });

  const totalEarned = referrals.reduce((sum, r) => sum + Number(r.totalEarned), 0);

  return NextResponse.json({
    referralCode: user.referralCode,
    shareUrl: new URL(`/refer/${user.referralCode}`, req.url).toString(),
    totalEarned,
    referrals: referrals.map((r) => ({
      name: r.referredUser.name,
      joinedAt: r.createdAt,
      status: r.status,
      totalEarned: Number(r.totalEarned),
    })),
  });
}
