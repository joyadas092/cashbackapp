import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCuelinksClient } from "@/lib/cuelinks";
import { buildSubIds } from "@/lib/attribution/subid";

/**
 * Spec section 47 (profit-link variant): resolves the ProfitLink, records a
 * click attributed to it, redirects to Cuelinks. Session is optional here —
 * the CLICKER doesn't need to be logged in; the profit-link CREATOR
 * (profitLink.userId) is who earns, credited at postback-confirm time via
 * click.profitLinkId, not via whoever clicked.
 */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const profitLink = await prisma.profitLink.findUnique({
    where: { code: params.code },
    include: { store: true, campaign: true },
  });

  if (!profitLink || profitLink.status !== "ACTIVE" || profitLink.store.status !== "ACTIVE") {
    return NextResponse.json({ error: "This earning link is no longer available." }, { status: 404 });
  }

  const session = await auth();
  const clickerId = session?.user?.id ?? null;

  const clickId = randomUUID();
  const cuelinks = getCuelinksClient();
  const subIds = buildSubIds({
    clickId,
    userId: clickerId,
    linkType: "profit_link",
    profitLinkId: profitLink.id,
  });

  const conversion = await cuelinks.convertLink({
    destinationUrl: profitLink.destinationUrl,
    campaignId: profitLink.campaign?.cuelinksCampaignId,
    ...subIds,
  });

  await prisma.$transaction([
    prisma.click.create({
      data: {
        id: clickId,
        userId: clickerId,
        storeId: profitLink.storeId,
        campaignId: profitLink.campaignId,
        clickType: "PROFIT_LINK",
        profitLinkId: profitLink.id,
        originalUrl: profitLink.originalUrl,
        trackingUrl: conversion.trackingUrl,
        subid: subIds.subid,
        subid2: subIds.subid2,
        subid3: subIds.subid3,
        subid5: subIds.subid5,
        userAgent: req.headers.get("user-agent") ?? undefined,
      },
    }),
    prisma.profitLink.update({
      where: { id: profitLink.id },
      data: { clickCount: { increment: 1 } },
    }),
  ]);

  return NextResponse.redirect(conversion.trackingUrl);
}
