import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cashbackRuleSchema } from "@/lib/validation/schemas";
import { validateCommissionRule } from "@/lib/commission/engine";

export async function PUT(req: NextRequest, { params }: { params: { storeId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = cashbackRuleSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid input" }, { status: 400 });
  }

  validateCommissionRule(parsed.data);

  const existing = await prisma.cashbackRule.findFirst({ where: { storeId: store.id, isActive: true } });

  const data = {
    customerPct: parsed.data.customerPct,
    profitLinkPct: parsed.data.profitLinkPct,
    referralPct: parsed.data.referralPct,
    platformPct: parsed.data.platformPct,
    fixedAmount: parsed.data.fixedAmount ?? null,
    maxCashback: parsed.data.maxCashback ?? null,
    minOrderValue: parsed.data.minOrderValue ?? null,
    validityDays: parsed.data.validityDays ?? null,
    isActive: parsed.data.isActive,
  };

  const rule = existing
    ? await prisma.cashbackRule.update({ where: { id: existing.id }, data })
    : await prisma.cashbackRule.create({ data: { storeId: store.id, ...data } });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: existing ? "cashback_rule_update" : "cashback_rule_create",
      entityType: "CashbackRule",
      entityId: rule.id,
      metadata: {
        storeId: store.id,
        before: existing
          ? {
              customerPct: Number(existing.customerPct),
              profitLinkPct: Number(existing.profitLinkPct),
              referralPct: Number(existing.referralPct),
              platformPct: Number(existing.platformPct),
            }
          : null,
        after: data,
      },
    },
  });

  return NextResponse.json({ id: rule.id });
}
