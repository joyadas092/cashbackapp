import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronDown, CircleHelp } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export default async function FaqsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/help/faqs");
  }

  const faqs = await prisma.helpArticle.findMany({
    where: { isPublished: true, isFaq: true },
    orderBy: [{ category: "asc" }, { sortOrder: "asc" }],
    select: { id: true, title: true, body: true, category: true },
  });

  // Grouped so a long list stays scannable rather than one flat run of answers.
  const byCategory = new Map<string, typeof faqs>();
  for (const faq of faqs) {
    const list = byCategory.get(faq.category) ?? [];
    list.push(faq);
    byCategory.set(faq.category, list);
  }

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">FAQs</span>
      </nav>

      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
          Frequently Asked Questions
        </h1>
        <p className="mt-1 text-slate-500">Quick answers to the things people ask most.</p>
      </header>

      {faqs.length === 0 ? (
        <div className="mt-6 rounded-xl2 border border-slate-200 bg-white px-5 py-16 text-center shadow-card">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <CircleHelp size={22} strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-700">No FAQs published yet</p>
          <Link
            href="/dashboard/help/tickets/new"
            className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
          >
            Ask us directly
          </Link>
        </div>
      ) : (
        <div className="mt-6 max-w-3xl space-y-8">
          {Array.from(byCategory.entries()).map(([category, items]) => (
            <section key={category}>
              <h2 className="text-lg font-bold text-slate-900">{category}</h2>
              <div className="mt-3 space-y-3">
                {items.map((faq) => (
                  <details
                    key={faq.id}
                    className="group rounded-xl2 border border-slate-200 bg-white p-4 shadow-card"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-slate-900">
                      {faq.title}
                      <ChevronDown
                        size={17}
                        strokeWidth={2.5}
                        className="shrink-0 text-slate-400 transition-transform group-open:rotate-180"
                      />
                    </summary>
                    <p className="mt-2.5 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                      {faq.body}
                    </p>
                  </details>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
