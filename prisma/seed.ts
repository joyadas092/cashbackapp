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
        isActive: true,
      },
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
