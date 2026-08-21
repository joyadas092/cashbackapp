import { randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { getCuelinksClient } from "@/lib/cuelinks";
import { buildSubIds } from "@/lib/attribution/subid";
import { buildTrackingUrl } from "@/lib/cuelinks/trackingUrl";
import { getOrCreateGoLink, storeDestinationUrl } from "@/lib/goLinks";
import { resolveHandle } from "@/lib/username";
import { getSetting } from "@/lib/settings";

/**
 * Store redirects. Two forms, one route.
 *
 *   /go/<store>                  a cashback trip for the signed-in shopper
 *   /go/<handle>/<store>         a goURL — the same trip when the owner opens
 *                                it, a shared profit link when anyone else does
 *
 * They share a file because Next requires one slug name per path depth, and
 * because they are the same journey: resolve a store, record a first-party
 * Click, redirect to Cuelinks. Only the attribution differs.
 *
 * The click's own id is generated BEFORE the redirect and used as the subid —
 * the only reliable way to match a later postback to this specific click, since
 * a user-id-keyed subid cannot say which of a user's many clicks a sale belongs
 * to. See src/lib/attribution/subid.ts.
 *
 * ?intent=visit     no user attribution, even when signed in (spec section 9)
 * ?intent=cashback  requires a session; attaches subid attribution
 */
export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  const segments = params.path ?? [];
  if (segments.length === 0 || segments.length > 2) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isGoUrl = segments.length === 2;
  const handleParam = isGoUrl ? segments[0] : null;
  const storeSlug = isGoUrl ? segments[1] : segments[0];

  const [store, owner] = await Promise.all([
    prisma.store.findUnique({
      where: { slug: storeSlug },
      include: { campaigns: { where: { status: "active" }, take: 1 } },
    }),
    handleParam ? resolveHandle(handleParam) : Promise.resolve(null),
  ]);

  if (isGoUrl && !owner) {
    return NextResponse.json(
      { error: "That goURL doesn't belong to anyone. Check the username and try again." },
      { status: 404 }
    );
  }

  if (!store || store.status !== "ACTIVE") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  // Where the shopper actually lands. If a store has no destination at all,
  // refuse: recording a click and sending someone to a fabricated domain is
  // worse than an honest error, which is exactly what the old
  // `${slug}.example-merchant.invalid` placeholder did.
  const destinationUrl = storeDestinationUrl(store);
  if (!destinationUrl) {
    return NextResponse.json(
      { error: "This store has no destination URL configured yet." },
      { status: 503 }
    );
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? null;
  const campaign = store.campaigns[0];
  const clickId = randomUUID();

  if (owner) {
    return goUrlRedirect({ req, store, campaign, owner, viewerId, destinationUrl, clickId });
  }

  // --- /go/<store> ---------------------------------------------------------
  const intent = req.nextUrl.searchParams.get("intent") === "cashback" ? "cashback" : "visit";

  if (intent === "cashback" && !viewerId) {
    // Should not normally be reached — LoginPromptModal intercepts client-side —
    // but never silently attach attribution to an unauthenticated request.
    return NextResponse.redirect(new URL(`/stores/${store.slug}`, req.url));
  }

  const subIds =
    intent === "cashback" ? buildSubIds({ clickId, userId: viewerId, linkType: "direct_cashback" }) : {};
  const trackingUrl = await resolveTrackingUrl(destinationUrl, subIds, campaign?.cuelinksCampaignId);

  await prisma.click.create({
    data: {
      id: clickId,
      userId: intent === "cashback" ? viewerId : null,
      storeId: store.id,
      campaignId: campaign?.id,
      clickType: intent === "cashback" ? "DIRECT_CASHBACK" : "VISIT_STORE",
      originalUrl: destinationUrl,
      trackingUrl,
      subid: subIds.subid,
      subid2: subIds.subid2,
      subid3: subIds.subid3,
      subid5: subIds.subid5,
      userAgent: req.headers.get("user-agent") ?? undefined,
    },
  });

  return NextResponse.redirect(trackingUrl);
}

type StoreWithCampaigns = NonNullable<
  Awaited<ReturnType<typeof prisma.store.findUnique>>
> & { campaigns: Array<{ id: string; cuelinksCampaignId: string }> };

/**
 * /go/<handle>/<store>
 *
 * The same address behaves differently depending on who opens it: the owner is
 * shopping, anyone else is buying through something the owner shared. That is
 * decided from the session rather than the URL, so there is nothing extra to
 * explain to the person you send it to.
 */
async function goUrlRedirect(args: {
  req: NextRequest;
  store: StoreWithCampaigns;
  campaign: { id: string; cuelinksCampaignId: string } | undefined;
  owner: NonNullable<Awaited<ReturnType<typeof resolveHandle>>>;
  viewerId: string | null;
  destinationUrl: string;
  clickId: string;
}) {
  const { req, store, campaign, owner, viewerId, destinationUrl, clickId } = args;

  // A blocked or restricted owner must not keep earning through links already
  // in circulation. Read live rather than trusting anything cached.
  if (owner.riskStatus === "BLOCKED" || owner.riskStatus === "RESTRICTED") {
    return NextResponse.json({ error: "This goURL is not active at the moment." }, { status: 403 });
  }

  const isOwnTrip = viewerId === owner.id;

  // A goURL someone else opens is a profit link, so the platform-wide Share &
  // Earn switch has to govern it or the toggle would be a lie. The owner's own
  // shopping trip is unaffected.
  if (!isOwnTrip && !(await getSetting("affiliateEnabled"))) {
    return NextResponse.json({ error: "Share & Earn is currently unavailable." }, { status: 403 });
  }

  const goLink = isOwnTrip
    ? null
    : await getOrCreateGoLink({
        userId: owner.id,
        storeId: store.id,
        campaignId: campaign?.id ?? null,
        destinationUrl,
      });

  const subIds = isOwnTrip
    ? buildSubIds({ clickId, userId: owner.id, linkType: "direct_cashback" })
    : buildSubIds({ clickId, userId: viewerId, linkType: "profit_link", profitLinkId: goLink!.id });

  const trackingUrl = await resolveTrackingUrl(destinationUrl, subIds, campaign?.cuelinksCampaignId);

  const clickData = {
    id: clickId,
    userId: isOwnTrip ? owner.id : viewerId,
    storeId: store.id,
    campaignId: campaign?.id,
    clickType: isOwnTrip ? ("DIRECT_CASHBACK" as const) : ("PROFIT_LINK" as const),
    profitLinkId: goLink?.id,
    originalUrl: destinationUrl,
    trackingUrl,
    subid: subIds.subid,
    subid2: subIds.subid2,
    subid3: subIds.subid3,
    subid5: subIds.subid5,
    userAgent: req.headers.get("user-agent") ?? undefined,
  };

  if (goLink) {
    await prisma.$transaction([
      prisma.click.create({ data: clickData }),
      prisma.profitLink.update({
        where: { id: goLink.id },
        data: { clickCount: { increment: 1 } },
      }),
    ]);
  } else {
    await prisma.click.create({ data: clickData });
  }

  return NextResponse.redirect(trackingUrl);
}

/**
 * Built locally when a channel id is configured, which keeps a network
 * round-trip out of the redirect path — see src/lib/cuelinks/trackingUrl.ts.
 */
async function resolveTrackingUrl(
  destinationUrl: string,
  subIds: ReturnType<typeof buildSubIds> | Record<string, never>,
  cuelinksCampaignId: string | undefined
): Promise<string> {
  const local = buildTrackingUrl(destinationUrl, subIds);
  if (local) return local;

  const converted = await getCuelinksClient().convertLink({
    destinationUrl,
    campaignId: cuelinksCampaignId,
    ...subIds,
  });
  return converted.trackingUrl;
}
