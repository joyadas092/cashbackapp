import type { SubIds } from "@/lib/attribution/subid";

/**
 * Builds a Cuelinks tracking URL locally, without calling their API.
 *
 * Redirect routes previously awaited POST /links/convert on *every* click,
 * which put a full network round-trip between the user's click and the
 * merchant's page — the single slowest thing in the funnel, on the one path
 * where latency loses sales.
 *
 * The format is deterministic and was verified against live API responses:
 *
 *   https://linksredirect.com/?cid=<channel>&subid=..&subid2=..&source=api&url=<encoded>
 *
 * Every sub id we send round-trips intact, which is what attribution depends
 * on. Building it here removes the round-trip entirely.
 *
 * Returns null when no channel id is configured, so callers fall back to the
 * client (stub or real) rather than emitting a link with a missing cid.
 */
export function buildTrackingUrl(destinationUrl: string, subIds: SubIds = {}): string | null {
  const channelId = process.env.CUELINKS_CHANNEL_ID?.trim();
  if (!channelId) return null;

  const params = new URLSearchParams();
  params.set("cid", channelId);

  // Order matches what the API returns. Cosmetic, but it keeps stored tracking
  // URLs comparable with ones the API produced.
  if (subIds.subid) params.set("subid", subIds.subid);
  if (subIds.subid2) params.set("subid2", subIds.subid2);
  if (subIds.subid3) params.set("subid3", subIds.subid3);
  if (subIds.subid5) params.set("subid5", subIds.subid5);

  params.set("source", "api");
  params.set("url", destinationUrl);

  return `https://linksredirect.com/?${params.toString()}`;
}
