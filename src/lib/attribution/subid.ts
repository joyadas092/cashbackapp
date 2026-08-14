/**
 * Cuelinks Sub ID architecture (spec section 8):
 *   subid  — primary internal click/user attribution   e.g. "user_84729"
 *   subid2 — traffic/link type                          "direct_cashback" | "profit_link" | "referral"
 *   subid3 — profit-link ID / campaign attribution       e.g. "pl_928374"
 *   subid4 — referral ID                                 e.g. "ref_82921"
 *   subid5 — optional internal tracking metadata
 *
 * Sub IDs must never contain PII (email, phone, name) — only opaque internal
 * IDs. This is a pure function so attribution logic can be unit tested
 * without a database or network call.
 */

export type LinkType = "direct_cashback" | "profit_link" | "referral" | "visit_store";

export interface BuildSubIdsInput {
  userId?: string | null;
  linkType: LinkType;
  profitLinkId?: string | null;
  referralId?: string | null;
  meta?: string | null;
}

export interface SubIds {
  subid?: string;
  subid2?: string;
  subid3?: string;
  subid4?: string;
  subid5?: string;
}

export function buildSubIds(input: BuildSubIdsInput): SubIds {
  const subIds: SubIds = {};

  if (input.userId) {
    subIds.subid = `user_${input.userId}`;
  }

  subIds.subid2 = input.linkType;

  if (input.profitLinkId) {
    subIds.subid3 = `pl_${input.profitLinkId}`;
  }

  if (input.referralId) {
    subIds.subid4 = `ref_${input.referralId}`;
  }

  if (input.meta) {
    subIds.subid5 = input.meta;
  }

  return subIds;
}
