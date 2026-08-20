import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cmsPageSchema } from "@/lib/validation/schemas";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = cmsPageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid page" },
      { status: 400 }
    );
  }

  const existing = await prisma.cmsPage.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, publishedAt: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Page not found" }, { status: 404 });
  }

  const goingLive = parsed.data.status === "PUBLISHED" && existing.status !== "PUBLISHED";

  try {
    const page = await prisma.cmsPage.update({
      where: { id: existing.id },
      data: {
        ...parsed.data,
        excerpt: parsed.data.excerpt ?? null,
        seoTitle: parsed.data.seoTitle ?? null,
        seoDescription: parsed.data.seoDescription ?? null,
        updatedById: session.user.id,
        // Only set on the transition to live; re-saving a published page keeps
        // its original publish date.
        ...(goingLive ? { publishedAt: new Date() } : {}),
      },
      select: { id: true, slug: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "cms_page_update",
        entityType: "CmsPage",
        entityId: page.id,
        metadata: { slug: page.slug, statusFrom: existing.status, statusTo: parsed.data.status },
      },
    });

    return NextResponse.json(page);
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }
    throw err;
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // deleteMany is a no-op on zero rows, so deleting twice succeeds rather than
  // throwing.
  const result = await prisma.cmsPage.deleteMany({ where: { id: params.id } });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "cms_page_delete",
        entityType: "CmsPage",
        entityId: params.id,
        metadata: {},
      },
    });
  }

  return NextResponse.json({ ok: true, deleted: result.count });
}
