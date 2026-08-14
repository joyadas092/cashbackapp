import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { storeStatusSchema } from "@/lib/validation/schemas";

export async function PATCH(req: NextRequest, { params }: { params: { storeId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({ where: { id: params.storeId } });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const body = await req.json().catch(() => null);
  const parsed = storeStatusSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  if (parsed.data.status === "ACTIVE") {
    const activeRule = await prisma.cashbackRule.findFirst({ where: { storeId: store.id, isActive: true } });
    if (!activeRule) {
      return NextResponse.json(
        { error: "Cannot activate a store with no active cashback rule — set one first." },
        { status: 400 }
      );
    }
  }

  await prisma.store.update({ where: { id: store.id }, data: { status: parsed.data.status } });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "store_status_change",
      entityType: "Store",
      entityId: store.id,
      metadata: { from: store.status, to: parsed.data.status },
    },
  });

  return NextResponse.json({ status: parsed.data.status });
}
