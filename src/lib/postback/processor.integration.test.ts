import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { resetTestDb, testPrisma as prisma } from "../../../tests/helpers/db";
import { processCuelinksPostback } from "./processor";

const TEST_SECRET = "integration-test-secret";
process.env.CUELINKS_POSTBACK_SECRET = TEST_SECRET;

let storeId: string;

// Each test gets its own fresh category (never cached across tests) since
// resetTestDb() truncates store_categories in beforeEach — a cached id from
// a prior test would otherwise point at an already-deleted row.
async function createStore(rule: {
  customerPct: number;
  profitLinkPct: number;
  referralPct: number;
  platformPct: number;
}) {
  const category = await prisma.storeCategory.create({
    data: { name: "Test Category", slug: `test-cat-${Date.now()}-${Math.random()}` },
  });

  const store = await prisma.store.create({
    data: {
      name: "Test Store",
      slug: `test-store-${Date.now()}-${Math.random()}`,
      logoUrl: "/logos/test.svg",
      categoryId: category.id,
      cashbackRate: 10,
      cashbackDisplayText: "Up to 10% Cashback",
    },
  });
  storeId = store.id;

  await prisma.cashbackRule.create({
    data: {
      storeId,
      customerPct: rule.customerPct,
      profitLinkPct: rule.profitLinkPct,
      referralPct: rule.referralPct,
      platformPct: rule.platformPct,
    },
  });

  return store;
}

async function createUserWithWallet(emailPrefix: string) {
  const user = await prisma.user.create({
    data: {
      email: `${emailPrefix}-${Date.now()}-${Math.random()}@example.com`,
      passwordHash: "x",
      name: emailPrefix,
      referralCode: `${emailPrefix}${Math.floor(Math.random() * 10000)}`.slice(0, 10).toUpperCase(),
      userCode: `${emailPrefix}${Math.floor(Math.random() * 1000000)}`.slice(0, 12).toLowerCase(),
    },
  });
  const wallet = await prisma.wallet.create({ data: { userId: user.id } });
  return { user, wallet };
}

/**
 * A profit-link click with no signed-in buyer — the guest case the
 * profitLinkGuestCashback setting governs.
 */
async function createGuestProfitLinkClick(creatorId: string) {
  const profitLink = await prisma.profitLink.create({
    data: {
      code: `pl${Math.floor(Math.random() * 100000)}`,
      userId: creatorId,
      storeId,
      originalUrl: "https://example.com/product",
      destinationUrl: "https://example.com/product",
    },
  });

  return prisma.click.create({
    data: {
      userId: null,
      storeId,
      clickType: "PROFIT_LINK",
      profitLinkId: profitLink.id,
      originalUrl: "https://example.com/product",
      trackingUrl: "https://stub.cuelinks.local/track",
    },
  });
}

async function setGuestCashbackDestination(value: "SHARER" | "PLATFORM") {
  await prisma.setting.upsert({
    where: { key: "profit_link_guest_cashback" },
    update: { value },
    create: { key: "profit_link_guest_cashback", value },
  });
}

function basePayload(overrides: Record<string, string | undefined>) {
  return {
    token: TEST_SECRET,
    status: "validated",
    commission_amount: "100",
    transaction_amount: "1000",
    merchant_transaction_id: `order-${Date.now()}-${Math.random()}`,
    ...overrides,
  };
}

