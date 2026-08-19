import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { ReferralSettingsEditor } from "@/components/admin/ReferralSettingsEditor";

/** Decimal | null -> the string the form shows. null becomes "", not "0". */
function toInput(value: { toString(): string } | null): string {
  return value === null ? "" : String(Number(value));
}

export default async function AdminReferralPage() {
  await requireAdminSession("/admin/referral");

  const rule = await prisma.referralRule.findFirst({ where: { isActive: true } });

  return (
    <ReferralSettingsEditor
      initial={{
        headlineRatePct: toInput(rule?.headlineRatePct ?? null),
        publicHeadline: rule?.publicHeadline ?? "",
        publicSubtext: rule?.publicSubtext ?? "",
        fixedBonus: toInput(rule?.fixedBonus ?? null),
        durationDays: rule?.durationDays === null || rule?.durationDays === undefined ? "" : String(rule.durationDays),
        maxTotalEarning: toInput(rule?.maxTotalEarning ?? null),
        minOrderValue: toInput(rule?.minOrderValue ?? null),
      }}
    />
  );
}
