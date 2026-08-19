import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Toggle the signed-in user's favorite for a store.
 *
 * Both directions are written to be safe under a double-click: the create
 * swallows the unique-constraint violation (already a favorite) and the delete
 * uses deleteMany, which is a no-op on zero rows rather than an error. So the
 * response always reflects the true final state, never a transient race.
 */
export async function POST(_req: Request, { params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const store = await prisma.store.findUnique({
    where: { slug: params.slug },
    select: { id: true },
  });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const existing = await prisma.storeFavorite.findUnique({
    where: { userId_storeId: { userId: session.user.id, storeId: store.id } },
    select: { id: true },
  });

  if (existing) {
    await prisma.storeFavorite.deleteMany({
      where: { userId: session.user.id, storeId: store.id },
    });
    return NextResponse.json({ favorited: false });
  }

  try {
    await prisma.storeFavorite.create({
      data: { userId: session.user.id, storeId: store.id },
    });
  } catch (err) {
    // P2002 = someone (another tab, a double-click) already created it.
    if (!(err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002")) {
      throw err;
    }
  }

  return NextResponse.json({ favorited: true });
}
