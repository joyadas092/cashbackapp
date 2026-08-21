import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { SETTING_KEYS, type PlatformSettings } from "@/lib/settings";

const bodySchema = z.object({
  siteName: z.string().trim().min(1).max(80).optional(),
  siteTagline: z.string().trim().max(160).optional(),
  adminEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),
  supportEmail: z.union([z.string().trim().email(), z.literal("")]).optional(),

  registrationEnabled: z.boolean().optional(),
  maintenanceMode: z.boolean().optional(),
  maintenanceMessage: z.string().trim().max(300).optional(),
  affiliateEnabled: z.boolean().optional(),
  referralEnabled: z.boolean().optional(),

  minWithdrawalAmount: z.coerce.number().min(1).max(1_000_000).optional(),
  maxWithdrawalAmount: z.coerce.number().min(1).max(10_000_000).optional(),
  profitLinkGuestCashback: z.enum(["SHARER", "PLATFORM"]).optional(),
  // Zero is meaningful here: never require a PAN.
  panRequiredAboveAmount: z.coerce.number().min(0).max(10_000_000).optional(),
  payoutMethods: z
    .array(z.enum(["UPI", "BANK_TRANSFER", "PAYTM", "AMAZON_PAY"]))
    .min(1, "Keep at least one payout method enabled")
    .optional(),

  seoTitle: z.string().trim().max(200).optional(),
  seoDescription: z.string().trim().max(300).optional(),
  searchIndexingEnabled: z.boolean().optional(),
});

/**
 * Save platform settings.
 *
 * Only the keys present in the request are written, so each tab can save
 * independently without clobbering the tabs an admin didn't open.
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid settings" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // Cross-field check the schema can't do on its own: a maximum below the
  // minimum would make every withdrawal impossible while both values look fine.
  if (
    data.minWithdrawalAmount !== undefined &&
    data.maxWithdrawalAmount !== undefined &&
    data.maxWithdrawalAmount < data.minWithdrawalAmount
  ) {
    return NextResponse.json(
      { error: "Maximum withdrawal must be at least the minimum." },
      { status: 400 }
    );
  }

  const entries = Object.entries(data) as Array<[keyof PlatformSettings, unknown]>;
  if (entries.length === 0) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    for (const [field, value] of entries) {
      const key = SETTING_KEYS[field];
      if (!key) continue;

      await tx.setting.upsert({
        where: { key },
        update: { value: value as never },
        create: { key, value: value as never },
      });
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "settings_update",
        entityType: "Setting",
        // Records which settings changed, never a dump of every value.
        metadata: { keys: entries.map(([field]) => SETTING_KEYS[field]) },
      },
    });
  });

  return NextResponse.json({ ok: true, updated: entries.length });
}
