import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/** Lightweight list for admin dropdowns (campaign-import "link to existing store"). */
export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const stores = await prisma.store.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, slug: true, merchantDomains: true },
  });

  return NextResponse.json({ stores });
}
