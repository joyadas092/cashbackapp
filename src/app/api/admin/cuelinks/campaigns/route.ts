import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCuelinksClient } from "@/lib/cuelinks";

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  let campaigns;
  try {
    campaigns = await getCuelinksClient().listCampaigns();
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed to fetch campaigns from Cuelinks" },
      { status: 502 }
    );
  }

  const existing = await prisma.campaign.findMany({
    where: { cuelinksCampaignId: { in: campaigns.map((c) => c.campaignId) } },
    select: { cuelinksCampaignId: true, storeId: true },
  });
  const existingByCampaignId = new Map(existing.map((c) => [c.cuelinksCampaignId, c.storeId]));

  return NextResponse.json({
    campaigns: campaigns.map((c) => ({
      ...c,
      imported: existingByCampaignId.has(c.campaignId),
      linkedStoreId: existingByCampaignId.get(c.campaignId) ?? null,
    })),
  });
}
