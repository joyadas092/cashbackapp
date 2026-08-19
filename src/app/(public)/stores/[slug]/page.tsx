import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import {
  ArrowRight,
  ArrowUpRight,
  Banknote,
  CheckCircle2,
  Clock,
  Headphones,
  MousePointerClick,
  Radar,
  ShieldCheck,
  ShoppingCart,
  Trophy,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StoreLogo } from "@/components/store/StoreLogo";
import { Button } from "@/components/ui/Button";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { StoreCard } from "@/components/store/StoreCard";
import { StoreTabs, type StoreTab } from "@/components/store/StoreTabs";
import { StoreActionButtons } from "@/components/store/StoreActionButtons";
import { StoreShareEarn } from "@/components/store/StoreShareEarn";
import { OfferCard } from "@/components/store/OfferCard";

async function getStore(slug: string) {
  return prisma.store.findUnique({
    where: { slug },
    include: {
      category: true,
      categoryRates: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
      offers: { where: { isActive: true }, orderBy: { sortOrder: "asc" } },
    },
  });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const store = await getStore(params.slug);
  if (!store) return {};
  return {
    title: store.seoTitle ?? `${store.name} Cashback & Offers | CashbackApp`,
    description:
      store.seoDescription ??
      `Earn ${store.cashbackDisplayText} at ${store.name}. Shop through CashbackApp and get real cashback.`,
  };
}

/** "Up to 8% Cashback" -> "Up to 8%", so the word can be typeset on its own line. */
function splitRateHeadline(displayText: string): string {
  return displayText.replace(/\s*cashback\s*$/i, "").trim() || displayText;
}

