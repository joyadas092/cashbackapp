import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const categories = await prisma.storeCategory.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(categories);
}
