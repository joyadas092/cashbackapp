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
