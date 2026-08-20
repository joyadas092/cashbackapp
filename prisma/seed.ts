import { PrismaClient, CashbackType } from "@prisma/client";
import bcrypt from "bcryptjs";
import { publicLogoUrl } from "../src/lib/logo";

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: "Fashion", slug: "fashion", icon: "shirt" },
  { name: "Electronics", slug: "electronics", icon: "cpu" },
  { name: "Travel", slug: "travel", icon: "plane" },
  { name: "Food", slug: "food", icon: "utensils" },
  { name: "Beauty", slug: "beauty", icon: "sparkles" },
];

/**
 * Store-page content. Cuelinks gives one flat payout per campaign and no
 * category breakdown, coupons or payout timelines, so this is seeded here and
 * maintained afterwards in Admin -> Stores -> Page Content.
 */
interface StorePageContent {
  tagline: string;
  previousRate?: number;
  visitTime: string;
  trackingTime: string;
  paymentTime: string;
  description: string;
  rates: Array<{ label: string; displayText: string }>;
  offers: Array<{
    badge?: string;
    title: string;
    description?: string;
    code?: string;
    validTill?: string; // yyyy-mm-dd
  }>;
  tips: string[];
}

const STORES: Array<{
  name: string;
  slug: string;
  categorySlug: string;
  cashbackRate: number;
  cashbackDisplayText: string;
  rule: { customerPct: number; profitLinkPct: number; referralPct: number; platformPct: number };
  featured?: boolean;
  domains: string[];
  page?: StorePageContent;
}> = [
  {
    name: "Flipkart",
    slug: "flipkart",
    categorySlug: "electronics",
    cashbackRate: 8,
    cashbackDisplayText: "Up to 8% Cashback",
    rule: { customerPct: 70, profitLinkPct: 10, referralPct: 5, platformPct: 15 },
    featured: true,
    domains: ["flipkart.com", "www.flipkart.com", "dl.flipkart.com"],
    page: {
      tagline:
        "India's leading online shopping destination for mobiles, electronics, fashion, home & more.",
      previousRate: 6,
      visitTime: "7 Days",
      trackingTime: "24 - 48 Hours",
      paymentTime: "60 - 90 Days",
      description:
        "Flipkart is one of India's largest e-commerce platforms offering a wide range of products across categories. Shop your favorite products and earn exciting cashback on every purchase through CashbackApp.",
      rates: [
        { label: "Mobiles & Tablets", displayText: "Up to 8%" },
        { label: "Electronics", displayText: "Up to 6%" },
        { label: "Fashion", displayText: "Up to 8%" },
        { label: "Home & Furniture", displayText: "Up to 5%" },
        { label: "Beauty & Personal Care", displayText: "Up to 6%" },
        { label: "Appliances", displayText: "Up to 6%" },
        { label: "Others", displayText: "Up to 4%" },
      ],
      offers: [
        {
          badge: "EXTRA",
          title: "Extra 2% Cashback",
          description: "On all prepaid orders",
          code: "GET2",
          validTill: "2026-12-31",
        },
        {
          badge: "EXTRA",
          title: "Extra ₹100 Rewards",
          description: "On orders above ₹1500",
          code: "SAVE100",
          validTill: "2026-12-31",
        },
        {
          badge: "EXTRA",
          title: "5% Off on SuperCoins",
          description: "Use SuperCoins & Save More",
          code: "COINS5",
          validTill: "2026-12-31",
        },
      ],
      tips: [
        "Click on Earn Cashback and complete your purchase in the same session.",
        "Do not use any other coupon code except the ones listed here.",
        "Returns & cancellations are not eligible for cashback.",
        "Cashback is not applicable on Flipkart Gift Cards.",
      ],
    },
  },
  {
    name: "Amazon",
    slug: "amazon",
    categorySlug: "electronics",
    cashbackRate: 5,
    cashbackDisplayText: "Up to 5% Cashback",
    rule: { customerPct: 65, profitLinkPct: 15, referralPct: 5, platformPct: 15 },
    featured: true,
    domains: ["amazon.in", "www.amazon.in"],
  },
  {
    name: "Myntra",
    slug: "myntra",
    categorySlug: "fashion",
    cashbackRate: 10,
    cashbackDisplayText: "Up to 10% Cashback",
    rule: { customerPct: 60, profitLinkPct: 20, referralPct: 5, platformPct: 15 },
    featured: true,
    domains: ["myntra.com", "www.myntra.com"],
  },
  {
    name: "AJIO",
    slug: "ajio",
    categorySlug: "fashion",
    cashbackRate: 9,
    cashbackDisplayText: "Up to 9% Cashback",
    rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 },
    domains: ["ajio.com", "www.ajio.com"],
  },
  {
    name: "Nykaa",
    slug: "nykaa",
    categorySlug: "beauty",
    cashbackRate: 7,
    cashbackDisplayText: "Up to 7% Cashback",
    rule: { customerPct: 55, profitLinkPct: 20, referralPct: 10, platformPct: 15 },
    domains: ["nykaa.com", "www.nykaa.com"],
  },
  {
    name: "Tata CLiQ",
    slug: "tata-cliq",
    categorySlug: "fashion",
    cashbackRate: 6,
    cashbackDisplayText: "Up to 6% Cashback",
    rule: { customerPct: 60, profitLinkPct: 15, referralPct: 5, platformPct: 20 },
    domains: ["tatacliq.com", "www.tatacliq.com"],
  },
  {
    name: "MakeMyTrip",
    slug: "makemytrip",
    categorySlug: "travel",
    cashbackRate: 4,
    cashbackDisplayText: "Up to 4% Cashback",
    rule: { customerPct: 50, profitLinkPct: 25, referralPct: 10, platformPct: 15 },
    domains: ["makemytrip.com", "www.makemytrip.com"],
  },
  {
    name: "Booking.com",
    slug: "booking-com",
    categorySlug: "travel",
    cashbackRate: 3,
    cashbackDisplayText: "Up to 3% Cashback",
    rule: { customerPct: 50, profitLinkPct: 20, referralPct: 10, platformPct: 20 },
    domains: ["booking.com", "www.booking.com"],
  },
  {
    name: "Swiggy",
    slug: "swiggy",
    categorySlug: "food",
    cashbackRate: 5,
    cashbackDisplayText: "Up to 5% Cashback",
    rule: { customerPct: 40, profitLinkPct: 30, referralPct: 10, platformPct: 20 },
    domains: ["swiggy.com", "www.swiggy.com"],
  },
  {
    name: "Goibibo",
    slug: "goibibo",
    categorySlug: "travel",
    cashbackRate: 4,
    cashbackDisplayText: "Up to 4% Cashback",
    rule: { customerPct: 55, profitLinkPct: 20, referralPct: 5, platformPct: 20 },
    domains: ["goibibo.com", "www.goibibo.com"],
  },
];

