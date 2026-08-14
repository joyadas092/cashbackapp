import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCuelinksClient } from "@/lib/cuelinks";
import { buildSubIds } from "@/lib/attribution/subid";

/**
 * Spec section 47: the frontend never talks to Cuelinks directly — it hits
 * this route, which resolves the store, records a first-party Click, and
 * redirects to the Cuelinks tracking URL (or the store's raw URL in stub
 * mode without a real campaign).
 *
 * ?intent=visit     -> no user attribution, even if logged in (spec section 9)
 * ?intent=cashback  -> requires a session; attaches subid attribution
 *
 * The click's own id is generated BEFORE calling Cuelinks and used as the
 * subid — this is the only reliable way to match a later postback back to
 * this specific click (a user-id-keyed subid can't disambiguate which of a
 * user's many clicks a transaction belongs to). See src/lib/attribution/subid.ts.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { storeSlug: string } }
) {
  const intent = req.nextUrl.searchParams.get("intent") === "cashback" ? "cashback" : "visit";

  const store = await prisma.store.findUnique({
    where: { slug: params.storeSlug },
    include: { campaigns: { where: { status: "active" }, take: 1 } },
  });

  if (!store || store.status !== "ACTIVE") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const session = await auth();
  const userId = session?.user?.id ?? null;
  const campaign = store.campaigns[0];
  const destinationUrl = `https://${store.slug}.example-merchant.invalid/`; // placeholder until real merchant URLs are configured per store

  if (intent === "cashback" && !userId) {
    // Should not normally be reached — LoginPromptModal intercepts client-side —
    // but never silently attach attribution to an unauthenticated request.
    return NextResponse.redirect(new URL(`/stores/${store.slug}`, req.url));
  }

  const clickId = randomUUID();
  const cuelinks = getCuelinksClient();
  const subIds =
    intent === "cashback"
      ? buildSubIds({ clickId, userId, linkType: "direct_cashback" })
      : {};

  const conversion = await cuelinks.convertLink({
    destinationUrl,
    campaignId: campaign?.cuelinksCampaignId,
    ...subIds,
  });

  await prisma.click.create({
    data: {
      id: clickId,
      userId: intent === "cashback" ? userId : null,
      storeId: store.id,
      campaignId: campaign?.id,
      clickType: intent === "cashback" ? "DIRECT_CASHBACK" : "VISIT_STORE",
      originalUrl: destinationUrl,
      trackingUrl: conversion.trackingUrl,
      subid: subIds.subid,
      subid2: subIds.subid2,
      subid3: subIds.subid3,
      subid5: subIds.subid5,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  });

  return NextResponse.redirect(conversion.trackingUrl);
}
