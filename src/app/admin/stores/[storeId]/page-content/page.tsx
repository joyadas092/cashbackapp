import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { StorePageContentEditor } from "@/components/admin/StorePageContentEditor";

/** Date -> yyyy-mm-dd for the editor's <input type="date">. */
function toDateInput(date: Date | null): string {
  return date ? date.toISOString().slice(0, 10) : "";
}

export default async function AdminStorePageContent({
  params,
}: {
  params: { storeId: string };
}) {
  await requireAdminSession(`/admin/stores/${params.storeId}/page-content`);

  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
    include: {
      categoryRates: { orderBy: { sortOrder: "asc" } },
      offers: { orderBy: { sortOrder: "asc" } },
    },
  });
  if (!store) notFound();

  return (
    <StorePageContentEditor
      storeId={store.id}
      storeSlug={store.slug}
      storeName={store.name}
      initial={{
        homepageUrl: store.homepageUrl ?? "",
        tagline: store.tagline ?? "",
        previousRate: store.previousRate ? String(Number(store.previousRate)) : "",
        visitTime: store.visitTime ?? "",
        trackingTime: store.trackingTime ?? "",
        paymentTime: store.paymentTime ?? "",
        description: store.description ?? "",
        terms: store.terms ?? "",
        storePolicies: store.storePolicies ?? "",
        importantTips: store.importantTips,
        categoryRates: store.categoryRates.map((r) => ({
          label: r.label,
          displayText: r.displayText,
        })),
        offers: store.offers.map((o) => ({
          badge: o.badge ?? "",
          title: o.title,
          description: o.description ?? "",
          code: o.code ?? "",
          validTill: toDateInput(o.validTill),
        })),
      }}
    />
  );
}
