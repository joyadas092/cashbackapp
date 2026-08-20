import Link from "next/link";
import type { CmsPageStatus, CmsPageType, Prisma } from "@prisma/client";
import { Archive, Eye, FileText, PencilLine, Search, Send } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminCard,
  AdminPageHeader,
  AdminPagination,
  AdminStat,
} from "@/components/admin/ui";
import { TopStoresDonut } from "@/components/admin/AdminCharts";
import { CmsPagesManager, type CmsPageRow } from "@/components/admin/CmsPagesManager";
import { reportDateTime } from "@/lib/adminReports";

const PAGE_SIZE = 15;

const selectClass =
  "rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-violet-400";

const TYPE_LABELS: Record<string, string> = {
  STATIC: "Static Page",
  CUSTOM: "Custom Page",
  LANDING: "Landing Page",
};

export default async function AdminCmsPagesPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; type?: string; page?: string };
}) {
  await requireAdminSession("/admin/cms-pages");

  const query = (searchParams.q ?? "").trim();
  const statusParam = searchParams.status ?? "all";
  const typeParam = searchParams.type ?? "all";
  const status = ["PUBLISHED", "DRAFT", "ARCHIVED"].includes(statusParam) ? statusParam : "all";
  const type = ["STATIC", "CUSTOM", "LANDING"].includes(typeParam) ? typeParam : "all";
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where: Prisma.CmsPageWhereInput = {
    ...(query
      ? {
          OR: [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } },
          ],
        }
      : {}),
    ...(status !== "all" ? { status: status as CmsPageStatus } : {}),
    ...(type !== "all" ? { type: type as CmsPageType } : {}),
  };

  const [rows, total, statusCounts, typeCounts, viewsAgg, allPages, topPages, recent] =
    await Promise.all([
      prisma.cmsPage.findMany({
        where,
        orderBy: { updatedAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: { updatedBy: { select: { name: true } } },
      }),
      prisma.cmsPage.count({ where }),
      prisma.cmsPage.groupBy({ by: ["status"], _count: { _all: true } }),
      prisma.cmsPage.groupBy({ by: ["type"], _count: { _all: true } }),
      prisma.cmsPage.aggregate({ _sum: { views: true } }),
      prisma.cmsPage.count(),
      prisma.cmsPage.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { views: "desc" },
        take: 5,
        select: { id: true, title: true, slug: true, views: true },
      }),
      prisma.cmsPage.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        select: {
          id: true,
          title: true,
          status: true,
          updatedAt: true,
          updatedBy: { select: { name: true } },
        },
      }),
    ]);

  const countFor = (value: string) =>
    statusCounts.find((row) => row.status === value)?._count._all ?? 0;

  const typeSlices = typeCounts
    .map((row) => ({ name: TYPE_LABELS[row.type] ?? row.type, value: row._count._all }))
    .sort((a, b) => b.value - a.value);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageHref = (target: number) => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (status !== "all") params.set("status", status);
    if (type !== "all") params.set("type", type);
    if (target > 1) params.set("page", String(target));
    const search = params.toString();
    return `/admin/cms-pages${search ? `?${search}` : ""}`;
  };

  const stats = [
    { label: "Total Pages", value: String(allPages), icon: FileText, tone: "bg-violet-50 text-violet-600", delta: null },
    { label: "Published", value: String(countFor("PUBLISHED")), icon: Send, tone: "bg-cashlime-50 text-cashlime-700", delta: null },
    { label: "Drafts", value: String(countFor("DRAFT")), icon: PencilLine, tone: "bg-amber-50 text-amber-600", delta: null },
    { label: "Archived", value: String(countFor("ARCHIVED")), icon: Archive, tone: "bg-rose-50 text-rose-600", delta: null },
    { label: "Total Page Views", value: String(viewsAgg._sum.views ?? 0), icon: Eye, tone: "bg-sky-50 text-sky-600", delta: null },
  ];

  const tableRows: CmsPageRow[] = rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt ?? "",
    body: row.body,
    type: row.type,
    status: row.status,
    seoTitle: row.seoTitle ?? "",
    seoDescription: row.seoDescription ?? "",
    showInFooter: row.showInFooter,
    sortOrder: row.sortOrder,
    views: row.views,
    updatedAt: row.updatedAt.toISOString(),
    updatedByName: row.updatedBy?.name ?? null,
  }));

  return (
    <div>
      <AdminPageHeader
        title="CMS Pages"
        subtitle="Public site pages — terms, privacy, about and anything else you want to publish."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map((stat) => (
          <AdminStat key={stat.label} {...stat} />
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_340px]">
        <AdminCard padded={false}>
          <form action="/admin/cms-pages" className="flex flex-wrap items-center gap-2 px-5 pt-5">
            <div className="relative min-w-[200px] flex-1">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search by page title or slug..."
                aria-label="Search pages"
                className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400"
              />
            </div>

            <select name="status" defaultValue={status} aria-label="Filter by status" className={selectClass}>
              <option value="all">All Status</option>
              <option value="PUBLISHED">Published</option>
              <option value="DRAFT">Draft</option>
              <option value="ARCHIVED">Archived</option>
            </select>

            <select name="type" defaultValue={type} aria-label="Filter by type" className={selectClass}>
              <option value="all">All Page Types</option>
              <option value="STATIC">Static Page</option>
              <option value="CUSTOM">Custom Page</option>
              <option value="LANDING">Landing Page</option>
            </select>

            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
            >
              Apply
            </button>

            {(query || status !== "all" || type !== "all") && (
              <Link
                href="/admin/cms-pages"
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Clear
              </Link>
            )}
          </form>

          <CmsPagesManager pages={tableRows} />

          <AdminPagination
            page={page}
            totalPages={totalPages}
            total={total}
            noun="pages"
            hrefForPage={pageHref}
          />
        </AdminCard>

        <aside className="space-y-6">
          <AdminCard title="Page Type Distribution" padded={false}>
            <div className="px-5 pb-5 pt-4">
              <TopStoresDonut
                data={typeSlices}
                total={allPages}
                centreLabel="Pages"
                valueFormat="count"
                emptyMessage="No pages yet."
              />
            </div>
          </AdminCard>

          <AdminCard title="Top Pages by Views">
            {topPages.length === 0 ? (
              <p className="text-sm text-slate-500">Nothing published yet.</p>
            ) : (
              <ol className="space-y-3">
                {topPages.map((row, i) => (
                  <li key={row.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                      {i + 1}
                    </span>
                    <a
                      href={`/pages/${row.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="min-w-0 flex-1 truncate text-sm text-slate-700 hover:text-violet-700"
                    >
                      {row.title}
                    </a>
                    <span className="shrink-0 text-sm font-bold text-slate-900">{row.views}</span>
                  </li>
                ))}
              </ol>
            )}
          </AdminCard>

          <AdminCard title="Recent Page Activity">
            {recent.length === 0 ? (
              <p className="text-sm text-slate-500">No pages yet.</p>
            ) : (
              <ul className="space-y-3">
                {recent.map((row) => (
                  <li key={row.id} className="flex items-start gap-2.5">
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                        row.status === "PUBLISHED"
                          ? "bg-cashlime-500"
                          : row.status === "DRAFT"
                            ? "bg-amber-500"
                            : "bg-slate-300"
                      }`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-800">
                        {row.title}
                      </span>
                      <span className="block text-xs text-slate-400">
                        {reportDateTime(row.updatedAt)}
                        {row.updatedBy?.name ? ` · by ${row.updatedBy.name}` : ""}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </AdminCard>
        </aside>
      </div>
    </div>
  );
}
