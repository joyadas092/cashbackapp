import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCuelinksClient } from "@/lib/cuelinks";

/**
 * One page of Cuelinks campaigns, annotated with whether we've already imported
 * each one.
 *
 * Paginated and searchable because the account carries hundreds of campaigns —
 * this endpoint used to fetch without a page size and returned only Cuelinks'
 * small default, which is why the admin browser looked like it held a handful.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const params = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(params.get("page") ?? "1", 10) || 1);
  const q = (params.get("q") ?? "").trim() || undefined;

  let result;
  try {
    result = await getCuelinksClient().listCampaigns({ page, q });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch campaigns from Cuelinks" },
      { status: 502 }
    );
  }

  const existing = await prisma.campaign.findMany({
    where: { cuelinksCampaignId: { in: result.campaigns.map((c) => c.campaignId) } },
    select: { cuelinksCampaignId: true, storeId: true },
  });
  const existingByCampaignId = new Map(existing.map((c) => [c.cuelinksCampaignId, c.storeId]));

  return NextResponse.json({
    campaigns: result.campaigns.map((c) => ({
      ...c,
      imported: existingByCampaignId.has(c.campaignId),
      linkedStoreId: existingByCampaignId.get(c.campaignId) ?? null,
    })),
    page: result.page,
    perPage: result.perPage,
    total: result.total,
    totalPages: result.totalPages,
  });
}
