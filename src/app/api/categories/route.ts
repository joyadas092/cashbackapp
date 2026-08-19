import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// This handler takes no request input, so Next would otherwise prerender it at
// build time — which means querying the database from the build container. That
// database is unreachable during a Railway build, so keep it request-time only.
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.storeCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}
