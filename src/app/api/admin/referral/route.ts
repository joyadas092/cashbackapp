import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * The single active ReferralRule — both the payout constraints the referral
 * engine enforces and the figures advertised on the public /refer-earn page.
 *
 * There is deliberately one active rule rather than a list: the payout engine
 * (src/lib/postback/processor.ts) resolves it with findFirst({ isActive: true }),
 * so a second active row would make payouts depend on row order. Saving here
 * deactivates any other active rule in the same transaction.
 */

const nullableMoney = z.coerce.number().min(0).max(9_999_999).nullable().optional();
const nullableText = z
  .string()
  .trim()
  .max(300)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .optional();

const bodySchema = z.object({
  headlineRatePct: z.coerce.number().min(0).max(100).nullable().optional(),
  publicHeadline: nullableText,
  publicSubtext: nullableText,
  fixedBonus: nullableMoney,
  durationDays: z.coerce.number().int().min(1).max(3650).nullable().optional(),
  maxTotalEarning: nullableMoney,
  minOrderValue: nullableMoney,
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid referral settings" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.referralRule.findFirst({ where: { isActive: true } });

    const rule = existing
      ? await tx.referralRule.update({ where: { id: existing.id }, data })
      : await tx.referralRule.create({ data: { ...data, isActive: true } });

    // Guarantee the "single active rule" invariant the payout engine relies on.
    await tx.referralRule.updateMany({
      where: { isActive: true, id: { not: rule.id } },
      data: { isActive: false },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "referral_rule_update",
        entityType: "ReferralRule",
        entityId: rule.id,
        metadata: {
          headlineRatePct: data.headlineRatePct ?? null,
          durationDays: data.durationDays ?? null,
          maxTotalEarning: data.maxTotalEarning ?? null,
          minOrderValue: data.minOrderValue ?? null,
          fixedBonus: data.fixedBonus ?? null,
        },
      },
    });

    return rule;
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
