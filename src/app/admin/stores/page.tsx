import Link from "next/link";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { StoreStatusToggle } from "@/components/admin/StoreStatusToggle";
import { StoreLogoEditor } from "@/components/admin/StoreLogoEditor";

export default async function AdminStoresPage() {
  await requireAdminSession("/admin/stores");

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    include: { category: true, cashbackRules: { where: { isActive: true }, take: 1 } },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold">Stores</h1>
      <div className="mt-6 overflow-x-auto rounded-xl2 border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase text-slate-500">
            <tr>
              <th className="px-4 py-3">Store</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Store Logo</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Rate</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {stores.map((store) => (
              <tr key={store.id}>
                <td className="px-4 py-3 font-medium text-slate-900">{store.name}</td>
                <td className="px-4 py-3 text-slate-600">{store.category.name}</td>
                <td className="px-4 py-3">
                  <StoreLogoEditor storeId={store.id} logoUrl={store.logoUrl} />
                </td>
                <td className="px-4 py-3">
                  <span
                    className={
                      store.status === "ACTIVE"
                        ? "rounded-full bg-cashlime-500/15 px-3 py-1 text-xs font-semibold text-cashlime-700"
                        : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500"
                    }
                  >
                    {store.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-slate-600">
                  {store.cashbackRules[0] ? "Configured" : "Not set"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <StoreStatusToggle storeId={store.id} status={store.status} />
                    <Link
                      href={`/admin/stores/${store.id}/rates`}
                      className="text-xs font-medium text-violet-600 hover:underline"
                    >
                      Rates
                    </Link>
                    <Link
                      href={`/admin/stores/${store.id}/page-content`}
                      className="text-xs font-medium text-violet-600 hover:underline"
                    >
                      Page Content
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
