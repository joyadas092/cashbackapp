import { createHash, timingSafeEqual } from "node:crypto";
import type { Prisma, TransactionStatus, WalletTxType } from "@prisma/client";
import { prisma } from "@/lib/db";
import { calculateDistribution, validateCommissionRule } from "@/lib/commission/engine";
import { evaluateReferralEligibility } from "@/lib/referral/engine";

/**
 * Cuelinks postback processor (spec sections 11, 12).
 *
 * Field names (click_id, commission_amount, transaction_amount,
 * merchant_transaction_id, token) are confirmed from the user's live
 * Cuelinks Global Postback config. The status field's exact parameter name
 * is NOT confirmed — see mapCuelinksStatus() below. Do not invent
 * additional undocumented parameters.
 */

export interface RawPostbackParams {
  click_id?: string;
  commission_amount?: string;
  transaction_amount?: string;
  merchant_transaction_id?: string;
  status?: string;
  transaction_status?: string;
  token?: string;
  [key: string]: string | undefined;
}

export interface ProcessResult {
  httpStatus: number;
  body: { status: string; [key: string]: unknown };
}

type TxClient = Prisma.TransactionClient;

function safeEqual(a: string, b: string): boolean {
  const ah = createHash("sha256").update(a).digest();
  const bh = createHash("sha256").update(b).digest();
  return timingSafeEqual(ah, bh);
}

function verifyToken(raw: RawPostbackParams): boolean {
  const expected = process.env.CUELINKS_POSTBACK_SECRET;
  if (!expected) {
    console.warn(
      "[cuelinks-postback] CUELINKS_POSTBACK_SECRET not set — accepting postbacks unauthenticated (dev only)"
    );
    return true;
  }
  if (!raw.token) return false;
  return safeEqual(raw.token, expected);
}

/**
 * Status VALUES confirmed 2026-08-14 against developers.cuelinks.com's
 * GET /pub_api/v3/transactions docs: pending, validated, payable,
 * invoice_raised, paid, rejected. (No cancelled/reversed value is
 * documented there — those are kept below only as forward-compatible
 * aliases in case a postback ever sends them; they've never been observed.)
 *
 * The postback PARAMETER NAME carrying this value is still unconfirmed —
 * the user's live Global Postback config screenshot only had
 * click_id/commission_amount/transaction_amount/merchant_transaction_id/
 * token wired up, no status field. Add the real param name to the Cuelinks
 * dashboard's postback template and it'll be picked up here via `raw.status`
 * (or extend the read below if Cuelinks names it something else). Until
 * then, an unrecognized/missing value causes no wallet mutation — the safe
 * default.
 */
function mapCuelinksStatus(raw: RawPostbackParams): TransactionStatus | null {
  const value = (raw.status ?? raw.transaction_status ?? "").toLowerCase().trim();
  switch (value) {
    case "pending":
      return "PENDING";
    case "validated":
    case "payable":
    case "invoice_raised":
    case "confirmed":
      return "CONFIRMED";
    case "rejected":
      return "REJECTED";
    case "paid":
      return "PAID";
    // Not documented in the confirmed transaction status list — kept as
    // forward-compatible aliases only, never observed in practice.
    case "cancelled":
    case "canceled":
      return "CANCELLED";
    case "reversed":
      return "REVERSED";
    default:
      return null;
  }
}

function isUniqueConstraintError(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "P2002";
}

async function logPostback(params: {
  rawParams: Record<string, unknown>;
  tokenValid: boolean;
  clickId?: string | null;
  transactionId?: string | null;
  processResult: string;
  errorMessage?: string | null;
}) {
  await prisma.cuelinksPostback.create({
    data: {
      rawParams: params.rawParams as Prisma.InputJsonValue,
      tokenValid: params.tokenValid,
      clickId: params.clickId ?? undefined,
      transactionId: params.transactionId ?? undefined,
      processResult: params.processResult,
      errorMessage: params.errorMessage ?? undefined,
    },
  });
}

