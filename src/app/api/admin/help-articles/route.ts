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

/** Create a help article or FAQ. */
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const parsed = helpArticleSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid article" },
      { status: 400 }
    );
  }

  try {
    const article = await prisma.helpArticle.create({
      data: { ...parsed.data, excerpt: parsed.data.excerpt ?? null },
      select: { id: true, slug: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "help_article_create",
        entityType: "HelpArticle",
        entityId: article.id,
        metadata: { slug: article.slug },
      },
    });

    return NextResponse.json(article, { status: 201 });
  } catch (err) {
    // Slugs are unique — they're the article's public URL.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }
    throw err;
  }
}
