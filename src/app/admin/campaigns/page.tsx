import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { CampaignBrowser } from "@/components/admin/CampaignBrowser";

export default async function AdminCampaignsPage() {
  await requireAdminSession("/admin/campaigns");

  const [categories, stores] = await Promise.all([
    prisma.storeCategory.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
    prisma.store.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, merchantDomains: true },
    }),
  ]);

  return (
    <div>
      <h1 className="text-2xl font-bold">Cuelinks Campaigns</h1>
      <p className="mt-1 text-sm text-white/60">
        Browse campaigns available on your Cuelinks account and link or import them as stores.
      </p>
      <div className="mt-6">
        <CampaignBrowser categories={categories} stores={stores} />
      </div>
    </div>
  );
}
