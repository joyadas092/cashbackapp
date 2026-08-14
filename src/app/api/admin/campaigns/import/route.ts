import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getCuelinksClient } from "@/lib/cuelinks";
import { adminCampaignImportSchema } from "@/lib/validation/schemas";
import { validateCommissionRule } from "@/lib/commission/engine";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = adminCampaignImportSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  // Never trust client-supplied campaign name/image/domain — re-fetch the
  // canonical record from Cuelinks.
  const campaign = await getCuelinksClient().getCampaign(parsed.data.cuelinksCampaignId);
  if (!campaign) {
    return NextResponse.json({ error: "Campaign not found on Cuelinks" }, { status: 404 });
  }

  if (parsed.data.action === "link") {
    const store = await prisma.store.findUnique({ where: { id: parsed.data.storeId } });
    if (!store) {
      return NextResponse.json({ error: "Store not found" }, { status: 404 });
    }

    const result = await prisma.campaign.upsert({
      where: { cuelinksCampaignId: campaign.campaignId },
      update: {
        storeId: store.id,
        name: campaign.name,
        rawPayload: campaign as unknown as object,
        lastSyncedAt: new Date(),
      },
      create: {
        storeId: store.id,
        cuelinksCampaignId: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
        rawPayload: campaign as unknown as object,
        lastSyncedAt: new Date(),
      },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "campaign_import_link",
        entityType: "Campaign",
        entityId: result.id,
        metadata: { cuelinksCampaignId: campaign.campaignId, storeId: store.id },
      },
    });

    return NextResponse.json({ storeId: store.id, campaignId: result.id }, { status: 200 });
  }

  // action === "create"
  const { name, slug, categoryId, logoUrl, cashbackRate, cashbackDisplayText, domains, rule } = parsed.data;

  const category = await prisma.storeCategory.findUnique({ where: { id: categoryId } });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const existingSlug = await prisma.store.findUnique({ where: { slug } });
  if (existingSlug) {
    return NextResponse.json({ error: "A store with this slug already exists" }, { status: 409 });
  }

  validateCommissionRule(rule);

  const created = await prisma.$transaction(async (tx) => {
    const store = await tx.store.create({
      data: {
        name,
        slug,
        logoUrl,
        categoryId,
        cashbackRate,
        cashbackDisplayText,
        merchantDomains: domains,
        status: "INACTIVE",
        cuelinksCampaignId: campaign.campaignId,
      },
    });

    await tx.cashbackRule.create({
      data: {
        storeId: store.id,
        customerPct: rule.customerPct,
        profitLinkPct: rule.profitLinkPct,
        referralPct: rule.referralPct,
        platformPct: rule.platformPct,
        fixedAmount: rule.fixedAmount ?? null,
        maxCashback: rule.maxCashback ?? null,
        minOrderValue: rule.minOrderValue ?? null,
        validityDays: rule.validityDays ?? null,
        isActive: rule.isActive,
      },
    });

    const createdCampaign = await tx.campaign.create({
      data: {
        storeId: store.id,
        cuelinksCampaignId: campaign.campaignId,
        name: campaign.name,
        status: campaign.status,
        rawPayload: campaign as unknown as object,
        lastSyncedAt: new Date(),
      },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "campaign_import_create_store",
        entityType: "Store",
        entityId: store.id,
        metadata: { cuelinksCampaignId: campaign.campaignId },
      },
    });

    return { storeId: store.id, campaignId: createdCampaign.id };
  });

  return NextResponse.json(created, { status: 201 });
}
