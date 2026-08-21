import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { generateShortCode } from "@/lib/shortcode";

/**
 * goURLs — /go/<handle>/<store-slug>.
 *
 * A goURL is a profit link you never had to create. Typing the address is
 * enough: the link is minted on first use and reused forever after, so someone
 * can shop from the address bar without opening the app, and can pass the same
 * URL to a friend.
 *
 * It deliberately reuses ProfitLink rather than introducing a parallel concept.
 * Everything downstream — subid attribution, the commission split, confirmation,
 * reversal, the affiliate reports — already works off `click.profitLinkId`, so
 * goURL earnings flow through exactly the code paths that are already tested.
 * The only difference is `source`, which records how the link came to exist.
 */

/** Where /go sends a shopper for this store, matching /go/[storeSlug]. */
export function storeDestinationUrl(store: {
  homepageUrl: string | null;
  merchantDomains: string[];
}): string | null {
  return (
    store.homepageUrl?.trim() ||
    (store.merchantDomains[0] ? `https://${store.merchantDomains[0]}/` : null)
  );
}

/**
 * The user's goURL link for a store, creating it on first use.
 *
 * A partial unique index on (user_id, store_id) WHERE source = 'GO_URL' is what
 * actually guarantees one link per user per store; the read-then-create below
 * is the fast path, and the P2002 catch handles two simultaneous first clicks
 * on the same goURL.
 */
export async function getOrCreateGoLink(params: {
  userId: string;
  storeId: string;
  campaignId: string | null;
  destinationUrl: string;
}) {
  const existing = await prisma.profitLink.findFirst({
    where: { userId: params.userId, storeId: params.storeId, source: "GO_URL" },
  });
  if (existing) return existing;

  try {
    return await prisma.profitLink.create({
      data: {
        code: await generateUniqueGoCode(),
        userId: params.userId,
        storeId: params.storeId,
        campaignId: params.campaignId,
        source: "GO_URL",
        originalUrl: params.destinationUrl,
        destinationUrl: params.destinationUrl,
      },
    });
  } catch (error) {
    // Lost the race against another first click — the row now exists, so read it.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      const raced = await prisma.profitLink.findFirst({
        where: { userId: params.userId, storeId: params.storeId, source: "GO_URL" },
      });
      if (raced) return raced;
    }
    throw error;
  }
}

async function generateUniqueGoCode(): Promise<string> {
  for (let attempt = 0; attempt < 10; attempt++) {
    const code = generateShortCode();
    const taken = await prisma.profitLink.findUnique({ where: { code }, select: { id: true } });
    if (!taken) return code;
  }
  throw new Error("Could not allocate a unique profit link code");
}

/** The address a user shares: /go/<handle>/<store-slug>. */
export function goUrlFor(baseUrl: string, handle: string, storeSlug: string): string {
  return `${baseUrl}/go/${handle}/${storeSlug}`;
}
