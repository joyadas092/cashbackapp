import { notFound } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { RateEditorForm } from "@/components/admin/RateEditorForm";

export default async function AdminStoreRatesPage({ params }: { params: { storeId: string } }) {
  await requireAdminSession(`/admin/stores/${params.storeId}/rates`);

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });
  if (!store) notFound();

  const rule = await prisma.cashbackRule.findFirst({ where: { storeId: store.id, isActive: true } });

  return (
    <div>
      <h1 className="text-2xl font-bold">{store.name} — Commission Rates</h1>
      <p className="mt-1 text-sm text-white/60">
        Customer + Profit Link + Referral + Platform must not exceed 100%.
      </p>

      <div className="mt-6">
        <RateEditorForm
          storeId={store.id}
          initial={
            rule
              ? {
                  customerPct: Number(rule.customerPct),
                  profitLinkPct: Number(rule.profitLinkPct),
                  referralPct: Number(rule.referralPct),
                  platformPct: Number(rule.platformPct),
                  fixedAmount: rule.fixedAmount != null ? Number(rule.fixedAmount) : null,
                  maxCashback: rule.maxCashback != null ? Number(rule.maxCashback) : null,
                  minOrderValue: rule.minOrderValue != null ? Number(rule.minOrderValue) : null,
                  validityDays: rule.validityDays,
                  isActive: rule.isActive,
                }
              : null
          }
        />
      </div>
    </div>
  );
}