describe("processCuelinksPostback (integration)", () => {
  beforeEach(async () => {
    await resetTestDb();
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("rejects a postback with the wrong token", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const result = await processCuelinksPostback(basePayload({ token: "wrong-secret", click_id: "c_nonexistent" }));
    expect(result.httpStatus).toBe(401);
  });

  it("credits only the buyer's wallet for a direct-cashback confirmation, never anyone else's", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: buyer, wallet: buyerWallet } = await createUserWithWallet("buyer");
    const { wallet: strangerWallet } = await createUserWithWallet("stranger");

    const click = await prisma.click.create({
      data: {
        userId: buyer.id,
        storeId,
        clickType: "DIRECT_CASHBACK",
        originalUrl: "https://example.com",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    const result = await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));
    expect(result.body.status).toBe("applied");

    const updatedBuyerWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } });
    expect(Number(updatedBuyerWallet.confirmedBalance)).toBe(60); // 60% of 100 commission

    const updatedStrangerWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: strangerWallet.id } });
    expect(Number(updatedStrangerWallet.confirmedBalance)).toBe(0);
  });

  it("credits only the profit-link creator, never the clicker", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: creator, wallet: creatorWallet } = await createUserWithWallet("creator");
    const { user: clicker, wallet: clickerWallet } = await createUserWithWallet("clicker");

    const profitLink = await prisma.profitLink.create({
      data: {
        code: `pl${Math.floor(Math.random() * 100000)}`,
        userId: creator.id,
        storeId,
        originalUrl: "https://example.com/product",
        destinationUrl: "https://example.com/product",
      },
    });

    const click = await prisma.click.create({
      data: {
        userId: clicker.id,
        storeId,
        clickType: "PROFIT_LINK",
        profitLinkId: profitLink.id,
        originalUrl: "https://example.com/product",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    const result = await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));
    expect(result.body.status).toBe("applied");

    const updatedCreatorWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } });
    expect(Number(updatedCreatorWallet.confirmedBalance)).toBe(15); // 15% profit-link share

    const updatedClickerWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: clickerWallet.id } });
    // Clicker also gets buyer-side cashback since they were logged in when they clicked —
    // but the profit-link earning itself must never land here.
    expect(Number(updatedClickerWallet.confirmedBalance)).toBe(60);
  });

  it("credits the referrer only when an active, eligible Referral exists", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    await prisma.referralRule.create({ data: { durationDays: 90, isActive: true } });
    const { user: referrer, wallet: referrerWallet } = await createUserWithWallet("referrer");
    const { user: referred, wallet: referredWallet } = await createUserWithWallet("referred");

    await prisma.referral.create({
      data: { referrerId: referrer.id, referredUserId: referred.id, code: referrer.referralCode },
    });

    const click = await prisma.click.create({
      data: {
        userId: referred.id,
        storeId,
        clickType: "DIRECT_CASHBACK",
        originalUrl: "https://example.com",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));

    const updatedReferrerWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: referrerWallet.id } });
    expect(Number(updatedReferrerWallet.confirmedBalance)).toBe(5); // 5% referral share

    const updatedReferredWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: referredWallet.id } });
    expect(Number(updatedReferredWallet.confirmedBalance)).toBe(60); // buyer's own cashback, unaffected
  });

  it("does not credit a referrer once the referral is past its eligibility window", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    await prisma.referralRule.create({ data: { durationDays: 30, isActive: true } });
    const { wallet: referrerWallet, user: referrer } = await createUserWithWallet("referrer2");
    const { user: referred } = await createUserWithWallet("referred2");

    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    await prisma.referral.create({
      data: {
        referrerId: referrer.id,
        referredUserId: referred.id,
        code: referrer.referralCode,
        createdAt: oldDate,
      },
    });

    const click = await prisma.click.create({
      data: {
        userId: referred.id,
        storeId,
        clickType: "DIRECT_CASHBACK",
        originalUrl: "https://example.com",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));

    const updatedReferrerWallet = await prisma.wallet.findUniqueOrThrow({ where: { id: referrerWallet.id } });
    expect(Number(updatedReferrerWallet.confirmedBalance)).toBe(0);
  });

  it("is idempotent: the identical postback sent twice credits the wallet only once", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: buyer, wallet: buyerWallet } = await createUserWithWallet("dup-buyer");

    const click = await prisma.click.create({
      data: {
        userId: buyer.id,
        storeId,
        clickType: "DIRECT_CASHBACK",
        originalUrl: "https://example.com",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    const payload = basePayload({ click_id: `c_${click.id}` });

    const first = await processCuelinksPostback(payload);
    const second = await processCuelinksPostback(payload);

    expect(first.body.status).toBe("applied");
    expect(second.body.status).toBe("duplicate");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } });
    expect(Number(wallet.confirmedBalance)).toBe(60); // credited exactly once, not 120

    const ledgerRows = await prisma.walletTransaction.count({
      where: { userId: buyer.id, type: "CASHBACK_CONFIRMED" },
    });
    expect(ledgerRows).toBe(1);
  });

  it("reverses exactly the snapshotted amount, not a recomputed one", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: buyer, wallet: buyerWallet } = await createUserWithWallet("rev-buyer");

    const click = await prisma.click.create({
      data: {
        userId: buyer.id,
        storeId,
        clickType: "DIRECT_CASHBACK",
        originalUrl: "https://example.com",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    const merchantTransactionId = `order-rev-${Date.now()}`;
    await processCuelinksPostback(
      basePayload({ click_id: `c_${click.id}`, merchant_transaction_id: merchantTransactionId, status: "validated" })
    );

    let wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } });
    expect(Number(wallet.confirmedBalance)).toBe(60);

    // Reversal postback reports a DIFFERENT commission_amount — the processor
    // must ignore that and reverse the originally snapshotted 60, not
    // recompute from this payload's numbers.
    const reversal = await processCuelinksPostback(
      basePayload({
        click_id: `c_${click.id}`,
        merchant_transaction_id: merchantTransactionId,
        status: "reversed",
        commission_amount: "999",
      })
    );
    expect(reversal.body.status).toBe("applied");

    wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } });
    expect(Number(wallet.confirmedBalance)).toBe(0);
    expect(Number(wallet.availableBalance)).toBe(0);
    expect(Number(wallet.lifetimeEarned)).toBe(0);
  });

  it("pays a guest profit-link sale's unclaimed cashback share to the sharer", async () => {
    // Nobody bought as a member, so the customer share has no shopper to go to.
    // The default setting hands it to the person whose link produced the sale.
    await setGuestCashbackDestination("SHARER");
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: creator, wallet: creatorWallet } = await createUserWithWallet("creator");

    const click = await createGuestProfitLinkClick(creator.id);

    const result = await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));
    expect(result.body.status).toBe("applied");

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } });
    // 15% profit-link share + the 60% nobody claimed.
    expect(Number(wallet.confirmedBalance)).toBe(75);

    // The stored split must say the same thing the wallet does, so reports and
    // reversals agree with what was actually paid.
    const tx = await prisma.transaction.findFirstOrThrow({ where: { clickId: click.id } });
    expect(Number(tx.profitLinkAmount)).toBe(75);
    expect(Number(tx.customerAmount)).toBe(0);
    expect(Number(tx.platformAmount)).toBe(20);
  });

  it("keeps the unclaimed share as platform margin when configured to", async () => {
    await setGuestCashbackDestination("PLATFORM");
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: creator, wallet: creatorWallet } = await createUserWithWallet("creator");

    const click = await createGuestProfitLinkClick(creator.id);
    await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));

    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } });
    expect(Number(wallet.confirmedBalance)).toBe(15);

    const tx = await prisma.transaction.findFirstOrThrow({ where: { clickId: click.id } });
    expect(Number(tx.customerAmount)).toBe(0);
    // The 60% is attributed to the platform rather than left showing as a
    // customer amount that was never paid.
    expect(Number(tx.platformAmount)).toBe(80);
  });

  it("leaves a signed-in buyer's cashback alone on a profit-link sale", async () => {
    // The setting only governs the guest case: there is a shopper here, so they
    // get their cashback and the sharer gets only the profit-link share.
    await setGuestCashbackDestination("SHARER");
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: creator, wallet: creatorWallet } = await createUserWithWallet("creator");
    const { user: buyer, wallet: buyerWallet } = await createUserWithWallet("buyer");

    const profitLink = await prisma.profitLink.create({
      data: {
        code: `pl${Math.floor(Math.random() * 100000)}`,
        userId: creator.id,
        storeId,
        originalUrl: "https://example.com/product",
        destinationUrl: "https://example.com/product",
      },
    });
    const click = await prisma.click.create({
      data: {
        userId: buyer.id,
        storeId,
        clickType: "PROFIT_LINK",
        profitLinkId: profitLink.id,
        originalUrl: "https://example.com/product",
        trackingUrl: "https://stub.cuelinks.local/track",
      },
    });

    await processCuelinksPostback(basePayload({ click_id: `c_${click.id}` }));

    expect(
      Number((await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } })).confirmedBalance)
    ).toBe(15);
    expect(
      Number((await prisma.wallet.findUniqueOrThrow({ where: { id: buyerWallet.id } })).confirmedBalance)
    ).toBe(60);
  });

  it("reverses the sharer's combined guest-sale earning in full", async () => {
    await setGuestCashbackDestination("SHARER");
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const { user: creator, wallet: creatorWallet } = await createUserWithWallet("creator");

    const click = await createGuestProfitLinkClick(creator.id);
    const orderId = `order-${Date.now()}-${Math.random()}`;

    await processCuelinksPostback(
      basePayload({ click_id: `c_${click.id}`, merchant_transaction_id: orderId })
    );
    expect(
      Number((await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } })).confirmedBalance)
    ).toBe(75);

    await processCuelinksPostback(
      basePayload({ click_id: `c_${click.id}`, merchant_transaction_id: orderId, status: "reversed" })
    );

    // All 75 comes back, not just the 15 the profit-link share would have been.
    const wallet = await prisma.wallet.findUniqueOrThrow({ where: { id: creatorWallet.id } });
    expect(Number(wallet.confirmedBalance)).toBe(0);
    expect(Number(wallet.availableBalance)).toBe(0);
    expect(Number(wallet.lifetimeEarned)).toBe(0);
  });

  it("records an audit row for an unmatched click id", async () => {
    await createStore({ customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 });
    const result = await processCuelinksPostback(basePayload({ click_id: "c_does-not-exist" }));
    expect(result.body.status).toBe("unmatched_click");

    const postbacks = await prisma.cuelinksPostback.findMany({ where: { processResult: "unmatched_click" } });
    expect(postbacks.length).toBe(1);
  });
});
