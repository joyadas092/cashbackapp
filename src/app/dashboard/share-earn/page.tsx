import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { CreateProfitLinkForm } from "@/components/profit-link/CreateProfitLinkForm";
import { ProfitLinkList } from "@/components/profit-link/ProfitLinkList";

export default async function ShareEarnPage() {
  const session = await auth();
  // See dashboard/page.tsx: layout also guards, but Next.js fetches layout
  // and page data in parallel, so this page must guard itself too.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/share-earn");
  }

  const links = await prisma.profitLink.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { store: { select: { name: true, slug: true, logoUrl: true } } },
  });

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Share & Earn</h1>
      <p className="mt-1 text-white/60">
        Don&apos;t just shop. Share and earn when others shop through your link.
      </p>

      <div className="mt-6">
        <CreateProfitLinkForm />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Your Links</h2>
        <ProfitLinkList
          items={links.map((link) => ({
            id: link.id,
            code: link.code,
            shareUrl: `/p/${link.code}`,
            clickCount: link.clickCount,
            status: link.status,
            createdAt: link.createdAt,
            store: link.store,
          }))}
        />
      </div>
    </div>
  );
}
