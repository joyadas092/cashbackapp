import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { helpArticleSchema } from "@/lib/validation/schemas";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") return null;
  return session;
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = helpArticleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid article" },
      { status: 400 }
    );
  }

  const existing = await prisma.helpArticle.findUnique({
    where: { id: params.id },
    select: { id: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Article not found" }, { status: 404 });
  }

  try {
    const article = await prisma.helpArticle.update({
      where: { id: existing.id },
      data: { ...parsed.data, excerpt: parsed.data.excerpt ?? null },
      select: { id: true, slug: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "help_article_update",
        entityType: "HelpArticle",
        entityId: article.id,
        metadata: { slug: article.slug },
      },
    });

    return NextResponse.json(article);
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

  // deleteMany is a no-op on zero rows, so deleting an already-deleted article
  // succeeds rather than throwing.
  const result = await prisma.helpArticle.deleteMany({ where: { id: params.id } });

  if (result.count > 0) {
    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "help_article_delete",
        entityType: "HelpArticle",
        entityId: params.id,
        metadata: {},
      },
    });
  }

  return NextResponse.json({ ok: true, deleted: result.count });
}
