import { notFound } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { siteUrl } from "@/lib/siteUrl";

/** Published pages only — a draft or archived page is a 404 to the public. */
async function getPage(slug: string) {
  return prisma.cmsPage.findFirst({ where: { slug, status: "PUBLISHED" } });
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const page = await getPage(params.slug);
  if (!page) return {};

  return {
    title: page.seoTitle ?? page.title,
    description: page.seoDescription ?? page.excerpt ?? undefined,
    alternates: { canonical: `/pages/${page.slug}` },
    openGraph: {
      title: page.seoTitle ?? page.title,
      description: page.seoDescription ?? page.excerpt ?? undefined,
      url: `${siteUrl()}/pages/${page.slug}`,
      type: "article",
    },
  };
}

export default async function CmsPageView({ params }: { params: { slug: string } }) {
  const page = await getPage(params.slug);
  if (!page) notFound();

  // Fire-and-forget: a failed counter must never break the page a reader came
  // for, and the count is advisory anyway.
  prisma.cmsPage
    .update({ where: { id: page.id }, data: { views: { increment: 1 } } })
    .catch(() => undefined);

  const updated = page.updatedAt.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-slate-50">
      <div className="mx-auto max-w-3xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
          <Link href="/" className="hover:text-violet-700">
            Home
          </Link>
          <span className="text-slate-300">›</span>
          <span className="font-semibold text-slate-800">{page.title}</span>
        </nav>

        <article className="rounded-xl2 border border-slate-200 bg-white p-6 shadow-card sm:p-8">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            {page.title}
          </h1>
          {page.excerpt && <p className="mt-2 text-slate-500">{page.excerpt}</p>}
          <p className="mt-3 text-xs text-slate-400">Last updated {updated}</p>

          {/* Body is plain text written in the admin panel and rendered as
              paragraphs — never as HTML, so a page can't inject markup or
              script into the public site. */}
          <div className="mt-6 space-y-4 border-t border-slate-100 pt-6">
            {page.body
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
      </div>
    </div>
  );
}