export async function processCuelinksPostback(raw: RawPostbackParams): Promise<ProcessResult> {
  const tokenValid = verifyToken(raw);
  if (!tokenValid) {
    await logPostback({ rawParams: raw, tokenValid: false, processResult: "invalid_token" });
    return { httpStatus: 401, body: { status: "invalid_token" } };
  }

  const rawClickId = raw.click_id;
  const clickId = rawClickId?.startsWith("c_") ? rawClickId.slice(2) : rawClickId;
  // Dedupe key. Cuelinks' own {transaction_id} is the stable unique id for a
  // transaction and is what later status updates carry, so it is preferred.
  // {transaction_reference_id} (the merchant's order id) is the fallback for
  // postback configs that only send that — it identifies the same sale, but is
  // the merchant's number rather than Cuelinks'.
  const cuelinksTransactionId = raw.transaction_id ?? raw.merchant_transaction_id;
  // Kept separately so the order id shown to users and admins is the one the
  // shopper would recognise from the store.
  const merchantOrderId = raw.merchant_transaction_id ?? raw.transaction_reference_id ?? null;
  const saleAmount = raw.transaction_amount != null ? Number(raw.transaction_amount) : NaN;
  const commissionAmount = raw.commission_amount != null ? Number(raw.commission_amount) : NaN;

  if (!clickId || !cuelinksTransactionId || Number.isNaN(saleAmount) || Number.isNaN(commissionAmount)) {
    await logPostback({
      rawParams: raw,
      tokenValid: true,
      processResult: "malformed",
      errorMessage: "Missing/invalid required fields",
    });
    return { httpStatus: 400, body: { status: "malformed" } };
  }

  const click = await prisma.click.findUnique({
    where: { id: clickId },
    include: { profitLink: true },
  });

  if (!click) {
    await logPostback({ rawParams: raw, tokenValid: true, clickId, processResult: "unmatched_click" });
    return { httpStatus: 200, body: { status: "unmatched_click" } };
  }

  const status = mapCuelinksStatus(raw);
  if (status === null) {
    await logPostback({ rawParams: raw, tokenValid: true, clickId, processResult: "unknown_status" });
    return { httpStatus: 200, body: { status: "unknown_status" } };
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      return applyTransactionStatus(tx, {
        click,
        cuelinksTransactionId: cuelinksTransactionId!,
        merchantOrderId,
        saleAmount,
        commissionAmount,
        status,
        rawPayload: raw,
      });
    });

    await logPostback({
      rawParams: raw,
      tokenValid: true,
      clickId,
      transactionId: result.transactionId,
      processResult: result.processResult,
    });

    return { httpStatus: 200, body: { status: result.processResult } };
  } catch (e) {
    await logPostback({
      rawParams: raw,
      tokenValid: true,
      clickId,
      processResult: "error",
      errorMessage: e instanceof Error ? e.message : String(e),
    });
    return { httpStatus: 500, body: { status: "error" } };
  }
}

interface ClickWithProfitLink {
  id: string;
  userId: string | null;
  storeId: string;
  campaignId: string | null;
  clickType: string;
  profitLinkId: string | null;
  profitLink: { id: string; userId: string } | null;
}

