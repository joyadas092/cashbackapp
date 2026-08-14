/**
 * Cuelinks Sub ID architecture (spec section 8), Phase 2 revision.
 *
 * subid  — the Click row's own id ("c_<clickId>"). This is the ONLY reliable
 *          key for matching a later postback/transaction back to a specific
 *          click: a user-id-keyed subid can't disambiguate which of a
 *          user's many clicks a transaction belongs to, since Cuelinks only
 *          echoes back whatever we sent. The click id must be generated
 *          BEFORE calling the Cuelinks client, then used both as the
 *          subid and as the Click row's own primary key.
 * subid2 — traffic/link type: "direct_cashback" | "profit_link" | "visit_store"
 * subid3 — profit-link id ("pl_<profitLinkId>"), when the click came through one
 * subid5 — "u_<userId>", debug/visibility only in the Cuelinks dashboard —
 *          never read back by our processor, attribution comes from the
 *          stored Click row instead
 *
 * Referral attribution is NOT tagged here — it's derived at postback/confirm
 * time from the Referral table (see src/lib/referral/engine.ts), since
 * eligibility (duration window, caps) can only be evaluated "as of now," not
 * at click time.
 *
 * Sub IDs must never contain PII (email, phone, name) — only opaque internal
 * IDs. This is a pure function so attribution logic can be unit tested
 * without a database or network call.
 */

export type LinkType = "direct_cashback" | "profit_link" | "visit_store";

export interface BuildSubIdsInput {
  clickId: string;
  userId?: string | null;
  linkType: LinkType;
  profitLinkId?: string | null;
}

export interface SubIds {
  subid?: string;
  subid2?: string;
  subid3?: string;
  subid5?: string;
}

export function buildSubIds(input: BuildSubIdsInput): SubIds {
  const subIds: SubIds = {
    subid: `c_${input.clickId}`,
    subid2: input.linkType,
  };

  if (input.profitLinkId) {
    subIds.subid3 = `pl_${input.profitLinkId}`;
  }

  if (input.userId) {
    subIds.subid5 = `u_${input.userId}`;
  }

  return subIds;
}