/**
 * Every store page uses the same layout, so every store needs the same content
 * blocks. Stores without hand-written copy get a set derived from their own
 * headline rate — the top category matches the headline and the rest step down,
 * which is how these tables actually read on cashback sites.
 */
function defaultPageContent(store: {
  name: string;
  cashbackRate: number;
  categorySlug: string;
}): StorePageContent {
  const top = store.cashbackRate;
  const step = (n: number) => `Up to ${Math.max(1, Math.round(top - n))}%`;

  const byCategory: Record<string, string[]> = {
    electronics: ["Mobiles & Tablets", "Electronics", "Appliances", "Accessories"],
    fashion: ["Men's Fashion", "Women's Fashion", "Footwear", "Accessories"],
    travel: ["Flights", "Hotels", "Bus & Trains", "Holiday Packages"],
    food: ["Restaurant Orders", "Groceries", "Beverages", "Desserts"],
    beauty: ["Skincare", "Makeup", "Fragrances", "Personal Care"],
  };
  const labels = byCategory[store.categorySlug] ?? ["Popular Categories", "New Arrivals", "Sale"];

  return {
    tagline: `Shop at ${store.name} through CashbackApp and earn cashback on every eligible order.`,
    visitTime: "7 Days",
    trackingTime: "24 - 48 Hours",
    paymentTime: "60 - 90 Days",
    description: `${store.name} is one of our partner stores. Shop your favourite products and earn cashback on every eligible purchase made through CashbackApp.`,
    rates: [
      ...labels.map((label, i) => ({ label, displayText: step(i) })),
      { label: "Others", displayText: step(labels.length) },
    ],
    offers: [],
    tips: [
      "Click on Earn Cashback and complete your purchase in the same session.",
      "Do not use any other coupon code except the ones listed here.",
      "Returns & cancellations are not eligible for cashback.",
      `Cashback is not applicable on ${store.name} Gift Cards.`,
    ],
  };
}

/**
 * Demo referrals for the Refer & Earn page, so it renders with all three states
 * (active / pending / inactive) rather than an empty table.
 *
 * Everything is derived from real rows — the friends are real users with real
 * wallets, the order counts come from real Click + Transaction rows, and the
 * referrer's earnings are real wallet ledger entries. Nothing on the page reads
 * from a hardcoded number.
 */