async function applyTransactionStatus(
  tx: TxClient,
  params: {
    click: ClickWithProfitLink;
    cuelinksTransactionId: string;
    merchantOrderId: string | null;
    saleAmount: number;
    commissionAmount: number;
    status: TransactionStatus;
    rawPayload: Record<string, unknown>;
  }
): Promise<{ transactionId: string; processResult: string }> {
  const {
    click,
    cuelinksTransactionId,
    merchantOrderId,
    saleAmount,
    commissionAmount,
    status,
    rawPayload,
  } = params;

  let transaction = await tx.transaction.findUnique({
    where: { storeId_cuelinksTransactionId: { storeId: click.storeId, cuelinksTransactionId } },
  });

  if (!transaction) {
    const rule = await tx.cashbackRule.findFirst({ where: { storeId: click.storeId, isActive: true } });
    if (!rule) {
      throw new Error(`No active CashbackRule for store ${click.storeId}`);
    }

    const ruleInput = {
      customerPct: Number(rule.customerPct),
      profitLinkPct: Number(rule.profitLinkPct),
      referralPct: Number(rule.referralPct),
      platformPct: Number(rule.platformPct),
      fixedAmount: rule.fixedAmount != null ? Number(rule.fixedAmount) : null,
      maxCashback: rule.maxCashback != null ? Number(rule.maxCashback) : null,
    };
    validateCommissionRule(ruleInput);
    const split = calculateDistribution({ commissionAmount, rule: ruleInput });

    transaction = await tx.transaction.create({
      data: {
        storeId: click.storeId,
        clickId: click.id,
        campaignId: click.campaignId,
        cashbackRuleId: rule.id,
        cuelinksTransactionId,
        orderId: merchantOrderId,
        saleAmount,
        commissionAmount,
        customerAmount: split.customer,
        profitLinkAmount: split.profitLink,
        referralAmount: split.referral,
        platformAmount: split.platform,
        status: "PENDING",
        rawPostbackPayload: rawPayload as Prisma.InputJsonValue,
        transactionDate: new Date(),
      },
    });

    if (click.userId && Number(transaction.customerAmount) > 0) {
      await creditLedger(tx, {
        walletUserId: click.userId,
        transactionId: transaction.id,
        type: "CASHBACK_PENDING",
        amount: Number(transaction.customerAmount),
        walletDelta: { pendingCashback: Number(transaction.customerAmount) },
      });
    }

    if (status === "PENDING") {
      return { transactionId: transaction.id, processResult: "applied" };
    }
    // Incoming status is already beyond PENDING (e.g. we only ever saw the
    // confirmation, never an explicit pending postback) — fall through to
    // apply that transition immediately using the row just created.
  } else if (transaction.status === status) {
    return { transactionId: transaction.id, processResult: "duplicate" };
  }

  return transitionTransaction(tx, { transaction, click, status });
}

const VALID_FROM_STATUSES: Record<TransactionStatus, TransactionStatus[]> = {
  PENDING: [],
  CONFIRMED: ["PENDING"],
  REJECTED: ["PENDING"],
  CANCELLED: ["PENDING"],
  REVERSED: ["CONFIRMED", "PAID"],
  PAID: ["CONFIRMED"],
};

