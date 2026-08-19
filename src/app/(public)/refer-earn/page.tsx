import Link from "next/link";
import { headers } from "next/headers";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeIndianRupee,
  Gift,
  Info,
  PlayCircle,
  ShieldCheck,
  ShoppingCart,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ReferHeroArt } from "@/components/referral/ReferHeroArt";
import { PublicShareBar } from "@/components/referral/PublicShareBar";
import { siteUrl } from "@/lib/siteUrl";
import { formatInrExact } from "@/lib/utils";

const TITLE = "Refer Friends, Earn More — Refer & Earn";
const DESCRIPTION =
  "Invite your friends to CashbackApp and earn a share of what we make on every purchase they complete. Free to join, no hidden charges, real withdrawable earnings.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  keywords: [
    "refer and earn",
    "referral program india",
    "invite friends earn money",
    "cashback referral",
    "refer earn app",
  ],
  alternates: { canonical: "/refer-earn" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/refer-earn",
    type: "website",
    siteName: "CashbackApp",
  },
  twitter: { card: "summary_large_image", title: TITLE, description: DESCRIPTION },
};

const TRUST = [
  { icon: Gift, title: "100% Free", sub: "No hidden charges" },
  { icon: ShieldCheck, title: "Trusted Platform", sub: "Secure & reliable" },
  { icon: BadgeIndianRupee, title: "Real Earnings", sub: "Get paid for referrals" },
];

