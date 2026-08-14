/**
 * Referral eligibility engine (spec section 4).
 *
 * This module gates WHETHER and HOW MUCH of the commission engine's raw
 * referral split (CashbackRule.referralPct, via
 * src/lib/commission/engine.ts's calculateDistribution()) actually gets
 * credited to a referrer. It does not compute the amount itself — that
 * stays the commission engine's job, reused as-is. This module only answers:
 * is the referral still inside its eligibility window, has it hit its
 * lifetime cap, and does this specific sale clear the minimum order value.
 */

export interface ReferralRuleInput {
  durationDays?: number | null;
  maxTotalEarning?: number | null;
  minOrderValue?: number | null;
  isActive?: boolean;
}

export interface ReferralInput {
  createdAt: Date;
  totalEarned: number;
}

export interface EvaluateReferralEligibilityInput {
  referral: ReferralInput;
  rule: ReferralRuleInput;
  saleAmount: number;
  rawReferralAmount: number;
  now: Date;
}

export interface ReferralEligibilityResult {
  eligible: boolean;
  creditedAmount: number;
  reason?: string;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function evaluateReferralEligibility({
  referral,
  rule,
  saleAmount,
  rawReferralAmount,
  now,
}: EvaluateReferralEligibilityInput): ReferralEligibilityResult {
  if (rule.isActive === false) {
    return { eligible: false, creditedAmount: 0, reason: "referral_rule_inactive" };
  }

  if (rawReferralAmount <= 0) {
    return { eligible: false, creditedAmount: 0, reason: "zero_referral_amount" };
  }

  if (rule.durationDays != null) {
    const windowEnd = new Date(referral.createdAt);
    windowEnd.setDate(windowEnd.getDate() + rule.durationDays);
    if (now > windowEnd) {
      return { eligible: false, creditedAmount: 0, reason: "outside_duration_window" };
    }
  }

  if (rule.minOrderValue != null && saleAmount < rule.minOrderValue) {
    return { eligible: false, creditedAmount: 0, reason: "below_min_order_value" };
  }

  let creditedAmount = round2(rawReferralAmount);

  if (rule.maxTotalEarning != null) {
    const headroom = round2(rule.maxTotalEarning - referral.totalEarned);
    if (headroom <= 0) {
      return { eligible: false, creditedAmount: 0, reason: "max_total_earning_reached" };
    }
    creditedAmount = Math.min(creditedAmount, headroom);
  }

  return { eligible: true, creditedAmount };
}