async function transitionTransaction(
  tx: TxClient,
  params: {
    transaction: Prisma.TransactionGetPayload<Record<string, never>>;
    click: ClickWithProfitLink;
    status: TransactionStatus;
  }
): Promise<{ transactionId: string; processResult: string }> {
  const { transaction, click, status } = params;

  if (!VALID_FROM_STATUSES[status].includes(transaction.status)) {
    // Not a legal transition from the current state — stale/duplicate/
    // out-of-order postback. No-op, never touch a wallet.
    return { transactionId: transaction.id, processResult: "noop_stale_transition" };
  }

  const cas = await tx.transaction.updateMany({
    where: { id: transaction.id, status: transaction.status },
    data: {
      status,
      confirmedAt: status === "CONFIRMED" ? new Date() : undefined,
      reversedAt: status === "REVERSED" ? new Date() : undefined,
    },
  });

  if (cas.count === 0) {
    // Lost the race — another request already transitioned this row.
    return { transactionId: transaction.id, processResult: "noop_stale_transition" };
  }

  const customerAmount = Number(transaction.customerAmount);
  const profitLinkAmount = Number(transaction.profitLinkAmount);

  if (status === "CONFIRMED") {
    if (click.userId && customerAmount > 0) {
      await creditLedger(tx, {
        walletUserId: click.userId,
        transactionId: transaction.id,
        type: "CASHBACK_CONFIRMED",
        amount: customerAmount,
        walletDelta: {
          pendingCashback: -customerAmount,
          confirmedBalance: customerAmount,
          availableBalance: customerAmount,
          lifetimeEarned: customerAmount,
        },
        priorType: "CASHBACK_PENDING",
        priorNewStatus: "COMPLETED",
      });
    }

    if (click.clickType === "PROFIT_LINK" && click.profitLink && profitLinkAmount > 0) {
      await creditLedger(tx, {
        walletUserId: click.profitLink.userId,
        transactionId: transaction.id,
        type: "PROFIT_LINK_EARNING",
        amount: profitLinkAmount,
        walletDelta: {
          confirmedBalance: profitLinkAmount,
          availableBalance: profitLinkAmount,
          lifetimeEarned: profitLinkAmount,
        },
      });
    }

    await applyReferralOnConfirm(tx, { click, transaction });
  }

  if (status === "REJECTED" || status === "CANCELLED") {
    if (click.userId && customerAmount > 0) {
      await creditLedger(tx, {
        walletUserId: click.userId,
        transactionId: transaction.id,
        type: "CASHBACK_REVERSED",
        amount: customerAmount,
        walletDelta: { pendingCashback: -customerAmount },
        priorType: "CASHBACK_PENDING",
        priorNewStatus: "REVERSED",
      });
    }
  }

  if (status === "REVERSED") {
    if (click.userId && customerAmount > 0) {
      await creditLedger(tx, {
        walletUserId: click.userId,
        transactionId: transaction.id,
        type: "CASHBACK_REVERSED",
        amount: customerAmount,
        walletDelta: {
          confirmedBalance: -customerAmount,
          availableBalance: -customerAmount,
          lifetimeEarned: -customerAmount,
        },
        priorType: "CASHBACK_CONFIRMED",
        priorNewStatus: "REVERSED",
      });
    }

    if (click.clickType === "PROFIT_LINK" && click.profitLink && profitLinkAmount > 0) {
      await creditLedger(tx, {
        walletUserId: click.profitLink.userId,
        transactionId: transaction.id,
        type: "PROFIT_LINK_EARNING_REVERSED",
        amount: profitLinkAmount,
        walletDelta: {
          confirmedBalance: -profitLinkAmount,
          availableBalance: -profitLinkAmount,
          lifetimeEarned: -profitLinkAmount,
        },
        priorType: "PROFIT_LINK_EARNING",
        priorNewStatus: "REVERSED",
      });
    }

    const actualReferralAmount = Number(transaction.referralAmount);
    if (click.userId && actualReferralAmount > 0) {
      const referral = await tx.referral.findUnique({ where: { referredUserId: click.userId } });
      if (referral) {
        await creditLedger(tx, {
          walletUserId: referral.referrerId,
          transactionId: transaction.id,
          type: "REFERRAL_EARNING_REVERSED",
          amount: actualReferralAmount,
          walletDelta: {
            confirmedBalance: -actualReferralAmount,
            availableBalance: -actualReferralAmount,
            lifetimeEarned: -actualReferralAmount,
          },
          priorType: "REFERRAL_EARNING",
          priorNewStatus: "REVERSED",
        });
        await tx.referral.update({
          where: { id: referral.id },
          data: { totalEarned: { decrement: actualReferralAmount } },
        });
      }
    }
  }

  return { transactionId: transaction.id, processResult: "applied" };
}

