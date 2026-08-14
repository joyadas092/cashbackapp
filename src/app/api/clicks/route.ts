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
  const storeSlug = req.nextUrl.searchParams.get("store") ?? undefined;

  const where = {
    userId: session.user.id,
    ...(storeSlug ? { store: { slug: storeSlug } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.click.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { store: { select: { name: true, slug: true, logoUrl: true } } },
    }),
    prisma.click.count({ where }),
  ]);

  return NextResponse.json({
    items: items.map((item) => ({
      id: item.id,
      clickType: item.clickType,
      status: item.status,
      store: item.store,
      createdAt: item.createdAt,
    })),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