async function seedReferralDemo(referrerId: string) {
  console.log("Seeding demo referrals...");

  // `earningStatus` drives the referrer's ledger row: COMPLETED counts toward
  // Total Earnings, PENDING toward Pending Earnings. Both are represented so
  // neither KPI reads zero on a fresh install.
  const FRIENDS = [
    { name: "Ananya Singh", email: "ananya.demo@example.com", daysAgo: 96, orders: 3, cashback: 1245.5, earned: 62.28, status: "ACTIVE" as const, earningStatus: "COMPLETED" as const },
    { name: "Rahul Verma", email: "rahul.demo@example.com", daysAgo: 74, orders: 1, cashback: 750, earned: 37.5, status: "ACTIVE" as const, earningStatus: "COMPLETED" as const },
    { name: "Neha Sharma", email: "neha.demo@example.com", daysAgo: 41, orders: 0, cashback: 0, earned: 0, status: "ACTIVE" as const, earningStatus: "COMPLETED" as const },
    { name: "Amit Kumar", email: "amit.demo@example.com", daysAgo: 18, orders: 2, cashback: 890.3, earned: 44.51, status: "ACTIVE" as const, earningStatus: "PENDING" as const },
    { name: "Priya Patel", email: "priya.demo@example.com", daysAgo: 6, orders: 0, cashback: 0, earned: 0, status: "EXPIRED" as const, earningStatus: "COMPLETED" as const },
  ];

  const referrer = await prisma.user.findUnique({
    where: { id: referrerId },
    select: { referralCode: true },
  });
  if (!referrer) return;

  const store = await prisma.store.findFirst({ where: { slug: "flipkart" } });
  const wallet = await prisma.wallet.findUnique({ where: { userId: referrerId } });
  if (!store || !wallet) return;

  const friendPasswordHash = await bcrypt.hash("Friend@12345", 10);

  for (const friend of FRIENDS) {
    const joinedAt = new Date(Date.now() - friend.daysAgo * 24 * 60 * 60 * 1000);

    const user = await prisma.user.upsert({
      where: { email: friend.email },
      update: {},
      create: {
        email: friend.email,
        passwordHash: friendPasswordHash,
        name: friend.name,
        role: "USER",
        referralCode: referralCode(friend.email),
        createdAt: joinedAt,
      },
    });

    await prisma.wallet.upsert({
      where: { userId: user.id },
      update: { lifetimeEarned: friend.cashback },
      create: { userId: user.id, lifetimeEarned: friend.cashback },
    });

    await prisma.referral.upsert({
      where: { referredUserId: user.id },
      update: { totalEarned: friend.earned, status: friend.status },
      create: {
        referrerId,
        referredUserId: user.id,
        code: referrer.referralCode,
        status: friend.status,
        totalEarned: friend.earned,
        createdAt: joinedAt,
      },
    });

    // Orders: one Click + Transaction pair each, so the page's order counts come
    // from the same tables a real order would land in.
    for (let i = 0; i < friend.orders; i++) {
      const externalId = `seed_${user.id}_${i}`;
      const existing = await prisma.transaction.findUnique({
        where: {
          storeId_cuelinksTransactionId: {
            storeId: store.id,
            cuelinksTransactionId: externalId,
          },
        },
      });
      if (existing) continue;

      const click = await prisma.click.create({
        data: {
          userId: user.id,
          storeId: store.id,
          clickType: "DIRECT_CASHBACK",
          originalUrl: `https://www.flipkart.com/demo-order-${i}`,
          trackingUrl: `https://linksredirect.com/?demo=${i}`,
          createdAt: joinedAt,
        },
      });

      await prisma.transaction.create({
        data: {
          storeId: store.id,
          clickId: click.id,
          cuelinksTransactionId: externalId,
          saleAmount: 2500,
          commissionAmount: 150,
          customerAmount: 105,
          referralAmount: 7.5,
          platformAmount: 22.5,
          status: "CONFIRMED",
          transactionDate: joinedAt,
          confirmedAt: joinedAt,
          createdAt: joinedAt,
        },
      });
    }

    // The referrer's own ledger entries for this friend's activity.
    if (friend.earned > 0) {
      await prisma.walletTransaction.upsert({
        where: {
          wallet_tx_dedupe: {
            sourceTransactionId: `seed_referral_${user.id}`,
            userId: referrerId,
            type: "REFERRAL_EARNING",
          },
        },
        update: { amount: friend.earned, status: friend.earningStatus },
        create: {
          walletId: wallet.id,
          userId: referrerId,
          type: "REFERRAL_EARNING",
          amount: friend.earned,
          status: friend.earningStatus,
          source: "referral",
          sourceTransactionId: `seed_referral_${user.id}`,
          description: `Referral earning from ${friend.name}`,
          createdAt: joinedAt,
        },
      });
    }
  }

  // Keep the wallet's cached aggregate consistent with the ledger rows above.
  const confirmed = await prisma.walletTransaction.aggregate({
    where: { userId: referrerId, type: "REFERRAL_EARNING", status: "COMPLETED" },
    _sum: { amount: true },
  });
  await prisma.wallet.update({
    where: { userId: referrerId },
    data: {
      availableBalance: confirmed._sum.amount ?? 0,
      confirmedBalance: confirmed._sum.amount ?? 0,
      lifetimeEarned: confirmed._sum.amount ?? 0,
    },
  });
}

/**
 * Demo data for the My Activity and Wallet pages, covering all three ways this
 * app pays out: the user's own shopping, clicks on a profit link they shared,
 * and a bonus adjustment. Referral activity is seeded separately.
 *
 * Written through the same tables the real flows use — Click, Transaction and
 * WalletTransaction — so every figure on those pages is computed, not stubbed.
 */
