import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowRight, MessagesSquare } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function HelpArticlePage({ params }: { params: { slug: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/dashboard/help/articles/${params.slug}`);
  }

  const article = await prisma.helpArticle.findUnique({ where: { slug: params.slug } });
  if (!article || !article.isPublished) notFound();

  // Fire-and-forget: a failed counter increment should never break the page the
  // reader came for.
  prisma.helpArticle
    .update({ where: { id: article.id }, data: { viewCount: { increment: 1 } } })
    .catch(() => undefined);

  const related = await prisma.helpArticle.findMany({
    where: {
      isPublished: true,
      isFaq: false,
      category: article.category,
      id: { not: article.id },
    },
    orderBy: { sortOrder: "asc" },
    take: 4,
    select: { id: true, slug: true, title: true },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <Link href="/dashboard/help/articles" className="hover:text-violet-700">
          Help Center
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">{article.title}</span>
      </nav>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <span className="rounded-full bg-violet-50 px-3 py-1 text-xs font-semibold text-violet-700">
            {article.category}
          </span>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-900">
            {article.title}
          </h1>
          {article.excerpt && <p className="mt-2 text-slate-500">{article.excerpt}</p>}

          {/* Body is plain text authored in the admin panel, rendered as
              paragraphs — never as HTML, so an article can't inject markup. */}
          <div className="mt-6 space-y-4">
            {article.body
              .split(/\n\s*\n/)
              .map((paragraph) => paragraph.trim())
              .filter(Boolean)
              .map((paragraph, i) => (
                <p key={i} className="whitespace-pre-line leading-relaxed text-slate-700">
                  {paragraph}
                </p>
              ))}
          </div>
        </article>

        <aside className="space-y-6">
          <div className="rounded-xl2 border border-violet-200 bg-violet-50/60 p-5">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-600 text-white">
              <MessagesSquare size={19} strokeWidth={1.75} />
            </span>
            <h2 className="mt-3 font-bold text-slate-900">Still need help?</h2>
            <p className="mt-1 text-sm text-slate-600">
              Raise a ticket and our support team will look into your account directly.
            </p>
            <Link
              href="/dashboard/help/tickets/new"
              className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
            >
              Contact Support
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {related.length > 0 && (
            <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="font-bold text-slate-900">More in {article.category}</h2>
              <ul className="mt-3 space-y-2">
                {related.map((r) => (
                  <li key={r.id}>
                    <Link
                      href={`/dashboard/help/articles/${r.slug}`}
                      className="block text-sm text-slate-600 hover:text-violet-700 hover:underline"
                    >
                      {r.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
