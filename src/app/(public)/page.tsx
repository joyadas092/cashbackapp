import Link from "next/link";
import { Link2, ShoppingBag, Users } from "lucide-react";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { StoreCard } from "@/components/store/StoreCard";
import { DealCard } from "@/components/store/DealCard";
import { CategoryCard } from "@/components/store/CategoryCard";
import { SearchBar } from "@/components/shared/SearchBar";
import { AnimatedNumber } from "@/components/shared/AnimatedNumber";

export default async function HomePage() {
  const [featuredStores, categories, highestCashback, storeCount, paidAgg] = await Promise.all([
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
  ]);
  const topCashbackRate = Math.round(Number(highestCashback[0]?.cashbackRate ?? 0));
  const totalPaid = Math.round(Number(paidAgg._sum.lifetimeEarned ?? 0));

  return (
    <div>
      {/* Hero — the one section that stays dark chrome */}
      <section className="relative overflow-hidden bg-hero-gradient">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-72 w-72 -translate-x-[140%] rounded-full bg-violet-600/30 blur-3xl"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -top-10 left-1/2 h-64 w-64 translate-x-[60%] rounded-full bg-cyan-400/20 blur-3xl"
        />
        <div className="relative mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-20 text-center">
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-6xl">
            Shop Smarter. Get Cashback.{" "}
            <span className="animate-gradient-x bg-gradient-to-r from-violet-400 via-cyan-300 to-cashlime-400 bg-[length:200%_auto] bg-clip-text text-transparent">
              Earn More.
            </span>
          </h1>
          <p className="max-w-xl text-white/60">
            Shop your favourite stores, get real cashback, and earn extra by sharing deals.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/stores">
              <Button variant="primary" size="lg">
                Shop &amp; Earn Cashback
              </Button>
            </Link>
            <Link href="/dashboard/share-earn">
              <Button variant="outline" size="lg">
                Create Profit Link
              </Button>
            </Link>
          </div>
          <div className="mt-4 w-full max-w-lg">
            <SearchBar />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-8 text-center">
            <div>
              <div className="text-2xl font-extrabold text-cashlime-400">
                <AnimatedNumber value={storeCount} suffix="+" />
              </div>
              <div className="text-xs text-white/50">Partner Stores</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-cyan-300">
                <AnimatedNumber value={topCashbackRate} suffix="%" />
              </div>
              <div className="text-xs text-white/50">Top Cashback</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-violet-400">
                <AnimatedNumber value={categories.length} />
              </div>
              <div className="text-xs text-white/50">Categories</div>
            </div>
            <div>
              <div className="text-2xl font-extrabold text-white">
                ₹<AnimatedNumber value={totalPaid} />
              </div>
              <div className="text-xs text-white/50">Cashback Earned</div>
            </div>
          </div>
        </div>
      </section>

      {/* Everything below the hero is light content */}
      <div className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4">
          {/* Three pillars */}
          <section className="grid grid-cols-1 gap-4 py-10 sm:grid-cols-3">
            {[
              {
                icon: ShoppingBag,
                title: "Shop & Earn",
                body: "Get cashback from your own purchases.",
                accent: "bg-violet-50 border-violet-100",
                chip: "bg-violet-600 text-white",
              },
              {
                icon: Link2,
                title: "Share & Earn",
                body: "Create earning links and make money when others shop.",
                accent: "bg-cashlime-50 border-cashlime-500/20",
                chip: "bg-cashlime-500 text-navy-950",
              },
              {
                icon: Users,
                title: "Refer & Earn",
                body: "Invite people and earn from their eligible activity.",
                accent: "bg-cyan-50 border-cyan-200",
                chip: "bg-cyan-500 text-white",
              },
            ].map((p) => (
              <div key={p.title} className={`rounded-xl2 border p-6 ${p.accent}`}>
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-xl ${p.chip}`}
                >
                  <p.icon size={22} strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{p.title}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.body}</p>
              </div>
            ))}
          </section>

          <section className="py-10">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">Top Stores &amp; Best Cashback</h2>
              <Link href="/stores" className="text-sm font-medium text-violet-700 hover:underline">
                View All Stores &rarr;
              </Link>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {featuredStores.map((store) => (
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

          <section className="py-10">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Highest Cashback</h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              {highestCashback.map((store) => (
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

          <section className="py-10">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Trending Deals</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 sm:grid sm:grid-cols-4 sm:overflow-visible">
              {highestCashback.slice(0, 4).map((store) => (
                <DealCard
                  key={store.id}
                  store={{
                    slug: store.slug,
                    name: store.name,
                    logoUrl: store.logoUrl,
                    cashbackDisplayText: store.cashbackDisplayText,
                  }}
                />
              ))}
            </div>
          </section>

          <section className="py-10">
            <h2 className="mb-4 text-xl font-bold text-slate-900">Categories</h2>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {categories.map((c) => (
                <CategoryCard key={c.id} name={c.name} slug={c.slug} />
              ))}
            </div>
          </section>

          <section className="py-10 pb-16">
            <h2 className="mb-6 text-center text-xl font-bold text-slate-900">How It Works?</h2>
            <ol className="grid gap-4 sm:grid-cols-4">
              {[
                { t: "Sign Up", d: "Create your free account in seconds." },
                { t: "Shop or Share", d: "Shop from top stores or create profit links." },
                { t: "Earn", d: "Earn cashback & commissions on every purchase." },
                { t: "Withdraw", d: "Withdraw your earnings to bank or UPI." },
              ].map((step, i) => (
                <li
                  key={step.t}
                  className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 text-sm font-bold text-violet-700">
                    {i + 1}
                  </span>
                  <div className="mt-3 font-semibold text-slate-900">{step.t}</div>
                  <p className="mt-1 text-sm text-slate-500">{step.d}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </div>
  );
}