async function seedActivityDemo(userId: string) {
  console.log("Seeding demo activity...");

  const wallet = await prisma.wallet.findUnique({ where: { userId } });
  if (!wallet) return;

  const stores = await prisma.store.findMany({
    where: { slug: { in: ["amazon", "flipkart", "myntra", "ajio", "nykaa"] } },
    select: { id: true, slug: true, name: true },
  });
  if (stores.length === 0) return;

  const daysAgo = (n: number) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

  // --- The user's own shopping ---------------------------------------------
  const OWN_ORDERS = [
    { storeSlug: "amazon", days: 1, sale: 2499, commission: 125, customer: 74.97 },
    { storeSlug: "flipkart", days: 2, sale: 1299, commission: 78, customer: 51.96 },
    { storeSlug: "myntra", days: 4, sale: 1899, commission: 152, customer: 94.95 },
    { storeSlug: "ajio", days: 6, sale: 1499, commission: 120, customer: 74.95, pending: true },
    { storeSlug: "nykaa", days: 9, sale: 899, commission: 72, customer: 44.95 },
  ];

  for (const [i, order] of OWN_ORDERS.entries()) {
    const store = stores.find((s) => s.slug === order.storeSlug);
    if (!store) continue;

    const externalId = `seed_own_${userId}_${i}`;
    const already = await prisma.transaction.findUnique({
      where: {
        storeId_cuelinksTransactionId: { storeId: store.id, cuelinksTransactionId: externalId },
      },
    });
    if (already) continue;

    const at = daysAgo(order.days);
    const click = await prisma.click.create({
      data: {
        userId,
        storeId: store.id,
        clickType: "DIRECT_CASHBACK",
        originalUrl: `https://www.${order.storeSlug}.com/demo-${i}`,
        trackingUrl: `https://linksredirect.com/?demo_own=${i}`,
        createdAt: at,
      },
    });

    await prisma.transaction.create({
      data: {
        storeId: store.id,
        clickId: click.id,
        cuelinksTransactionId: externalId,
        orderId: `ORD-${store.slug.toUpperCase()}-${100000 + i}`,
        saleAmount: order.sale,
        commissionAmount: order.commission,
        customerAmount: order.customer,
        platformAmount: order.commission - order.customer,
        status: order.pending ? "PENDING" : "CONFIRMED",
        transactionDate: at,
        confirmedAt: order.pending ? null : at,
        createdAt: at,
      },
    });

    await prisma.walletTransaction.upsert({
      where: {
        wallet_tx_dedupe: {
          sourceTransactionId: externalId,
          userId,
          type: order.pending ? "CASHBACK_PENDING" : "CASHBACK_CONFIRMED",
        },
      },
      update: {},
      create: {
        walletId: wallet.id,
        userId,
        type: order.pending ? "CASHBACK_PENDING" : "CASHBACK_CONFIRMED",
        amount: order.customer,
        status: order.pending ? "PENDING" : "COMPLETED",
        source: "cashback",
        sourceTransactionId: externalId,
        description: `Cashback from ${store.name}`,
        createdAt: at,
      },
    });
  }

  // --- A profit link the user shared, and purchases through it -------------
  const linkStore = stores.find((s) => s.slug === "myntra") ?? stores[0];
  const profitLink = await prisma.profitLink.upsert({
    where: { code: "DEMOLINK" },
    update: {},
    create: {
      code: "DEMOLINK",
      userId,
      storeId: linkStore.id,
      originalUrl: `https://www.${linkStore.slug}.com/demo-product/12345`,
      destinationUrl: `https://www.${linkStore.slug}.com/demo-product/12345`,
      createdAt: daysAgo(12),
    },
  });

  const AFFILIATE_ORDERS = [
    { days: 3, sale: 3200, commission: 256, profit: 51.2, converted: true },
    { days: 5, sale: 1750, commission: 140, profit: 28, converted: true },
    { days: 7, sale: 0, commission: 0, profit: 0, converted: false }, // click only
    { days: 8, sale: 0, commission: 0, profit: 0, converted: false },
  ];

  for (const [i, order] of AFFILIATE_ORDERS.entries()) {
    const externalId = `seed_pl_${userId}_${i}`;
    const already = await prisma.transaction.findUnique({
      where: {
        storeId_cuelinksTransactionId: {
          storeId: linkStore.id,
          cuelinksTransactionId: externalId,
        },
      },
    });
    if (already) continue;

    const at = daysAgo(order.days);
    // Deliberately no userId: these are clicks by other people on a shared link.
    const click = await prisma.click.create({
      data: {
        storeId: linkStore.id,
        clickType: "PROFIT_LINK",
        profitLinkId: profitLink.id,
        originalUrl: profitLink.originalUrl,
        trackingUrl: `https://linksredirect.com/?demo_pl=${i}`,
        createdAt: at,
      },
    });

    if (!order.converted) continue;

    await prisma.transaction.create({
      data: {
        storeId: linkStore.id,
        clickId: click.id,
        cuelinksTransactionId: externalId,
        orderId: `ORD-PL-${200000 + i}`,
        saleAmount: order.sale,
        commissionAmount: order.commission,
        profitLinkAmount: order.profit,
        platformAmount: order.commission - order.profit,
        status: "CONFIRMED",
        transactionDate: at,
        confirmedAt: at,
        createdAt: at,
      },
    });

    await prisma.walletTransaction.upsert({
      where: {
        wallet_tx_dedupe: {
          sourceTransactionId: externalId,
          userId,
          type: "PROFIT_LINK_EARNING",
        },
      },
      update: {},
      create: {
        walletId: wallet.id,
        userId,
        type: "PROFIT_LINK_EARNING",
        amount: order.profit,
        status: "COMPLETED",
        source: "profit_link",
        sourceTransactionId: externalId,
        description: `Profit link earning — ${linkStore.name}`,
        createdAt: at,
      },
    });
  }

  await prisma.profitLink.update({
    where: { id: profitLink.id },
    data: { clickCount: AFFILIATE_ORDERS.length },
  });

  // --- A welcome bonus, so the Bonuses tab isn't empty ----------------------
  await prisma.walletTransaction.upsert({
    where: {
      wallet_tx_dedupe: {
        sourceTransactionId: `seed_bonus_${userId}`,
        userId,
        type: "ADJUSTMENT",
      },
    },
    update: {},
    create: {
      walletId: wallet.id,
      userId,
      type: "ADJUSTMENT",
      amount: 50,
      status: "COMPLETED",
      source: "bonus",
      sourceTransactionId: `seed_bonus_${userId}`,
      description: "Welcome bonus",
      createdAt: daysAgo(14),
    },
  });

  // --- Rebuild the wallet's cached aggregates from the ledger ---------------
  // These columns are a cache of the rows above; recomputing beats hand-setting
  // numbers that would drift from what the ledger actually says.
  const [confirmed, pending, withdrawals, reversals] = await Promise.all([
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        status: "COMPLETED",
        type: { in: ["CASHBACK_CONFIRMED", "PROFIT_LINK_EARNING", "REFERRAL_EARNING", "ADJUSTMENT"] },
      },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, status: "PENDING", type: "CASHBACK_PENDING" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: { userId, type: "WITHDRAWAL", status: "COMPLETED" },
      _sum: { amount: true },
    }),
    prisma.walletTransaction.aggregate({
      where: {
        userId,
        type: {
          in: ["CASHBACK_REVERSED", "PROFIT_LINK_EARNING_REVERSED", "REFERRAL_EARNING_REVERSED"],
        },
      },
      _sum: { amount: true },
    }),
  ]);

  const earned = Number(confirmed._sum.amount ?? 0) - Number(reversals._sum.amount ?? 0);
  const paidOut = Number(withdrawals._sum.amount ?? 0);

  await prisma.wallet.update({
    where: { userId },
    data: {
      lifetimeEarned: earned,
      confirmedBalance: earned,
      availableBalance: earned - paidOut,
      withdrawn: paidOut,
      pendingCashback: Number(pending._sum.amount ?? 0),
    },
  });
}

