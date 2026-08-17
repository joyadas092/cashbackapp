import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StoreLogo } from "@/components/store/StoreLogo";
import { Button } from "@/components/ui/Button";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";
import { StoreCard } from "@/components/store/StoreCard";

async function getStore(slug: string) {
  return prisma.store.findUnique({ where: { slug }, include: { category: true } });
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

export default async function StoreDetailPage({ params }: { params: { slug: string } }) {
  const store = await getStore(params.slug);
  if (!store || store.status !== "ACTIVE") notFound();

  const [session, relatedStores] = await Promise.all([
    auth(),
    prisma.store.findMany({
      where: { status: "ACTIVE", categoryId: store.categoryId, id: { not: store.id } },
      orderBy: { cashbackRate: "desc" },
      take: 4,
    }),
  ]);
  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-700">
            Home
          </Link>
          <span>/</span>
          <Link href="/stores" className="hover:text-violet-700">
            Stores
          </Link>
          <span>/</span>
          <span className="font-medium text-slate-700">{store.name}</span>
        </nav>

        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Main column */}
          <div className="min-w-0 flex-1">
            <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card sm:p-8">
              <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
                <div className="rounded-2xl ring-1 ring-slate-200">
                  <StoreLogo
                    src={store.logoUrl}
                    alt={store.name}
                    size={80}
                    fallbackSlug={store.slug}
                  />
                </div>
                <div className="flex-1">
                  {store.featured && (
                    <span className="inline-block rounded-full bg-violet-600 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                      Top Store
                    </span>
                  )}
                  <h1 className="mt-2 text-3xl font-extrabold text-slate-900">{store.name}</h1>
                  <p className="mt-1 text-sm text-slate-500">{store.category.name}</p>
                </div>
                <div className="text-center">
                  <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                    Cashback
                  </div>
                  <div className="text-2xl font-extrabold text-cashlime-700">
                    {store.cashbackDisplayText}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                {isLoggedIn ? (
                  <a href={`/go/${store.slug}?intent=cashback`} className="flex-1">
                    <Button variant="primary" size="lg" className="w-full">
                      Earn Cashback &rarr;
                    </Button>
                  </a>
                ) : (
                  <LoginPromptModal
                    storeSlug={store.slug}
                    storeName={store.name}
                    trigger={
                      <Button variant="primary" size="lg" className="w-full sm:w-auto">
                        Earn Cashback &rarr;
                      </Button>
                    }
                  />
                )}
                <a href={`/go/${store.slug}?intent=visit`}>
                  <Button variant="outlineLight" size="lg" className="w-full sm:w-auto">
                    Visit Store
                  </Button>
                </a>
              </div>

              <div className="mt-5 flex items-start gap-3 rounded-xl border border-violet-100 bg-violet-50 p-4">
                <ShieldCheck size={20} strokeWidth={1.75} className="mt-0.5 shrink-0 text-violet-600" />
                <div>
                  <div className="text-sm font-semibold text-violet-900">Shop with confidence</div>
                  <p className="text-sm text-violet-700/80">
                    We track your visit and purchase so your cashback is credited correctly.
                  </p>
                </div>
              </div>
            </div>

            {store.description && (
              <div className="mt-6 rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-slate-900">About {store.name}</h2>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{store.description}</p>
              </div>
            )}

            <div className="mt-6 rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-lg font-bold text-slate-900">How Cashback Works</h2>
              <ol className="mt-4 grid gap-4 sm:grid-cols-3">
                {[
                  { n: 1, t: "Click Earn Cashback", d: `Start your trip to ${store.name} from here while logged in.` },
                  { n: 2, t: "Shop as usual", d: "Complete your purchase in the same session." },
                  { n: 3, t: "Get cashback", d: "Tracked automatically, credited once confirmed." },
                ].map((step) => (
                  <li key={step.n} className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-violet-600 text-xs font-bold text-white">
                      {step.n}
                    </span>
                    <div className="mt-2 text-sm font-semibold text-slate-900">{step.t}</div>
                    <p className="mt-1 text-xs text-slate-500">{step.d}</p>
                  </li>
                ))}
              </ol>
            </div>

            {store.terms && (
              <div className="mt-6 rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
                <h2 className="text-lg font-bold text-slate-900">Terms &amp; Conditions</h2>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                  {store.terms}
                </p>
              </div>
            )}
          </div>

          {/* Right sidebar */}
          <aside className="w-full shrink-0 lg:w-80">
            <div className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card">
              <h2 className="text-base font-bold text-slate-900">{store.name} Cashback Rate</h2>
              <div className="mt-3 flex items-baseline justify-between border-b border-slate-100 pb-3">
                <span className="text-sm text-slate-600">All categories</span>
                <span className="font-bold text-cashlime-700">{store.cashbackDisplayText}</span>
              </div>
              <p className="mt-3 text-xs text-slate-500">
                Cashback is calculated on the eligible order value after discounts, and confirmed
                once {store.name} validates the order.
              </p>
            </div>

            <div className="mt-6 rounded-xl2 border border-cashlime-500/30 bg-cashlime-50 p-6">
              <h2 className="text-base font-bold text-slate-900">Important Tips</h2>
              <ul className="mt-3 space-y-2.5 text-sm text-slate-700">
                {[
                  "Click Earn Cashback and complete your purchase in the same session.",
                  "Clear your cart before starting a tracked trip.",
                  "Returns and cancellations are not eligible for cashback.",
                ].map((tip) => (
                  <li key={tip} className="flex gap-2">
                    <CheckCircle2
                      size={16}
                      strokeWidth={2}
                      className="mt-0.5 shrink-0 text-cashlime-700"
                    />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        </div>

        {relatedStores.length > 0 && (
          <section className="mt-10">
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
    </div>
  );
}
