import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createProfitLinkSchema } from "@/lib/validation/schemas";
import { validateMerchantUrl } from "@/lib/security/urlValidator";
import { generateShortCode } from "@/lib/shortcode";

const PAGE_SIZE = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = createProfitLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid URL" }, { status: 400 });
  }

  const eligibleStores = await prisma.store.findMany({
    where: { status: "ACTIVE", profitLinkEligible: true },
    select: { id: true, slug: true, name: true, merchantDomains: true, logoUrl: true, cashbackDisplayText: true },
  });

  const validation = validateMerchantUrl(parsed.data.url, eligibleStores);
  if (!validation.ok) {
    return NextResponse.json({ error: validation.reason }, { status: 400 });
  }

  const store = eligibleStores.find((s) => s.id === validation.match.store.id)!;

  let code = generateShortCode();
  while (await prisma.profitLink.findUnique({ where: { code } })) {
    code = generateShortCode();
  }

  const profitLink = await prisma.profitLink.create({
    data: {
      code,
      userId: session.user.id,
      storeId: store.id,
      originalUrl: parsed.data.url,
      destinationUrl: parsed.data.url,
    },
  });

  const shareUrl = new URL(`/p/${profitLink.code}`, req.url).toString();

  return NextResponse.json(
    {
      id: profitLink.id,
      code: profitLink.code,
      shareUrl,
      store: { name: store.name, slug: store.slug, logoUrl: store.logoUrl },
      cashbackDisplayText: store.cashbackDisplayText,
      createdAt: profitLink.createdAt,
    },
    { status: 201 }
  );
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const page = Math.max(1, parseInt(req.nextUrl.searchParams.get("page") ?? "1", 10) || 1);

  const [items, total] = await Promise.all([
    prisma.profitLink.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { store: { select: { name: true, slug: true, logoUrl: true, cashbackDisplayText: true } } },
    }),
    prisma.profitLink.count({ where: { userId: session.user.id } }),
  ]);

  return NextResponse.json({
    items: items.map((link) => ({
      id: link.id,
      code: link.code,
      shareUrl: new URL(`/p/${link.code}`, req.url).toString(),
      originalUrl: link.originalUrl,
      clickCount: link.clickCount,
      status: link.status,
      createdAt: link.createdAt,
      store: link.store,
    })),
    page,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
  });
}
