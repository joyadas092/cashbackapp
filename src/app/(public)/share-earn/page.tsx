import Link from "next/link";
import type { Metadata } from "next";
import { ArrowRight, Gift } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ShareEarnWorkspace } from "@/components/share-earn/ShareEarnWorkspace";
import { StoreLogo } from "@/components/store/StoreLogo";
import { siteUrl } from "@/lib/siteUrl";

const TITLE = "Share & Earn — Turn Any Product Link Into Earnings";
const DESCRIPTION =
  "Paste any product link from 1000+ supported stores, get your own profit link, and earn a commission every time someone buys through it. Free, and no selling required.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "share and earn",
    "profit link",
    "affiliate link generator",
    "earn money online india",
    "cashback link sharing",
  ],
  alternates: { canonical: "/share-earn" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/share-earn",
    type: "website",
    siteName: "CashbackApp",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

const FAQS = [
  {
    q: "What is a profit link?",
    a: "A profit link is your own tracked version of a normal product link. It sends the shopper to exactly the same product page, but tells us the visit came from you — so when they buy, we know who to pay.",
  },
  {
    q: "Do I need followers or a website to earn?",
    a: "No. Most people share profit links in WhatsApp groups or with friends who were already planning to buy something. There is no minimum audience and nothing to sell.",
  },
  {
    q: "Does the person buying pay extra?",
    a: "No. The price is identical to visiting the store directly. Your earnings come out of the store's marketing commission, not out of the buyer's pocket.",
  },
  {
    q: "When do I get paid?",
    a: "Earnings appear as pending as soon as the order is tracked, and become withdrawable once the store confirms the order — typically after the return window closes.",
  },
  {
    q: "Which stores are supported?",
    a: "Links from any of our active partner stores work. If a link isn't from a supported store, we'll tell you as soon as you paste it rather than creating a link that can't earn.",
  },
];

export default async function ShareEarnPage() {
  const [session, stores, topStore] = await Promise.all([
    auth(),
    prisma.store.findMany({
      where: { status: "ACTIVE", profitLinkEligible: true },
      orderBy: { ranking: "desc" },
      take: 12,
      select: { id: true, name: true, slug: true, logoUrl: true, merchantDomains: true },
    }),
    prisma.store.findFirst({
      where: { status: "ACTIVE", profitLinkEligible: true },
      orderBy: { cashbackRate: "desc" },
      select: { cashbackDisplayText: true, merchantDomains: true },
    }),
  ]);

  const isLoggedIn = Boolean(session?.user);
  const sampleDomain = topStore?.merchantDomains[0] ?? "myntra.com";
  const base = siteUrl();

  // HowTo + FAQPage are the two schema types this page genuinely qualifies for —
  // it really is a step-by-step procedure followed by real answered questions.
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          // Schema.org wants absolute URLs here — relative ones are ignored.
          { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Share & Earn", item: `${base}/share-earn` },
        ],
      },
      {
        "@type": "HowTo",
        name: "How to earn by sharing product links",
        description: DESCRIPTION,
        totalTime: "PT2M",
        step: [
          {
            "@type": "HowToStep",
            position: 1,
            name: "Paste Link",
            text: "Paste any product link from a supported store.",
          },
          {
            "@type": "HowToStep",
            position: 2,
            name: "We Process",
            text: "We convert it into your own tracked earning link.",
          },
          {
            "@type": "HowToStep",
            position: 3,
            name: "Share It",
            text: "Share the link with friends, family or on social media.",
          },
          {
            "@type": "HowToStep",
            position: 4,
            name: "Earn Money",
            text: "Earn a commission when someone buys through your link.",
          },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: FAQS.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
    ],
  };

  return (
    <div className="bg-slate-50">
      {/* Structured data — HowTo and FAQPage both describe content actually on the page. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="mx-auto max-w-[1400px] px-4 py-6">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-700">
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-800">Share &amp; Earn</span>
        </nav>

        {/* --- Page header --- */}
        <header className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">
              Share &amp; <span className="text-violet-700">Earn</span>
            </h1>
            <p className="mt-1.5 text-slate-500">
              Share any product link and earn cashback on every purchase!
            </p>
          </div>

          <div className="flex items-center gap-4 rounded-xl2 border border-slate-200 bg-white p-3 pr-4 shadow-card">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50">
              <Gift size={22} strokeWidth={1.75} className="text-amber-500" />
            </span>
            <div className="min-w-0">
              <div className="text-sm font-bold text-slate-900">Multiply your earnings</div>
              <div className="text-xs text-slate-500">Share more links, earn more rewards!</div>
            </div>
            <Link
              href={isLoggedIn ? "/dashboard" : "/register?callbackUrl=/share-earn"}
              className="shrink-0 rounded-lg bg-violet-600 px-4 py-2 text-xs font-bold text-white transition-colors hover:bg-violet-500"
            >
              {isLoggedIn ? "Dashboard" : "Get Started"}
            </Link>
          </div>
        </header>

        {/* --- The generator + sidebar --- */}
        <ShareEarnWorkspace
          isLoggedIn={isLoggedIn}
          topShareText={topStore?.cashbackDisplayText ?? "Store commission"}
          sampleUrl={`https://www.${sampleDomain}/product/12345`}
        />

        {/* --- Supported stores: crawlable, and genuinely useful --- */}
        {stores.length > 0 && (
          <section className="mt-10">
            <h2 className="text-xl font-bold text-slate-900">Stores you can share from</h2>
            <p className="mt-1 text-sm text-slate-500">
              Paste a product link from any of these and we&apos;ll turn it into an earning link.
            </p>
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {stores.map((store) => (
                <li key={store.id}>
                  <Link
                    href={`/stores/${store.slug}`}
                    className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white p-3 transition-colors hover:border-violet-300"
                  >
                    <div className="shrink-0 rounded-lg ring-1 ring-slate-200">
                      <StoreLogo
                        src={store.logoUrl}
                        alt={store.name}
                        size={28}
                        fallbackSlug={store.slug}
                      />
                    </div>
                    <span className="min-w-0 truncate text-sm font-semibold text-slate-800">
                      {store.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* --- FAQ: the visible half of the FAQPage schema above --- */}
        <section className="mt-10">
          <h2 className="text-xl font-bold text-slate-900">Share &amp; Earn — Common Questions</h2>
          <div className="mt-4 space-y-3">
            {FAQS.map((faq) => (
              <details
                key={faq.q}
                className="group rounded-xl2 border border-slate-200 bg-white p-4 shadow-card"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                  {faq.q}
                  <ArrowRight
                    size={16}
                    strokeWidth={2.5}
                    className="shrink-0 text-slate-400 transition-transform group-open:rotate-90"
                  />
                </summary>
                <p className="mt-2.5 text-sm leading-relaxed text-slate-600">{faq.a}</p>
              </details>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
