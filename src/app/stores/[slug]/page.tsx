import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { StoreLogo } from "@/components/store/StoreLogo";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { LoginPromptModal } from "@/components/auth/LoginPromptModal";

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

  const session = await auth();
  const isLoggedIn = Boolean(session?.user);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <Card className="flex flex-col items-center gap-4 p-8 text-center sm:flex-row sm:text-left">
        <StoreLogo src={store.logoUrl} alt={store.name} size={80} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{store.name}</h1>
          <p className="mt-1 text-cashlime-400 font-semibold">
            Earn up to {store.cashbackDisplayText}
          </p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          {isLoggedIn ? (
            <a href={`/go/${store.slug}?intent=cashback`}>
              <Button variant="primary">Earn Cashback</Button>
            </a>
          ) : (
            <LoginPromptModal
              storeSlug={store.slug}
              storeName={store.name}
              trigger={<Button variant="primary">Earn Cashback</Button>}
            />
          )}
          <a href={`/go/${store.slug}?intent=visit`}>
            <Button variant="outline">Visit Store</Button>
          </a>
        </div>
      </Card>

      {store.description && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-bold">About {store.name}</h2>
          <p className="mt-2 text-sm text-white/70">{store.description}</p>
        </Card>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold">How Cashback Works</h2>
        <ol className="mt-3 space-y-2 text-sm text-white/70">
          <li>1. Click &quot;Earn Cashback&quot; above while logged in.</li>
          <li>2. Shop as usual at {store.name}.</li>
          <li>3. Your cashback is tracked and credited to your wallet once confirmed.</li>
        </ol>
      </Card>
    </div>
  );
}