async function applyReferralOnConfirm(
  tx: TxClient,
  params: { click: ClickWithProfitLink; transaction: Prisma.TransactionGetPayload<Record<string, never>> }
): Promise<void> {
  const { click, transaction } = params;

  if (!click.userId) {
    await tx.transaction.update({ where: { id: transaction.id }, data: { referralAmount: 0 } });
    return;
  }

  const referral = await tx.referral.findUnique({ where: { referredUserId: click.userId } });
  if (!referral || referral.status !== "ACTIVE") {
    await tx.transaction.update({ where: { id: transaction.id }, data: { referralAmount: 0 } });
    return;
  }

  const rule = await tx.referralRule.findFirst({ where: { isActive: true } });
  if (!rule) {
    await tx.transaction.update({ where: { id: transaction.id }, data: { referralAmount: 0 } });
    return;
  }

  const evalResult = evaluateReferralEligibility({
    referral: { createdAt: referral.createdAt, totalEarned: Number(referral.totalEarned) },
    rule: {
      durationDays: rule.durationDays,
      maxTotalEarning: rule.maxTotalEarning != null ? Number(rule.maxTotalEarning) : null,
      minOrderValue: rule.minOrderValue != null ? Number(rule.minOrderValue) : null,
      isActive: rule.isActive,
    },
    saleAmount: Number(transaction.saleAmount),
    rawReferralAmount: Number(transaction.referralAmount),
    now: new Date(),
  });

  if (!evalResult.eligible || evalResult.creditedAmount <= 0) {
    await tx.transaction.update({ where: { id: transaction.id }, data: { referralAmount: 0 } });
    return;
  }

  await creditLedger(tx, {
    walletUserId: referral.referrerId,
    transactionId: transaction.id,
    type: "REFERRAL_EARNING",
    amount: evalResult.creditedAmount,
    walletDelta: {
      confirmedBalance: evalResult.creditedAmount,
      availableBalance: evalResult.creditedAmount,
      lifetimeEarned: evalResult.creditedAmount,
    },
  });
  await tx.referral.update({
    where: { id: referral.id },
    data: { totalEarned: { increment: evalResult.creditedAmount } },
  });
  // Snapshot the actually-credited (post-eligibility-clip) amount so a later
  // reversal subtracts exactly this, never a re-derived number.
  await tx.transaction.update({
    where: { id: transaction.id },
    data: { referralAmount: evalResult.creditedAmount },
  });
}

interface CreditLedgerParams {
  walletUserId: string;
  transactionId: string;
  type: WalletTxType;
  amount: number;
  walletDelta: Partial<
    Record<"pendingCashback" | "confirmedBalance" | "availableBalance" | "lifetimeEarned", number>
  >;
  priorType?: WalletTxType;
  priorNewStatus?: "COMPLETED" | "REVERSED";
}

async function creditLedger(tx: TxClient, params: CreditLedgerParams): Promise<void> {
  const wallet = await tx.wallet.findUnique({ where: { userId: params.walletUserId } });
  if (!wallet) {
    throw new Error(`No wallet found for user ${params.walletUserId}`);
  }

  try {
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        userId: params.walletUserId,
        type: params.type,
        amount: params.amount,
        source: "cuelinks_postback",
        sourceTransactionId: params.transactionId,
        status: "COMPLETED",
      },
    });
  } catch (e) {
    if (isUniqueConstraintError(e)) {
      // Already applied by an earlier/concurrent postback for this exact
      // (transaction, user, event type) — no-op, never double-credit.
      return;
    }
    throw e;
  }

  const data: Prisma.WalletUpdateInput = {};
  if (params.walletDelta.pendingCashback) data.pendingCashback = { increment: params.walletDelta.pendingCashback };
  if (params.walletDelta.confirmedBalance) data.confirmedBalance = { increment: params.walletDelta.confirmedBalance };
  if (params.walletDelta.availableBalance) data.availableBalance = { increment: params.walletDelta.availableBalance };
  if (params.walletDelta.lifetimeEarned) data.lifetimeEarned = { increment: params.walletDelta.lifetimeEarned };
  if (Object.keys(data).length > 0) {
    await tx.wallet.update({ where: { userId: params.walletUserId }, data });
  }

  if (params.priorType && params.priorNewStatus) {
    await tx.walletTransaction.updateMany({
      where: { sourceTransactionId: params.transactionId, userId: params.walletUserId, type: params.priorType },
      data: { status: params.priorNewStatus },
    });
  }
}
