import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const logoSchema = z.object({ logoUrl: z.string().url().max(2048) });

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
  const parsed = logoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid logo URL" }, { status: 400 });
  }

  await prisma.store.update({ where: { id: store.id }, data: { logoUrl: parsed.data.logoUrl } });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "store_logo_update",
      entityType: "Store",
      entityId: store.id,
      metadata: { from: store.logoUrl, to: parsed.data.logoUrl },
    },
  });

  return NextResponse.json({ logoUrl: parsed.data.logoUrl });
}
