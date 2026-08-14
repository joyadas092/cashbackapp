/**
 * Commission distribution engine (spec sections 5, 6, 32).
 *
 * The Cuelinks commission received per transaction is NOT automatically the
 * customer's cashback — it is split between customer / profit-link creator /
 * referral / platform according to a per-store CashbackRule. This module is
 * the single source of truth for that math; postback processing (Phase 2)
 * calls calculateDistribution() rather than re-implementing the split.
 */

export interface CommissionRuleInput {
  customerPct: number;
  profitLinkPct: number;
  referralPct: number;
  platformPct: number;
  fixedAmount?: number | null;
  maxCashback?: number | null;
}

export interface CommissionDistribution {
  customer: number;
  profitLink: number;
  referral: number;
  platform: number;
}

/**
 * Throws if the four percentages sum to more than 100. Percentages may sum
 * to less than 100 (e.g. platform keeps a larger implicit margin), but never
 * more — that would mean paying out more than was actually earned.
 */
export function validateCommissionRule(rule: CommissionRuleInput): void {
  const total = rule.customerPct + rule.profitLinkPct + rule.referralPct + rule.platformPct;
  if (total > 100) {
    throw new Error(
      `Commission rule percentages sum to ${total}%, which exceeds 100%. ` +
        `customer=${rule.customerPct} profitLink=${rule.profitLinkPct} ` +
        `referral=${rule.referralPct} platform=${rule.platformPct}`
    );
  }
  for (const [label, pct] of Object.entries({
    customerPct: rule.customerPct,
    profitLinkPct: rule.profitLinkPct,
    referralPct: rule.referralPct,
    platformPct: rule.platformPct,
  })) {
    if (pct < 0) {
      throw new Error(`Commission rule percentage ${label} cannot be negative (got ${pct})`);
    }
  }
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface CalculateDistributionInput {
  commissionAmount: number;
  rule: CommissionRuleInput;
}

/**
 * Splits a Cuelinks commission amount according to a validated rule.
 *
 * - If `rule.fixedAmount` is set, it overrides the percentage-based customer
 *   cashback figure (the fixed amount is what the customer gets, capped by
 *   the commission itself); profit-link/referral/platform still derive from
 *   percentages of the original commission.
 * - `rule.maxCashback` caps the customer's cashback regardless of source.
 */
export function calculateDistribution({
  commissionAmount,
  rule,
}: CalculateDistributionInput): CommissionDistribution {
  validateCommissionRule(rule);

  if (commissionAmount < 0) {
    throw new Error(`commissionAmount cannot be negative (got ${commissionAmount})`);
  }

  let customer = round2((commissionAmount * rule.customerPct) / 100);
  const profitLink = round2((commissionAmount * rule.profitLinkPct) / 100);
  const referral = round2((commissionAmount * rule.referralPct) / 100);
  const platform = round2((commissionAmount * rule.platformPct) / 100);

  if (rule.fixedAmount != null) {
    customer = round2(Math.min(rule.fixedAmount, commissionAmount));
  }

  if (rule.maxCashback != null) {
    customer = round2(Math.min(customer, rule.maxCashback));
  }

  return { customer, profitLink, referral, platform };
}
