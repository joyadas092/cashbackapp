import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, { params }: { params: { slug: string } }) {
  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    include: { category: true },
  });

  if (!store || store.status !== "ACTIVE") {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  return NextResponse.json(store);
}