function formatValidTill(date: Date | null): string | null {
  if (!date) return null;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const TRUST_BADGES = [
  { icon: ShieldCheck, title: "100% Safe", sub: "Secure tracking", tone: "bg-violet-100 text-violet-700" },
  { icon: Trophy, title: "Best Cashback", sub: "Get highest rewards", tone: "bg-cashlime-100 text-cashlime-700" },
  { icon: Clock, title: "On-Time Payout", sub: "Guaranteed payments", tone: "bg-amber-100 text-amber-700" },
  { icon: Headphones, title: "24/7 Support", sub: "We're here to help", tone: "bg-cyan-100 text-cyan-700" },
];

const DEFAULT_TIPS = [
  "Click Earn Cashback and complete your purchase in the same session.",
  "Do not use any other coupon code except the ones listed here.",
  "Returns & cancellations are not eligible for cashback.",
  "Cashback is not applicable on Gift Cards.",
];

export default async function StoreDetailPage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store || store.status !== "ACTIVE") notFound();

  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  const [relatedStores, favorite] = await Promise.all([
    prisma.store.findMany({
      where: { status: "ACTIVE", categoryId: store.categoryId, id: { not: store.id } },
      orderBy: { cashbackRate: "desc" },
      take: 4,
    }),
    session?.user
      ? prisma.storeFavorite.findUnique({
          where: { userId_storeId: { userId: session.user.id, storeId: store.id } },
          select: { id: true },
        })
      : Promise.resolve(null),
  ]);

  const rateHeadline = splitRateHeadline(store.cashbackDisplayText);
  const previousRate = store.previousRate ? Number(store.previousRate) : null;
  const rateIncreased = previousRate !== null && Number(store.cashbackRate) > previousRate;

  const timings = [
    { icon: Clock, label: "Visit Time", value: store.visitTime, tone: "text-cashlime-600 bg-cashlime-50" },
    { icon: Radar, label: "Tracking Time", value: store.trackingTime, tone: "text-violet-600 bg-violet-50" },
    { icon: Banknote, label: "Payment Time", value: store.paymentTime, tone: "text-amber-600 bg-amber-50" },
  ].filter((t) => Boolean(t.value));

  const tips = store.importantTips.length > 0 ? store.importantTips : DEFAULT_TIPS;

  const howItWorks = [
    {
      icon: MousePointerClick,
      title: "Click on Earn Cashback",
      body: `Click the Earn Cashback button above to visit ${store.name} from CashbackApp.`,
      tone: "bg-violet-100 text-violet-700",
      badge: "bg-violet-600",
    },
    {
      icon: ShoppingCart,
      title: "Shop as Usual",
      body: `Shop anything you want on ${store.name} as you normally do.`,
      tone: "bg-amber-100 text-amber-700",
      badge: "bg-amber-500",
    },
    {
      icon: Wallet,
      title: "We Track Your Order",
      body: `We track your purchase and confirm it with ${store.name}.`,
      tone: "bg-cashlime-100 text-cashlime-700",
      badge: "bg-cashlime-600",
    },
    {
      icon: Banknote,
      title: "Get Cashback",
      body: "Once confirmed, cashback will be added to your CashbackApp wallet.",
      tone: "bg-cyan-100 text-cyan-700",
      badge: "bg-cyan-600",
    },
  ];

  const aboutBody =
    store.description ??
    `${store.name} is one of our partner stores. Shop your favourite products and earn cashback on every eligible purchase through CashbackApp.`;

  const tabs: StoreTab[] = [
    {
      id: "about",
      label: `About ${store.name}`,
      content: (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_auto]">
          <div>
            <h2 className="text-lg font-bold text-slate-900">About {store.name}</h2>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-600">{aboutBody}</p>
          </div>
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-4">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.title} className="text-center">
                <span
                  className={`mx-auto flex h-11 w-11 items-center justify-center rounded-full ${badge.tone}`}
                >
                  <badge.icon size={20} strokeWidth={2} />
                </span>
                <div className="mt-2 text-sm font-bold text-slate-900">{badge.title}</div>
                <div className="text-xs text-slate-500">{badge.sub}</div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      id: "how",
      label: "How Cashback Works",
      content: (
        <ol className="space-y-3">
          {howItWorks.map((step, i) => (
            <li key={step.title} className="flex gap-3">
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${step.badge}`}
              >
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold text-slate-900">{step.title}</div>
                <p className="text-sm text-slate-600">{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      ),
    },
    {
      id: "terms",
      label: "Terms & Conditions",
      content: store.terms ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">{store.terms}</p>
      ) : (
        <ul className="space-y-2.5">
          {tips.map((tip) => (
            <li key={tip} className="flex gap-2 text-sm text-slate-600">
              <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0 text-cashlime-600" />
              {tip}
            </li>
          ))}
        </ul>
      ),
    },
    {
      id: "policies",
      label: "Store Policies",
      content: store.storePolicies ? (
        <p className="whitespace-pre-line text-sm leading-relaxed text-slate-600">
          {store.storePolicies}
        </p>
      ) : (
        <p className="text-sm text-slate-600">
          {store.name} handles returns, refunds and delivery under its own policies. Cashback is
          calculated on the final eligible order value after discounts, and is reversed if an order
          is cancelled or returned.
        </p>
      ),
    },
  ];

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-[1400px] px-4 py-6">
        {/* Breadcrumb */}
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-700">
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <Link href="/stores" className="hover:text-violet-700">
            Stores
          </Link>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-800">{store.name}</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* ================= Main column ================= */}
          <div className="min-w-0 flex-1 space-y-6">
            {/* ---- Hero card ---- */}
            <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
                {/* Logo tile */}
                <div className="flex h-44 w-44 shrink-0 items-center justify-center self-center rounded-xl2 border border-slate-200 p-4 lg:self-start">
                  <StoreLogo
                    src={store.logoUrl}
                    alt={store.name}
                    size={140}
                    fallbackSlug={store.slug}
                  />
                </div>

                {/* Name + tagline + timings */}
                <div className="min-w-0 flex-1">
                  {store.featured && (
                    <span className="inline-block rounded-md bg-violet-600 px-2.5 py-1 text-[11px] font-bold text-white">
                      Top Store
                    </span>
                  )}
                  <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-slate-900">
                    {store.name}
                  </h1>
                  <p className="mt-2 max-w-lg text-sm leading-relaxed text-slate-500">
                    {store.tagline ?? `Earn cashback on every eligible order at ${store.name}.`}
                  </p>

                  {timings.length > 0 && (
                    <div className="mt-5 inline-flex flex-wrap items-center gap-x-8 gap-y-4 rounded-xl border border-slate-200 px-5 py-3">
                      {timings.map((t) => (
                        <div key={t.label} className="flex items-center gap-2.5">
                          <span
                            className={`flex h-9 w-9 items-center justify-center rounded-full ${t.tone}`}
                          >
                            <t.icon size={17} strokeWidth={2} />
                          </span>
                          <div>
                            <div className="text-xs text-slate-500">{t.label}</div>
                            <div className="text-sm font-bold text-slate-900">{t.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rate block */}
                <div className="shrink-0 text-center lg:border-l lg:border-slate-200 lg:pl-8">
                  <div className="text-sm font-semibold text-violet-700">Cashback / Rewards</div>
                  <div className="mt-3 text-4xl font-extrabold tracking-tight text-cashlime-600">
                    {rateHeadline}
                  </div>
                  <div className="mt-1 text-xl font-bold text-slate-900">Cashback</div>
                  {rateIncreased && (
                    <div className="mt-3 inline-flex items-center gap-1 rounded-full bg-cashlime-50 px-3.5 py-1.5 text-sm font-semibold text-cashlime-700">
                      Was {previousRate}%
                      <ArrowUpRight size={15} strokeWidth={2.5} />
                    </div>
                  )}
                </div>
              </div>

              {/* Trust banner */}
              <div className="mt-6 flex items-start gap-3 rounded-xl bg-gradient-to-r from-violet-50 to-slate-50 p-4">
                <ShieldCheck
                  size={22}
                  strokeWidth={1.75}
                  className="mt-0.5 shrink-0 text-violet-600"
                />
                <div>
                  <div className="text-sm font-bold text-slate-900">Shop with confidence</div>
                  <p className="text-sm text-slate-600">
                    We track your visit and purchase to make sure you get your cashback.
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="mt-5 grid gap-3 border-t border-slate-100 pt-5 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.4fr]">
                <StoreActionButtons
                  storeSlug={store.slug}
                  storeName={store.name}
                  cashbackDisplayText={store.cashbackDisplayText}
                  isLoggedIn={isLoggedIn}
                  initiallyFavorited={Boolean(favorite)}
                />

                {isLoggedIn ? (
                  <a
                    href={`/go/${store.slug}?intent=cashback`}
                    className="flex flex-col items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
                  >
                    <span className="flex items-center gap-2 text-base font-bold">
                      Earn Cashback
                      <ArrowRight size={17} strokeWidth={2.5} />
                    </span>
                    <span className="text-xs text-white/70">
                      Redirects to {store.name} via CashbackApp
                    </span>
                  </a>
                ) : (
                  <LoginPromptModal
                    storeSlug={store.slug}
                    storeName={store.name}
                    trigger={
                      <button className="flex w-full flex-col items-center justify-center rounded-xl bg-violet-600 px-6 py-3 text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500">
                        <span className="flex items-center gap-2 text-base font-bold">
                          Earn Cashback
                          <ArrowRight size={17} strokeWidth={2.5} />
                        </span>
                        <span className="text-xs text-white/70">
                          Redirects to {store.name} via CashbackApp
                        </span>
                      </button>
                    }
                  />
                )}
              </div>
            </div>

            {/* ---- Tabs ---- */}
            <StoreTabs tabs={tabs} />

            {/* ---- Share & Earn ---- */}
            <StoreShareEarn
              storeName={store.name}
              storeSlug={store.slug}
              sampleDomain={store.merchantDomains[0] ?? null}
              isLoggedIn={isLoggedIn}
              profitLinkEligible={store.profitLinkEligible}
            />

            {/* ---- How Cashback Works ---- */}
            <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
              <h2 className="text-center text-xl font-bold text-slate-900">How Cashback Works?</h2>
              <ol className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {howItWorks.map((step, i, arr) => (
                  <li key={step.title} className="relative">
                    <div className="h-full rounded-xl border border-slate-200 p-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${step.badge}`}
                        >
                          {i + 1}
                        </span>
                        <div className="text-sm font-bold text-slate-900">{step.title}</div>
                      </div>
                      <div className="mt-3 flex items-start gap-3">
                        <span
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full ${step.tone}`}
                        >
                          <step.icon size={22} strokeWidth={1.75} />
                        </span>
                        <p className="text-xs leading-relaxed text-slate-500">{step.body}</p>
                      </div>
                    </div>

                    {i < arr.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 lg:block"
                      >
                        <ArrowRight size={16} strokeWidth={2} />
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </section>

            {relatedStores.length > 0 && (
              <section>
                <h2 className="mb-4 text-xl font-bold text-slate-900">
                  More in {store.category.name}
                </h2>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  {relatedStores.map((s) => (
                    <StoreCard
                      key={s.id}
                      store={{
                        slug: s.slug,
                        name: s.name,
                        logoUrl: s.logoUrl,
                        cashbackDisplayText: s.cashbackDisplayText,
                        featured: s.featured,
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* ================= Sidebar ================= */}
          <aside className="w-full shrink-0 space-y-6 lg:w-[400px]">
            {/* Rate table */}
            <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">{store.name} Cashback Rates</h2>

              {store.categoryRates.length > 0 ? (
                <>
                  <dl className="mt-4 divide-y divide-slate-100">
                    {store.categoryRates.map((rate) => (
                      <div key={rate.id} className="flex items-center justify-between gap-4 py-2.5">
                        <dt className="text-sm text-slate-600">{rate.label}</dt>
                        <dd className="shrink-0 text-sm font-bold text-cashlime-600">
                          {rate.displayText}
                        </dd>
                      </div>
                    ))}
                  </dl>
                  <Link href="/stores" className="mt-4 block">
                    <Button variant="ghostLight" className="w-full bg-violet-50 text-violet-700">
                      View All Categories
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <div className="mt-4 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-sm text-slate-600">All categories</span>
                    <span className="text-sm font-bold text-cashlime-600">
                      {store.cashbackDisplayText}
                    </span>
                  </div>
                  <p className="mt-3 text-xs text-slate-500">
                    Cashback is calculated on the eligible order value after discounts, and confirmed
                    once {store.name} validates the order.
                  </p>
                </>
              )}
            </div>

            {/* Offers */}
            {store.offers.length > 0 && (
              <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-lg font-bold text-slate-900">Best Offers for You</h2>
                  <Link
                    href={`/go/${store.slug}?intent=visit`}
                    className="shrink-0 text-sm font-medium text-violet-700 hover:underline"
                  >
                    View All
                  </Link>
                </div>

                <div className="mt-4 space-y-3">
                  {store.offers.map((offer) => (
                    <OfferCard
                      key={offer.id}
                      offer={{
                        id: offer.id,
                        badge: offer.badge,
                        title: offer.title,
                        description: offer.description,
                        code: offer.code,
                        validTill: formatValidTill(offer.validTill),
                      }}
                    />
                  ))}
                </div>

                <Link
                  href={`/go/${store.slug}?intent=visit`}
                  className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-violet-700 hover:underline"
                >
                  View All Coupons &amp; Offers
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            )}

            {/* Tips */}
            <div className="rounded-xl2 border border-cashlime-500/25 bg-cashlime-50/60 p-5">
              <h2 className="text-lg font-bold text-slate-900">Important Tips</h2>
              <ul className="mt-4 space-y-3">
                {tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5 text-sm text-slate-700">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-cashlime-600"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
              <Link
                href="/stores"
                className="mt-4 flex items-center justify-center gap-1.5 text-sm font-semibold text-cashlime-700 hover:underline"
              >
                View All Terms &amp; Conditions
                <ArrowRight size={15} strokeWidth={2.5} />
              </Link>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
