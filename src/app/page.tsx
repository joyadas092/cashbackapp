import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { StoreCard } from "@/components/store/StoreCard";
import { CategoryCard } from "@/components/store/CategoryCard";
import { SearchBar } from "@/components/shared/SearchBar";

export default async function HomePage() {
  const [featuredStores, categories, highestCashback] = await Promise.all([
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
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4">
      {/* Hero */}
      <section className="flex flex-col items-center gap-6 py-20 text-center">
        <h1 className="max-w-2xl text-4xl font-extrabold leading-tight sm:text-6xl">
          Shop Smarter. Get Cashback.{" "}
          <span className="bg-gradient-to-r from-violet-400 via-cyan-300 to-cashlime-400 bg-clip-text text-transparent">
            Earn More.
          </span>
        </h1>
        <p className="max-w-xl text-white/60">
          Shop your favourite stores, get real cashback, and earn extra by sharing deals.
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link href="/stores">
            <Button variant="primary" size="lg">
              Start Earning
            </Button>
          </Link>
          <Link href="/stores">
            <Button variant="outline" size="lg">
              Explore Stores
            </Button>
          </Link>
        </div>
        <div className="mt-4 w-full max-w-lg">
          <SearchBar />
        </div>
      </section>

      {/* Three pillars */}
      <section className="grid grid-cols-1 gap-4 py-8 sm:grid-cols-3">
        <div className="rounded-xl2 border border-white/10 bg-navy-800/60 p-6 text-center">
          <div className="text-3xl">🛍️</div>
          <h3 className="mt-2 font-bold">Shop & Earn</h3>
          <p className="mt-1 text-sm text-white/60">Get cashback from your own purchases.</p>
        </div>
        <div className="rounded-xl2 border border-white/10 bg-navy-800/60 p-6 text-center">
          <div className="text-3xl">🔗</div>
          <h3 className="mt-2 font-bold">Share & Earn</h3>
          <p className="mt-1 text-sm text-white/60">
            Create earning links and make money when others shop.
          </p>
        </div>
        <div className="rounded-xl2 border border-white/10 bg-navy-800/60 p-6 text-center">
          <div className="text-3xl">👥</div>
          <h3 className="mt-2 font-bold">Refer & Earn</h3>
          <p className="mt-1 text-sm text-white/60">
            Invite people and earn from their eligible activity.
          </p>
        </div>
      </section>

      {/* Popular stores */}
      <section className="py-10">
        <h2 className="mb-4 text-xl font-bold">Popular Stores</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {featuredStores.map((store) => (
            <StoreCard
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

      {/* Highest cashback */}
      <section className="py-10">
        <h2 className="mb-4 text-xl font-bold">Highest Cashback</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          {highestCashback.map((store) => (
            <StoreCard
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

      {/* Categories */}
      <section className="py-10">
        <h2 className="mb-4 text-xl font-bold">Categories</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {categories.map((c) => (
            <CategoryCard key={c.id} name={c.name} slug={c.slug} />
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-10">
        <h2 className="mb-4 text-xl font-bold">How It Works</h2>
        <ol className="grid gap-3 sm:grid-cols-3">
          {["Find a store", "Shop through us", "Get cashback"].map((step, i) => (
            <li
              key={step}
              className="rounded-xl2 border border-white/10 bg-navy-800/60 p-5 text-sm text-white/70"
            >
              <span className="mb-2 block text-violet-400">Step {i + 1}</span>
              {step}
            </li>
          ))}
        </ol>
      </section>
    </div>
  );
}
