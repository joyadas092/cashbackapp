import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, FileText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HelpSearch } from "@/components/support/HelpSearch";

export default async function HelpArticlesPage({
  searchParams,
}: {
  searchParams: { q?: string; category?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/help/articles");
  }

  const query = (searchParams.q ?? "").trim();
  const category = (searchParams.category ?? "").trim();

  const where = {
    isPublished: true,
    isFaq: false,
    ...(category ? { category } : {}),
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" as const } },
            { excerpt: { contains: query, mode: "insensitive" as const } },
            { body: { contains: query, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [articles, categories] = await Promise.all([
    prisma.helpArticle.findMany({
      where,
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      take: 100,
      select: { id: true, slug: true, title: true, excerpt: true, category: true },
    }),
    prisma.helpArticle.groupBy({
      by: ["category"],
      where: { isPublished: true, isFaq: false },
      _count: { _all: true },
      orderBy: { category: "asc" },
    }),
  ]);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">Help Center</span>
      </nav>

      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Help Center</h1>
        <p className="mt-1 text-slate-500">
          Guides and answers, written by our team.
        </p>
      </header>

      <div className="mt-5 max-w-2xl">
        <HelpSearch initialQuery={query} placeholder="Search help articles..." />
      </div>

      {categories.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href="/dashboard/help/articles"
            className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              category === ""
                ? "border-violet-600 bg-violet-600 text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c.category}
              href={`/dashboard/help/articles?category=${encodeURIComponent(c.category)}`}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                category === c.category
                  ? "border-violet-600 bg-violet-600 text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-violet-300"
              }`}
            >
              {c.category} ({c._count._all})
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 rounded-xl2 border border-slate-200 bg-white shadow-card">
        {articles.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <FileText size={22} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">
              {query ? `Nothing found for "${query}"` : "No articles yet"}
            </p>
            <p className="mt-1 text-sm text-slate-500">
              Our team can still help — raise a ticket and describe the problem.
            </p>
            <Link
              href="/dashboard/help/tickets/new"
              className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
            >
              Contact Support
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {articles.map((article) => (
              <li key={article.id}>
                <Link
                  href={`/dashboard/help/articles/${article.slug}`}
                  className="flex items-center gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/60"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                    <FileText size={16} strokeWidth={1.75} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {article.title}
                    </span>
                    {article.excerpt && (
                      <span className="block truncate text-xs text-slate-500">
                        {article.excerpt}
                      </span>
                    )}
                  </span>
                  <span className="hidden shrink-0 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600 sm:block">
                    {article.category}
                  </span>
                  <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-slate-300" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