export default async function PublicReferEarnPage() {
  const [session, rule] = await Promise.all([
    auth(),
    prisma.referralRule.findFirst({ where: { isActive: true } }),
  ]);

  const ratePct = rule?.headlineRatePct ? Number(rule.headlineRatePct) : null;
  const base = siteUrl();

  // Signed-in visitors get their real link in the share bar; everyone else gets
  // a sign-up prompt instead of a placeholder URL that copies nothing useful.
  let shareUrl: string | null = null;
  if (session?.user) {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { referralCode: true },
    });
    if (user) {
      const host = headers().get("host") ?? "localhost:3000";
      const protocol = host.startsWith("localhost") ? "http" : "https";
      shareUrl = `${protocol}://${host}/refer/${user.referralCode}`;
    }
  }

  const rateLabel = ratePct !== null ? `${ratePct}%` : "a share";

  const steps = [
    {
      icon: Users,
      title: "Invite Your Friends",
      body: "Share your referral link with your friends and family.",
      tone: "bg-violet-100 text-violet-600",
    },
    {
      icon: UserPlus,
      title: "They Sign Up",
      body: "Your friend signs up on CashbackApp using your referral link.",
      tone: "bg-sky-100 text-sky-600",
    },
    {
      icon: ShoppingCart,
      title: "They Shop & Earn",
      body: "Your friend shops and earns cashback on CashbackApp.",
      tone: "bg-cashlime-100 text-cashlime-700",
    },
    {
      icon: BadgeIndianRupee,
      title: `You Earn ${rateLabel}`,
      body: `You get ${rateLabel} of our income for every successful purchase.`,
      tone: "bg-amber-100 text-amber-600",
    },
    {
      icon: Wallet,
      title: "Get Paid",
      body: "Your earnings are added to your account. Withdraw anytime!",
      tone: "bg-violet-100 text-violet-600",
    },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${base}/` },
          { "@type": "ListItem", position: 2, name: "Refer & Earn", item: `${base}/refer-earn` },
        ],
      },
      {
        "@type": "HowTo",
        name: "How Refer & Earn works",
        description: DESCRIPTION,
        step: steps.map((step, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: step.title,
          text: step.body,
        })),
      },
    ],
  };

  return (
    <div className="bg-white">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ---------------- Hero ---------------- */}
      <section className="relative bg-gradient-to-b from-violet-50 via-violet-50/60 to-slate-50">
        <div className="mx-auto grid max-w-[1400px] items-center gap-10 px-4 pb-32 pt-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:pb-40 lg:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-violet-100 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-violet-700">
              <Gift size={14} strokeWidth={2.5} />
              Refer &amp; Earn
            </span>

            <h1 className="mt-5 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 lg:text-6xl">
              {rule?.publicHeadline ?? "Refer Friends,"}
              <br />
              <span className="text-violet-700">Earn More!</span>
            </h1>

            <p className="mt-5 max-w-lg text-lg leading-relaxed text-slate-600">
              {rule?.publicSubtext ?? (
                <>
                  Invite your friends to CashbackApp and get{" "}
                  <span className="font-bold text-violet-700">{rateLabel}</span> of our income for
                  every successful purchase they make.
                </>
              )}
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href={
                  session?.user ? "/dashboard/refer" : "/register?callbackUrl=/refer-earn"
                }
                className="rounded-xl bg-violet-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
              >
                {session?.user ? "Go to Refer & Earn" : "Sign Up & Get Started"}
              </Link>
              <Link
                href="#how-it-works"
                className="flex items-center gap-2 rounded-xl border border-violet-200 bg-white px-8 py-4 text-base font-bold text-violet-700 transition-colors hover:bg-violet-50"
              >
                <PlayCircle size={18} strokeWidth={2} />
                How It Works
              </Link>
            </div>

            <ul className="mt-10 flex flex-wrap gap-x-10 gap-y-5">
              {TRUST.map((item) => (
                <li key={item.title} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-100 text-violet-600">
                    <item.icon size={20} strokeWidth={1.75} />
                  </span>
                  <div>
                    <div className="text-sm font-bold text-slate-900">{item.title}</div>
                    <div className="text-xs text-slate-500">{item.sub}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          <ReferHeroArt ratePct={ratePct} />
        </div>
      </section>

      {/* ---------------- Share bar, overlapping the hero ---------------- */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-[1400px] px-4">
          <div className="relative z-10 -mt-24">
            <PublicShareBar shareUrl={shareUrl} />
          </div>

          {/* ---------------- How it works ---------------- */}
          <section id="how-it-works" className="scroll-mt-24 py-14">
            <h2 className="text-center text-3xl font-extrabold tracking-tight text-slate-900">
              How Refer &amp; Earn Works?
            </h2>

            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {steps.map((step, i, arr) => (
                <li key={step.title} className="relative">
                  <div className="h-full rounded-xl2 border border-slate-200 bg-white p-5 text-center shadow-card">
                    <div className="flex items-start justify-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span
                        className={`flex h-14 w-14 items-center justify-center rounded-full ${step.tone}`}
                      >
                        <step.icon size={24} strokeWidth={1.75} />
                      </span>
                    </div>
                    <div className="mt-4 font-bold text-slate-900">{step.title}</div>
                    <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{step.body}</p>
                  </div>

                  {i < arr.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-violet-400 lg:block"
                    >
                      <ArrowRight size={18} strokeWidth={2.5} />
                    </span>
                  )}
                </li>
              ))}
            </ol>

            {ratePct !== null && (
              <p className="mt-6 flex items-center justify-center gap-2.5 rounded-xl bg-violet-50 px-5 py-4 text-center text-sm text-slate-700">
                <Info size={16} strokeWidth={2} className="shrink-0 text-violet-600" />
                You earn{" "}
                <span className="font-bold text-violet-700">{ratePct}%</span> of the income
                (commission/cashback) we earn from your friend&apos;s successful purchase.
              </p>
            )}
          </section>

          {/* ---------------- The actual terms ---------------- */}
          <section className="pb-16">
            <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-xl font-bold text-slate-900">The fine print, in plain words</h2>
              <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  "A friend can be referred once — the first referral to reach them counts.",
                  rule?.durationDays
                    ? `You earn from a friend's activity for ${rule.durationDays} days from the day they join.`
                    : null,
                  rule?.maxTotalEarning
                    ? `Earnings are capped at ${formatInrExact(Number(rule.maxTotalEarning))} per referred friend.`
                    : null,
                  rule?.minOrderValue
                    ? `Orders below ${formatInrExact(Number(rule.minOrderValue))} don't earn referral commission.`
                    : null,
                  rule?.fixedBonus
                    ? `Your friend gets a ${formatInrExact(Number(rule.fixedBonus))} bonus after their first confirmed order.`
                    : null,
                  "Earnings become withdrawable once the store confirms the order, and are reversed if it's cancelled or returned.",
                ]
                  .filter((line): line is string => line !== null)
                  .map((line) => (
                    <li key={line} className="flex gap-2.5 text-sm text-slate-600">
                      <ShieldCheck
                        size={15}
                        strokeWidth={2}
                        className="mt-0.5 shrink-0 text-cashlime-600"
                      />
                      {line}
                    </li>
                  ))}
              </ul>

              <div className="mt-6 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5">
                <Link
                  href={session?.user ? "/dashboard/refer" : "/register?callbackUrl=/refer-earn"}
                  className="rounded-xl bg-violet-600 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500"
                >
                  {session?.user ? "View My Referrals" : "Create a Free Account"}
                </Link>
                <Link
                  href="/stores"
                  className="flex items-center gap-1.5 text-sm font-semibold text-violet-700 hover:underline"
                >
                  Browse stores first
                  <ArrowRight size={15} strokeWidth={2.5} />
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
