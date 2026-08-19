import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { HelpArticlesManager } from "@/components/admin/HelpArticlesManager";

export default async function AdminHelpArticlesPage() {
  await requireAdminSession("/admin/help-articles");

  const articles = await prisma.helpArticle.findMany({
    orderBy: [{ isFaq: "asc" }, { category: "asc" }, { sortOrder: "asc" }],
  });

  return (
    <HelpArticlesManager
      articles={articles.map((a) => ({
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt ?? "",
        body: a.body,
        category: a.category,
        isFaq: a.isFaq,
        isPopular: a.isPopular,
        isPublished: a.isPublished,
        sortOrder: a.sortOrder,
        viewCount: a.viewCount,
      }))}
    />
  );
}