/**
 * Help articles, FAQs and support contact channels.
 *
 * Upserted by slug so re-running the seed refreshes the stock content without
 * touching anything an admin has since written.
 */
async function seedHelpContent() {
  console.log("Seeding help articles...");

  const ARTICLES: Array<{
    slug: string;
    title: string;
    excerpt?: string;
    body: string;
    category: string;
    isFaq?: boolean;
    isPopular?: boolean;
    sortOrder: number;
  }> = [
    {
      slug: "how-does-cashback-work",
      title: "How does cashback work?",
      excerpt: "Learn how to earn cashback on your online shopping.",
      category: "Cashback",
      isPopular: true,
      sortOrder: 1,
      body: `Stores pay us a commission when we send them a shopper. We share most of that commission back with you as cashback.

To earn it, always start your shopping trip from CashbackApp: open the store page here and click "Earn Cashback". That opens the store through a tracked link, which is how the store knows the visit came from us.

Complete your purchase in the same session, without opening the store again from somewhere else. If you start a fresh visit from an ad or another cashback site in between, that other source gets the credit instead.`,
    },
    {
      slug: "track-my-order-and-cashback",
      title: "How to track my order and cashback?",
      excerpt: "Track your order status and cashback updates.",
      category: "Cashback",
      isPopular: true,
      sortOrder: 2,
      body: `Every tracked order appears under Orders, usually within 24 to 48 hours of your purchase.

Each order shows its current status, the cashback amount, and an estimated confirmation date based on the store's own payout timeline.

If an order still hasn't appeared 48 hours after you bought, raise a ticket with the store name, order ID and date, and we'll trace it.`,
    },
    {
      slug: "when-will-i-receive-my-cashback",
      title: "When will I receive my cashback?",
      excerpt: "Find out cashback confirmation and payment timelines.",
      category: "Cashback",
      isPopular: true,
      sortOrder: 3,
      body: `Cashback goes through two stages.

First it is tracked and shows as pending. At this point the store has told us an order happened, but the return window is still open.

Once the store confirms the order — typically after its return window closes, which can take 60 to 90 days — the cashback is confirmed and moves into your available balance, where you can withdraw it.

If an order is returned or cancelled, the cashback is reversed, even if it was already confirmed.`,
    },
    {
      slug: "how-to-use-profit-links",
      title: "How to use Profit Links?",
      excerpt: "Create and share profit links to earn more.",
      category: "Share & Earn",
      isPopular: true,
      sortOrder: 4,
      body: `A profit link is your own tracked version of a normal product link. It sends the shopper to exactly the same product page, but tells us the visit came from you.

Paste any product URL from a supported store into Share & Earn, and we'll return your link. Share it wherever you like.

When someone buys through it, you earn a share of the commission — even if they never sign up. The buyer pays the same price they would have paid anyway.`,
    },
    {
      slug: "payouts-and-withdrawal",
      title: "Payouts and withdrawal",
      excerpt: "Learn about withdrawal options and the payout process.",
      category: "Wallet",
      isPopular: true,
      sortOrder: 5,
      body: `You can withdraw your available balance once it clears the minimum withdrawal amount shown on the Wallet page.

Choose UPI, bank transfer, Paytm or Amazon Pay, enter where the money should go, and submit the request.

Requesting a withdrawal reserves that money straight away: it leaves your available balance and is held against the request. If you change your mind before it's processed, cancel the request from the Withdrawals tab and the money returns to your balance immediately.`,
    },
    {
      slug: "refer-and-earn-explained",
      title: "How Refer & Earn works",
      excerpt: "Earn from what your friends do on CashbackApp.",
      category: "Refer & Earn",
      sortOrder: 6,
      body: `Share your referral link or code. When a friend signs up through it, they're linked to you.

From then on, you earn a share of what we make whenever they shop — for as long as the referral window lasts, and up to the cap shown on the Refer & Earn page.

A person can only be referred once. Referral earnings follow the same confirmation rules as cashback, and are reversed if the underlying order is cancelled.`,
    },
  ];

  const FAQS: Array<{ slug: string; title: string; body: string; category: string; sortOrder: number }> = [
    {
      slug: "faq-price-difference",
      title: "Does shopping through CashbackApp cost me more?",
      category: "Cashback",
      sortOrder: 1,
      body: "No. You pay exactly the same price as going to the store directly. Cashback comes out of the store's marketing commission, not your pocket.",
    },
    {
      slug: "faq-coupon-codes",
      title: "Can I use coupon codes from other sites?",
      category: "Cashback",
      sortOrder: 2,
      body: "Using a code from somewhere else usually breaks tracking, and the cashback is lost. Only use codes listed on the store's page here.",
    },
    {
      slug: "faq-missing-cashback",
      title: "My cashback is missing. What do I do?",
      category: "Cashback",
      sortOrder: 3,
      body: "Wait 48 hours first — tracking isn't instant. If it still hasn't appeared, raise a ticket with the store, order ID, order date and amount, and we'll chase it with the store.",
    },
    {
      slug: "faq-minimum-withdrawal",
      title: "Is there a minimum withdrawal amount?",
      category: "Wallet",
      sortOrder: 4,
      body: "Yes. The current minimum is shown on the Wallet page next to your available balance.",
    },
    {
      slug: "faq-referral-limit",
      title: "How many friends can I refer?",
      category: "Refer & Earn",
      sortOrder: 5,
      body: "There's no limit on how many people you can refer. There is a cap on how much a single referred friend can earn you — it's shown on the Refer & Earn page.",
    },
    {
      slug: "faq-account-safety",
      title: "Will support ever ask for my password?",
      category: "Account",
      sortOrder: 6,
      body: "Never. Our team will never ask for your password, OTP or full bank account number — by email, phone or inside a ticket. Treat anyone who does as a scammer.",
    },
  ];

  for (const article of ARTICLES) {
    await prisma.helpArticle.upsert({
      where: { slug: article.slug },
      update: {
        title: article.title,
        excerpt: article.excerpt ?? null,
        body: article.body,
        category: article.category,
        isFaq: false,
        isPopular: article.isPopular ?? false,
        sortOrder: article.sortOrder,
      },
      create: {
        slug: article.slug,
        title: article.title,
        excerpt: article.excerpt ?? null,
        body: article.body,
        category: article.category,
        isFaq: false,
        isPopular: article.isPopular ?? false,
        sortOrder: article.sortOrder,
      },
    });
  }

  for (const faq of FAQS) {
    await prisma.helpArticle.upsert({
      where: { slug: faq.slug },
      update: {
        title: faq.title,
        body: faq.body,
        category: faq.category,
        isFaq: true,
        sortOrder: faq.sortOrder,
      },
      create: {
        slug: faq.slug,
        title: faq.title,
        body: faq.body,
        category: faq.category,
        isFaq: true,
        sortOrder: faq.sortOrder,
      },
    });
  }

  console.log("Seeding CMS pages...");
  const CMS_PAGES: Array<{
    slug: string;
    title: string;
    excerpt: string;
    body: string;
    type: "STATIC" | "CUSTOM" | "LANDING";
    sortOrder: number;
  }> = [
    {
      slug: "about-us",
      title: "About Us",
      excerpt: "About our platform and mission",
      type: "STATIC",
      sortOrder: 1,
      body: `CashbackApp exists to give shoppers back a share of what stores already spend on marketing.

When you start a shopping trip from here, the store pays us a commission for sending you. We keep a small part to run the platform and pass the rest to you as cashback.

The same applies when you share a product link or refer a friend: the money comes out of the store's marketing budget, never out of the buyer's pocket. Prices are identical to going direct.`,
    },
    {
      slug: "terms-conditions",
      title: "Terms & Conditions",
      excerpt: "The rules for using CashbackApp",
      type: "STATIC",
      sortOrder: 2,
      body: `By creating an account you agree to use CashbackApp honestly and for your own shopping.

Cashback is earned only on orders we can track. Starting a trip from here and completing the purchase in the same session is what makes tracking work; opening the store again from an advert or another cashback site in between will usually give the credit to that other source.

Cashback is confirmed only after the store validates the order, which normally happens once its return window closes. Orders that are cancelled, returned or found to be fraudulent have their cashback reversed, including after it was confirmed.

Accounts used to abuse the system — self-referral, fake orders, or bulk sign-ups — may be restricted or closed, and any pending balance withheld.`,
    },
    {
      slug: "privacy-policy",
      title: "Privacy Policy",
      excerpt: "How we handle your data",
      type: "STATIC",
      sortOrder: 3,
      body: `We collect what we need to run the service: your name, email, optional mobile number, and the payout details you choose to give us.

We record which stores you visit through our links and which orders those visits produce, because that is how cashback is calculated. We do not see what you put in your basket, your card details, or anything you type on the store's own site.

Your payout details are used only to pay you. We never share them with stores, and we will never ask for your password, an OTP, or a full bank account number by email, phone or in a support ticket.

You can ask us to delete your account at any time. We keep transaction records where we are required to.`,
    },
    {
      slug: "refund-policy",
      title: "Refund & Cancellation",
      excerpt: "Refunds, cancellations and reversed cashback",
      type: "STATIC",
      sortOrder: 4,
      body: `CashbackApp does not sell products, so refunds for an order are handled entirely by the store you bought from, under their own policy.

What we do control is the cashback on that order. If you cancel or return a purchase, the store withdraws the commission it paid us, and the matching cashback is reversed from your wallet — even if it had already been confirmed.

If a reversal takes your available balance below zero, the shortfall is recovered from future earnings rather than charged to you.

Withdrawals already paid out are not clawed back.`,
    },
    {
      slug: "contact-us",
      title: "Contact Us",
      excerpt: "Get in touch with our team",
      type: "STATIC",
      sortOrder: 5,
      body: `The fastest way to reach us is to raise a support ticket from your account — it comes through with your order history attached, so we can trace a missing cashback without a round of questions.

For anything about a specific order, include the store, the order ID and the date you bought.

Our team never asks for your password, an OTP, or your full bank account number. If someone claiming to be us does, it isn't us.`,
    },
  ];

  for (const cmsPage of CMS_PAGES) {
    await prisma.cmsPage.upsert({
      where: { slug: cmsPage.slug },
      update: {
        title: cmsPage.title,
        excerpt: cmsPage.excerpt,
        body: cmsPage.body,
        type: cmsPage.type,
        sortOrder: cmsPage.sortOrder,
      },
      create: {
        slug: cmsPage.slug,
        title: cmsPage.title,
        excerpt: cmsPage.excerpt,
        body: cmsPage.body,
        type: cmsPage.type,
        status: "PUBLISHED",
        showInFooter: true,
        sortOrder: cmsPage.sortOrder,
        publishedAt: new Date(),
      },
    });
  }

  const existingSettings = await prisma.supportSettings.findFirst({ where: { isActive: true } });
  if (!existingSettings) {
    await prisma.supportSettings.create({
      data: {
        email: "support@example.com",
        hours: "Mon - Sun: 9:00 AM - 9:00 PM",
        responseNote: "We usually reply within 24 hours",
        // Phone, WhatsApp and live chat are left unset: seeding contact details
        // nobody is staffing would put dead channels in front of real users.
        // Fill them in under Admin -> Support Tickets -> Contact Settings.
        liveChatEnabled: false,
        isActive: true,
      },
    });
  }
}

