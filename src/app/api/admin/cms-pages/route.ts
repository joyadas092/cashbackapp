import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { cmsPageSchema } from "@/lib/validation/schemas";

/** Slugs that would shadow a real route if a page claimed them. */
const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "dashboard",
  "login",
  "register",
  "stores",
  "go",
  "p",
  "ref",
  "refer",
  "share-earn",
  "refer-earn",
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = cmsPageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid page" },
      { status: 400 }
    );
  }

  if (RESERVED_SLUGS.has(parsed.data.slug)) {
    return NextResponse.json(
      { error: `"${parsed.data.slug}" is reserved by the app. Pick another slug.` },
      { status: 400 }
    );
  }

  try {
    const page = await prisma.cmsPage.create({
      data: {
        ...parsed.data,
        excerpt: parsed.data.excerpt ?? null,
        seoTitle: parsed.data.seoTitle ?? null,
        seoDescription: parsed.data.seoDescription ?? null,
        updatedById: session.user.id,
        // Stamped the first time it goes live, so "published on" is real rather
        // than just the last time anyone touched the row.
        publishedAt: parsed.data.status === "PUBLISHED" ? new Date() : null,
      },
      select: { id: true, slug: true },
    });

    await prisma.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "cms_page_create",
        entityType: "CmsPage",
        entityId: page.id,
        metadata: { slug: page.slug, status: parsed.data.status },
      },
    });

    return NextResponse.json(page, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That slug is already in use." }, { status: 409 });
    }
    throw err;
  }
}
