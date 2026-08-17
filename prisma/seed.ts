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

const STORES: Array<{
  name: string;
  slug: string;
  categorySlug: string;
  cashbackRate: number;
  cashbackDisplayText: string;
  rule: { customerPct: number; profitLinkPct: number; referralPct: number; platformPct: number };
  featured?: boolean;
  domains: string[];
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
