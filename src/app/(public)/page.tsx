import Link from "next/link";
import {
  ArrowRight,
  LayoutGrid,
  Link2,
  Percent,
  ShoppingBag,
  Store,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { StoreCard } from "@/components/store/StoreCard";
import { CategoryCard } from "@/components/store/CategoryCard";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";
import { HeroShowcase } from "@/components/home/HeroShowcase";
import { formatInr } from "@/lib/utils";

export default async function HomePage() {
  const [featuredStores, categories, highestCashback, storeCount, paidAgg, pendingAgg] =
    await Promise.all([
      prisma.store.findMany({
        where: { status: "ACTIVE", featured: true },
        orderBy: { ranking: "desc" },
        take: 8,
      }),
      prisma.storeCategory.findMany({ orderBy: { name: "asc" } }),
      prisma.store.findMany({
        where: { status: "ACTIVE" },
        orderBy: { cashbackRate: "desc" },
        take: 8,
      }),
      prisma.store.count({ where: { status: "ACTIVE" } }),
      prisma.wallet.aggregate({ _sum: { lifetimeEarned: true } }),
      prisma.wallet.aggregate({ _sum: { pendingCashback: true } }),
    ]);

  const topCashbackRate = Math.round(Number(highestCashback[0]?.cashbackRate ?? 0));
  const totalPaid = Math.round(Number(paidAgg._sum.lifetimeEarned ?? 0));
  const totalPending = Math.round(Number(pendingAgg._sum.pendingCashback ?? 0));

  const heroStores = highestCashback.length > 0 ? highestCashback : featuredStores;

  // Only real, queryable numbers here — no invented "happy users" or ratings.
  const stats = [
    { icon: Store, value: storeCount, suffix: "+", label: "Partner Stores", tone: "text-cashlime-400" },
    { icon: Percent, value: topCashbackRate, suffix: "%", label: "Top Cashback", tone: "text-cyan-300" },
    { icon: LayoutGrid, value: categories.length, suffix: "", label: "Categories", tone: "text-violet-300" },
  ];

  return (
    <div>
      {/* ---------- Hero: dark chrome, two columns ---------- */}
      <section className="relative bg-hero-gradient">
        {/* Orbs live in their own clipped layer so the panel below can overhang the hero */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
          <div className="absolute -top-24 left-0 h-72 w-72 rounded-full bg-violet-600/30 blur-3xl" />
          <div className="absolute -top-10 right-1/4 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl" />
        </div>

        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-28 pt-14 lg:grid-cols-2 lg:pb-32 lg:pt-16">
          <div>
            <h1 className="text-4xl font-extrabold leading-[1.1] text-white sm:text-5xl lg:text-6xl">
              Shop. Share.
              <br />
              <span className="animate-gradient-x bg-gradient-to-r from-violet-400 via-cyan-300 to-cashlime-400 bg-[length:200%_auto] bg-clip-text text-transparent">
                Earn More!
              </span>
            </h1>

            <p className="mt-4 max-w-md text-white/60">
              Shop from your favourite stores, share profit links, and earn cashback and
              commissions on every purchase.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/stores">
                <Button variant="primary" size="lg">
                  <ShoppingBag size={18} strokeWidth={2} />
                  Shop &amp; Earn Cashback
                </Button>
              </Link>
              <Link href="/dashboard/share-earn">
                <Button variant="outline" size="lg">
                  <Link2 size={18} strokeWidth={2} />
                  Create Profit Link
                </Button>
              </Link>
            </div>

            <dl className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-4 divide-x divide-white/10">
              {stats.map((stat, i) => (
                <div key={stat.label} className={i > 0 ? "pl-6" : undefined}>
                  <dt className="flex items-center gap-1.5 text-xs text-white/50">
                    <stat.icon size={14} strokeWidth={2} />
                    {stat.label}
                  </dt>
                  <dd className={`mt-1 text-2xl font-extrabold ${stat.tone}`}>
                    <AnimatedNumber value={stat.value} suffix={stat.suffix} />
                  </dd>
                </div>
              ))}
              <div className="pl-6">
                <dt className="flex items-center gap-1.5 text-xs text-white/50">
                  <Wallet size={14} strokeWidth={2} />
                  Cashback Earned
                </dt>
                <dd className="mt-1 text-2xl font-extrabold text-white">
                  {formatInr(totalPaid)}
                </dd>
              </div>
            </dl>
          </div>

          <HeroShowcase
            totalPaid={totalPaid}
            pending={totalPending}
            logos={heroStores.map((s) => ({ name: s.name, logoUrl: s.logoUrl }))}
          />
        </div>
      </section>

      {/* ---------- Light content ---------- */}
      <div className="bg-slate-50 pb-16">
        <div className="mx-auto max-w-6xl px-4">
          {/* Signature move: this panel overlaps the hero's bottom edge */}
          <section className="relative z-10 -mt-20 rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Top Stores &amp; Best Cashback</h2>
              <Link
                href="/stores"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
              >
                View All Stores
                <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {featuredStores.slice(0, 8).map((store) => (
                <StoreCard
                  key={store.id}
                  store={{
                    slug: store.slug,
                    name: store.name,
                    logoUrl: store.logoUrl,
                    cashbackDisplayText: store.cashbackDisplayText,
                    featured: store.featured,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Three ways to earn */}
          <section className="grid grid-cols-1 gap-4 pt-12 sm:grid-cols-3">
            {[
              {
                icon: Link2,
                title: "Share & Earn",
                body: "Create profit links for any product and earn commissions on every purchase.",
                cta: "Create Now",
                href: "/dashboard/share-earn",
                card: "border-violet-100 bg-violet-50",
                chip: "bg-violet-600 text-white",
                link: "text-violet-700",
              },
              {
                icon: Users,
                title: "Refer & Earn",
                body: "Refer friends and family and earn rewards from their eligible activity.",
                cta: "Refer Now",
                href: "/dashboard/refer",
                card: "border-cashlime-500/20 bg-cashlime-50",
                chip: "bg-cashlime-600 text-white",
                link: "text-cashlime-700",
              },
              {
                icon: Tag,
                title: "Best Cashback Rates",
                body: "Compare live cashback rates across every store we support.",
                cta: "Browse Stores",
                href: "/stores",
                card: "border-amber-100 bg-amber-50",
                chip: "bg-amber-500 text-white",
                link: "text-amber-700",
              },
            ].map((f) => (
              <div key={f.title} className={`rounded-xl2 border p-6 ${f.card}`}>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${f.chip}`}
                >
                  <f.icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 font-bold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{f.body}</p>
                <Link
                  href={f.href}
                  className={`mt-3 inline-flex items-center gap-1 text-sm font-semibold ${f.link} hover:underline`}
                >
                  {f.cta}
                  <ArrowRight size={14} strokeWidth={2.5} />
                </Link>
              </div>
            ))}
          </section>

          {/* Highest cashback */}
          <section className="pt-12">
            <div className="mb-5 flex items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-slate-900">Highest Cashback</h2>
              <Link
                href="/stores"
                className="flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
              >
                View All
                <ArrowRight size={15} strokeWidth={2} />
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {highestCashback.slice(0, 8).map((store) => (
                <StoreCard
                  key={store.id}
                  store={{
                    slug: store.slug,
                    name: store.name,
                    logoUrl: store.logoUrl,
                    cashbackDisplayText: store.cashbackDisplayText,
                    featured: store.featured,
                  }}
                />
              ))}
            </div>
          </section>

          {/* Categories */}
          <section className="pt-12">
            <h2 className="mb-5 text-lg font-bold text-slate-900">Shop by Category</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {categories.map((c) => (
                <CategoryCard key={c.id} name={c.name} slug={c.slug} />
              ))}
            </div>
          </section>

          {/* How it works — a real 4-step sequence, so numbering earns its place */}
          <section className="pt-14">
            <h2 className="mb-6 text-center text-xl font-bold text-slate-900">How It Works?</h2>
            <ol className="grid gap-4 sm:grid-cols-4">
              {[
                { t: "Sign Up", d: "Create your free account in under a minute.", icon: Users },
                { t: "Shop or Share", d: "Shop top stores or create profit links.", icon: ShoppingBag },
                { t: "Earn", d: "Earn cashback and commissions on purchases.", icon: Wallet },
                { t: "Withdraw", d: "Withdraw your earnings to bank or UPI.", icon: ArrowRight },
              ].map((step, i, arr) => (
                <li key={step.t} className="relative">
                  <div className="h-full rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
                    <div className="flex items-center gap-3">
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                        {i + 1}
                      </span>
                      <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-50 text-violet-700">
                        <step.icon size={18} strokeWidth={1.75} />
                      </span>
                    </div>
                    <div className="mt-3 font-semibold text-slate-900">{step.t}</div>
                    <p className="mt-1 text-sm text-slate-500">{step.d}</p>
                  </div>

                  {/* Connector between steps, desktop only */}
                  {i < arr.length - 1 && (
                    <span
                      aria-hidden
                      className="absolute -right-3 top-1/2 hidden -translate-y-1/2 text-slate-300 sm:block"
                    >
                      <ArrowRight size={18} strokeWidth={2} />
                    </span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
