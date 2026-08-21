import type { CampaignAccessStatus } from "./types";

/**
 * Whether a store can actually pay cashback.
 *
 * The app used to have no idea. `/go` builds a tracking link from the channel id
 * and the destination URL alone, so a click is recorded and the shopper reaches
 * the merchant whether or not the campaign earns anything — and the store page
 * advertises a rate regardless. A store whose campaign is unapproved, or which
 * strips sub ids, or which bars cashback publishers, will never produce a
 * postback that can be attributed to a user. Every such click is a promise the
 * platform cannot keep.
 *
 * This module is the single answer to "can this store pay?", used by the
 * redirect, by store visibility, and by the admin store list.
 */

/** The campaign fields eligibility depends on. Accepts a Campaign row or an API result. */
export interface EligibilityInput {
  cuelinksCampaignId?: string | null;
  accessStatus?: CampaignAccessStatus | string | null;
  subIdsAllowed?: boolean | null;
  cashbackPublishersAllowed?: boolean | null;
}

export interface EligibilityResult {
  eligible: boolean;
  /** User-legible reasons, so admin can show *why* a store is hidden. */
  reasons: string[];
}

/** Statuses a publisher can promote under. Everything else pays nothing. */
const USABLE_ACCESS: ReadonlySet<string> = new Set<CampaignAccessStatus>(["approved", "open"]);

export const ACCESS_STATUS_LABEL: Record<string, string> = {
  open: "Open — no approval needed",
  approved: "Approved",
  pending: "Approval pending",
  not_applied: "Not applied for",
  rejected: "Rejected",
  restricted: "Restricted",
};

/**
 * Seed placeholders. These were never real campaign ids, so a store carrying one
 * is not connected to Cuelinks at all, however healthy it looks.
 */
export function isStubCampaignId(campaignId: string | null | undefined): boolean {
  return Boolean(campaignId?.startsWith("stub_"));
}

export function campaignEligibility(campaign: EligibilityInput | null | undefined): EligibilityResult {
  const reasons: string[] = [];

  if (!campaign) {
    return { eligible: false, reasons: ["No Cuelinks campaign is linked to this store."] };
  }

  if (isStubCampaignId(campaign.cuelinksCampaignId)) {
    return {
      eligible: false,
      reasons: ["Linked to a seed placeholder, not a real Cuelinks campaign."],
    };
  }

  if (!campaign.cuelinksCampaignId) {
    reasons.push("No Cuelinks campaign is linked to this store.");
  }

  const access = campaign.accessStatus ?? undefined;
  if (access === undefined || access === null) {
    reasons.push("Campaign has never been synced from Cuelinks.");
  } else if (!USABLE_ACCESS.has(access)) {
    reasons.push(`Campaign access is "${ACCESS_STATUS_LABEL[access] ?? access}".`);
  }

  // Silent failure mode, so it is a hard block rather than a warning: the link
  // still works and the sale still happens, but the sub id is stripped, so the
  // postback arrives with nothing to match a click on and the cashback is lost.
  if (campaign.subIdsAllowed === false) {
    reasons.push("Campaign strips sub IDs, so cashback could never be attributed to a user.");
  }

  if (campaign.cashbackPublishersAllowed === false) {
    reasons.push("Advertiser does not allow cashback publishers on this campaign.");
  }

  return { eligible: reasons.length === 0, reasons };
}

/**
 * The cashback rate a store can actually fund.
 *
 * Cuelinks pays `payoutPct` of the sale; the customer receives `customerPct` of
 * that commission. Advertising more than this is a promise the split cannot
 * cover — Flipkart at 6% payout and a 70% customer share funds 4.2%, not the 8%
 * the badge used to show.
 *
 * Returns null when the payout is unknown (unsynced, or a per-click campaign
 * with no percentage), because guessing a rate is what caused the problem.
 */
export function effectiveCashbackPct(
  payoutPct: number | null | undefined,
  customerPct: number | null | undefined
): number | null {
  if (payoutPct == null || customerPct == null) return null;
  if (!Number.isFinite(payoutPct) || !Number.isFinite(customerPct)) return null;
  if (payoutPct <= 0 || customerPct <= 0) return null;
  return Math.round(((payoutPct * customerPct) / 100) * 100) / 100;
}

/** "Up to 4.2% Cashback" — the badge text, derived rather than typed. */
export function cashbackDisplayTextFor(pct: number | null): string {
  if (pct == null || pct <= 0) return "Cashback rate pending";
  return `Up to ${pct}% Cashback`;
}
