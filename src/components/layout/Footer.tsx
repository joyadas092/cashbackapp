import Link from "next/link";
import { prisma } from "@/lib/db";

/**
 * Footer links come from published CMS pages that opted in, so publishing a
 * page in the admin panel is genuinely enough to make it reachable — no code
 * change and no hardcoded list that silently goes stale.
 */
export async function Footer() {
  const pages = await prisma.cmsPage
    .findMany({
      where: { status: "PUBLISHED", showInFooter: true },
      orderBy: [{ sortOrder: "asc" }, { title: "asc" }],
      select: { id: true, slug: true, title: true },
      take: 8,
    })
    // The footer must never take the whole page down; if this read fails the
    // links simply don't render.
    .catch(() => []);

  return (
    <footer className="border-t border-white/10 py-10 text-center text-sm text-white/40">
      {pages.length > 0 && (
        <nav aria-label="Site pages" className="mb-4 flex flex-wrap justify-center gap-x-6 gap-y-2">
          {pages.map((page) => (
            <Link
              key={page.id}
              href={`/pages/${page.slug}`}
              className="transition-colors hover:text-white/70"
            >
              {page.title}
            </Link>
          ))}
        </nav>
      )}
      <p>&copy; {new Date().getFullYear()} CashbackApp. Shop smarter, earn more.</p>
    </footer>
  );
}
