import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storeQuerySchema } from "@/lib/validation/schemas";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const parsed = storeQuerySchema.safeParse({
    category: searchParams.get("category") ?? undefined,
    q: searchParams.get("q") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }

  const { category, q, page } = parsed.data;

  const where = {
    status: "ACTIVE" as const,
    ...(category ? { category: { slug: category } } : {}),
    ...(q ? { name: { contains: q, mode: "insensitive" as const } } : {}),
  };

  const [stores, total] = await Promise.all([
    prisma.store.findMany({
      where,
      orderBy: [{ featured: "desc" }, { ranking: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true },
    }),
    prisma.store.count({ where }),
  ]);

  return NextResponse.json({
    stores,
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
