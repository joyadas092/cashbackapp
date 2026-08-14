import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

const PAGE_SIZE = 20;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);

  const [items, total] = await Promise.all([
    prisma.walletTransaction.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.walletTransaction.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      type: item.type,
      amount: Number(item.amount),
      currency: item.currency,
      status: item.status,
      description: item.description,
      createdAt: item.createdAt,
    })),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
