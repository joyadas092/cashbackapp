import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { createProfitLinkSchema } from "@/lib/validation/schemas";
import { validateMerchantUrl } from "@/lib/security/urlValidator";
import { generateShortCode } from "@/lib/shortcode";
import { getSetting } from "@/lib/settings";

const PAGE_SIZE = 10;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Share & Earn can be switched off platform-wide. Checked server-side so the
  // feature is genuinely off, not just hidden.
  if (!(await getSetting("affiliateEnabled"))) {
    return NextResponse.json(
      { error: "Share & Earn is currently unavailable." },
      { status: 403 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = createProfitLinkSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid URL" }, { status: 400 });
  }

  const eligibleStores = await prisma.store.findMany({
    where: { status: "ACTIVE", profitLinkEligible: true },
    select: {
      id: true,
      slug: true,
      name: true,
      merchantDomains: true,
      logoUrl: true,
      cashbackDisplayText: true,
      trackingTime: true,
      category: { select: { name: true } },
    },
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
      store: {
        name: store.name,
        slug: store.slug,
        logoUrl: store.logoUrl,
        category: store.category.name,
        trackingTime: store.trackingTime,
      },
      cashbackDisplayText: store.cashbackDisplayText,
      createdAt: profitLink.createdAt,
    },
    { status: 201 }
  );
}

type SortKey = "newest" | "oldest" | "clicks";
type RangeKey = "all" | "today" | "7d" | "30d";

const SORT_ORDERS: Record<SortKey, Prisma.ProfitLinkOrderByWithRelationInput> = {
  newest: { createdAt: "desc" },
  oldest: { createdAt: "asc" },
  clicks: { clickCount: "desc" },
};

/** Start of the window a range filter covers, or null for "no lower bound". */
function rangeStart(range: RangeKey): Date | null {
  if (range === "all") return null;

  const now = new Date();
  if (range === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return start;
  }
  const days = range === "7d" ? 7 : 30;
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);

  // Unknown values fall back to the defaults rather than erroring — these come
  // from a UI control, and a bad value should never break the panel.
  const sortParam = params.get("sort") as SortKey | null;
  const sort: SortKey = sortParam && sortParam in SORT_ORDERS ? sortParam : "newest";

  const rangeParam = params.get("range") as RangeKey | null;
  const range: RangeKey =
    rangeParam && ["all", "today", "7d", "30d"].includes(rangeParam) ? rangeParam : "all";

  // Filtering happens in the query, not on the returned page — otherwise a
  // filter would only ever apply to whichever 10 rows page 1 happened to hold.
  const start = rangeStart(range);
  const where: Prisma.ProfitLinkWhereInput = {
    userId: session.user.id,
    ...(start ? { createdAt: { gte: start } } : {}),
  };

  const [items, total] = await Promise.all([
    prisma.profitLink.findMany({
      where,
      orderBy: SORT_ORDERS[sort],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { store: { select: { name: true, slug: true, logoUrl: true, cashbackDisplayText: true } } },
    }),
    prisma.profitLink.count({ where }),
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
    total,
    totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)),
    sort,
    range,
  });
}