function referralCode(seed: string) {
  return seed.toUpperCase().slice(0, 8);
}

async function main() {
  console.log("Seeding categories...");
  const categoryBySlug = new Map<string, string>();
  for (const c of CATEGORIES) {
    const created = await prisma.storeCategory.upsert({
      where: { slug: c.slug },
      update: { name: c.name, icon: c.icon },
      create: c,
    });
    categoryBySlug.set(c.slug, created.id);
  }

  console.log("Seeding stores + campaigns + cashback rules...");
  for (const s of STORES) {
    const categoryId = categoryBySlug.get(s.categorySlug);
    if (!categoryId) throw new Error(`Unknown category slug: ${s.categorySlug}`);

    const store = await prisma.store.upsert({
      where: { slug: s.slug },
      update: {
        name: s.name,
        categoryId,
        cashbackRate: s.cashbackRate,
        cashbackDisplayText: s.cashbackDisplayText,
        featured: s.featured ?? false,
        cashbackType: CashbackType.PERCENTAGE,
        logoUrl: publicLogoUrl(s.domains[0]),
        merchantDomains: s.domains,
        profitLinkEligible: true,
      },
      create: {
        name: s.name,
        slug: s.slug,
        logoUrl: publicLogoUrl(s.domains[0]),
        categoryId,
        cashbackType: CashbackType.PERCENTAGE,
        cashbackRate: s.cashbackRate,
        cashbackDisplayText: s.cashbackDisplayText,
        featured: s.featured ?? false,
        cuelinksCampaignId: `stub_${s.slug}`,
        merchantDomains: s.domains,
        profitLinkEligible: true,
      },
    });

    // --- Store page content --------------------------------------------------
    const page = s.page ?? defaultPageContent(s);

    await prisma.store.update({
      where: { id: store.id },
      data: {
        tagline: page.tagline,
        previousRate: page.previousRate ?? null,
        visitTime: page.visitTime,
        trackingTime: page.trackingTime,
        paymentTime: page.paymentTime,
        description: page.description,
        importantTips: page.tips,
      },
    });

    // Replace rather than upsert: these lists are ordered and small, and a
    // re-run of the seed must not leave stale rows behind.
    await prisma.storeCashbackRate.deleteMany({ where: { storeId: store.id } });
    if (page.rates.length > 0) {
      await prisma.storeCashbackRate.createMany({
        data: page.rates.map((r, i) => ({
          storeId: store.id,
          label: r.label,
          displayText: r.displayText,
          sortOrder: i,
        })),
      });
    }

    await prisma.storeOffer.deleteMany({ where: { storeId: store.id } });
    if (page.offers.length > 0) {
      await prisma.storeOffer.createMany({
        data: page.offers.map((o, i) => ({
          storeId: store.id,
          badge: o.badge ?? null,
          title: o.title,
          description: o.description ?? null,
          code: o.code ?? null,
          validTill: o.validTill ? new Date(`${o.validTill}T00:00:00.000Z`) : null,
          sortOrder: i,
        })),
      });
    }

    await prisma.campaign.upsert({
      where: { cuelinksCampaignId: `stub_${s.slug}` },
      update: { name: s.name, storeId: store.id },
      create: {
        storeId: store.id,
        cuelinksCampaignId: `stub_${s.slug}`,
        name: s.name,
        status: "active",
        commissionType: "percentage",
        commissionValue: s.cashbackRate,
      },
    });

    const existingRule = await prisma.cashbackRule.findFirst({
      where: { storeId: store.id, isActive: true },
    });
    if (!existingRule) {
      await prisma.cashbackRule.create({
        data: {
          storeId: store.id,
          customerPct: s.rule.customerPct,
          profitLinkPct: s.rule.profitLinkPct,
          referralPct: s.rule.referralPct,
          platformPct: s.rule.platformPct,
        },
      });
    }
  }

  console.log("Seeding demo users...");
  const adminPasswordHash = await bcrypt.hash("Admin@12345", 10);
  const admin = await prisma.user.upsert({
    where: { email: "admin@example.com" },
    update: {},
    create: {
      email: "admin@example.com",
      passwordHash: adminPasswordHash,
      name: "Admin",
      role: "ADMIN",
      referralCode: referralCode("admin0001"),
    },
  });
  await prisma.wallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: { userId: admin.id },
  });

  const demoPasswordHash = await bcrypt.hash("Demo@12345", 10);
  const demo = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      passwordHash: demoPasswordHash,
      name: "Demo User",
      role: "USER",
      referralCode: referralCode("demo0001"),
    },
  });
  await prisma.wallet.upsert({
    where: { userId: demo.id },
    update: {},
    create: { userId: demo.id },
  });

  await seedReferralDemo(demo.id);
  await seedActivityDemo(demo.id);

  await seedHelpContent();

  console.log("Seeding settings...");
  await prisma.setting.upsert({
    where: { key: "min_withdrawal_amount" },
    update: { value: 100 },
    create: {
      key: "min_withdrawal_amount",
      value: 100,
      description: "Minimum withdrawal amount in INR",
    },
  });

  console.log("Seeding referral rule...");
  const existingReferralRule = await prisma.referralRule.findFirst({ where: { isActive: true } });
  if (!existingReferralRule) {
    await prisma.referralRule.create({
      data: {
        durationDays: 90,
        maxTotalEarning: 500,
        minOrderValue: null,
        fixedBonus: null,
        // Advertised on /refer-earn. Editable in Admin -> Refer & Earn.
        headlineRatePct: 5,
        isActive: true,
      },
    });
  } else if (existingReferralRule.headlineRatePct === null) {
    // Existing installs predate the public page — give them a starting figure
    // rather than rendering a rate-less landing page.
    await prisma.referralRule.update({
      where: { id: existingReferralRule.id },
      data: { headlineRatePct: 5 },
    });
  }

  console.log("Seed complete.");
  console.log("Admin login: admin@example.com / Admin@12345");
  console.log("Demo login:  demo@example.com / Demo@12345");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
