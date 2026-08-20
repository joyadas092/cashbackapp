import Link from "next/link";
import type { ClickType } from "@prisma/client";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { shortClickId } from "@/lib/clickId";
import { DateRangeFilter } from "@/components/shared/DateRangeFilter";
import {
  dateRangeToParams,
  dateRangeWhere,
  parseDateRangeFromSearchParams,
} from "@/lib/dateRangeFilter";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { StoreLogo } from "@/components/store/StoreLogo";
import { LocalTime } from "@/components/shared/LocalTime";

const PAGE_SIZE = 30;

const FILTERS: Array<{ key: string; label: string; types: ClickType[] | null }> = [
  { key: "all", label: "All", types: null },
  { key: "cashback", label: "Cashback trips", types: ["DIRECT_CASHBACK"] },
  { key: "visits", label: "Store visits", types: ["VISIT_STORE"] },
  { key: "profit", label: "Profit links", types: ["PROFIT_LINK"] },
];

const TYPE_LABELS: Record<string, { label: string; tone: string }> = {
  DIRECT_CASHBACK: { label: "Cashback trip", tone: "bg-cashlime-50 text-cashlime-700" },
  VISIT_STORE: { label: "Store visit", tone: "bg-slate-100 text-slate-600" },
  PROFIT_LINK: { label: "Profit link", tone: "bg-violet-50 text-violet-700" },
};

function dateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminClicksPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  await requireAdminSession("/admin/clicks");

  const one = (key: string): string | undefined => {
    const value = searchParams[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const typeParam = one("type");
  const filterKey = FILTERS.some((f) => f.key === typeParam) ? (typeParam as string) : "all";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, parseInt(one("page") ?? "1", 10) || 1);

  const range = parseDateRangeFromSearchParams(searchParams);
  const createdAtFilter = dateRangeWhere(range);
  const rangeSuffix = dateRangeToParams(range).toString();
  const rangeQs = rangeSuffix ? `&${rangeSuffix}` : "";

  const where = {
    ...(filter.types ? { clickType: { in: filter.types } } : {}),
    ...(createdAtFilter ? { createdAt: createdAtFilter } : {}),
  };

  const [clicks, total, counts] = await Promise.all([
    prisma.click.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        store: { select: { name: true, slug: true, logoUrl: true } },
        user: { select: { id: true, name: true } },
        profitLink: { select: { code: true, user: { select: { name: true } } } },
        _count: { select: { transactions: true } },
      },
    }),
    prisma.click.count({ where }),
    prisma.click.groupBy({
      by: ["clickType"],
      where: createdAtFilter ? { createdAt: createdAtFilter } : {},
      _count: { _all: true },
    }),
  ]);

  const countByType = new Map(counts.map((c) => [c.clickType, c._count._all]));
  const countFor = (types: ClickType[] | null) =>
    types === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : types.reduce((sum, t) => sum + (countByType.get(t) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader
        title="Clicks"
        subtitle="Every tracked click, and whether it turned into an order."
      />

      <AdminCard padded={false}>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={`/admin/clicks?type=${f.key}${rangeQs}`}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label} ({countFor(f.types)})
              </Link>
            );
          })}
        </nav>

        {/* GET form so the range stays in the URL and survives paging. */}
        <form
          action="/admin/clicks"
          className="flex flex-wrap items-center gap-2 border-b border-slate-200 bg-slate-50/60 px-4 py-3 sm:px-5"
        >
          <input type="hidden" name="type" value={filterKey} />
          <DateRangeFilter
            range={range}
            basePath="/admin/clicks"
            hiddenFields={{ type: filterKey }}
          />
          <button
            type="submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Apply
          </button>
        </form>

        {clicks.length === 0 ? (
          <AdminEmpty title="No clicks recorded" />
        ) : (
          <AdminTableWrap minWidth={980}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>Date</AdminTh>
                <AdminTh>Click ID</AdminTh>
                <AdminTh>Store</AdminTh>
                <AdminTh>Type</AdminTh>
                <AdminTh>Who</AdminTh>
                <AdminTh>Converted</AdminTh>
                <AdminTh>Status</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {clicks.map((click) => {
                const meta = TYPE_LABELS[click.clickType] ?? {
                  label: click.clickType,
                  tone: "bg-slate-100 text-slate-600",
                };
                const viaProfitLink = click.clickType === "PROFIT_LINK";

                return (
                  <tr key={click.id} className="hover:bg-slate-50/60">
                    <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                      <LocalTime value={click.createdAt.toISOString()} />
                    </td>
                    {/* The full cuid on hover: it is the attribution key sent to
                        Cuelinks as subid=c_<id>, so support needs to copy it
                        exactly when chasing a missing transaction. */}
                    <td
                      className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600"
                      title={click.id}
                    >
                      {shortClickId(click.id)}
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex items-center gap-2 text-slate-800">
                        <span className="shrink-0 rounded-md ring-1 ring-slate-200">
                          <StoreLogo
                            src={click.store.logoUrl}
                            alt={click.store.name}
                            size={22}
                            fallbackSlug={click.store.slug}
                          />
                        </span>
                        {click.store.name}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge label={meta.label} tone={meta.tone} />
                    </td>
                    <td className="px-5 py-3">
                      {viaProfitLink ? (
                        <>
                          <span className="block text-slate-700">
                            Shared by {click.profitLink?.user.name ?? "—"}
                          </span>
                          <span className="block font-mono text-xs text-slate-400">
                            {click.profitLink?.code}
                          </span>
                        </>
                      ) : (
                        <span className="text-slate-700">{click.user?.name ?? "Guest"}</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {click._count.transactions > 0 ? (
                        <AdminBadge
                          label={`${click._count.transactions} order${click._count.transactions === 1 ? "" : "s"}`}
                          tone="bg-cashlime-50 text-cashlime-700"
                        />
                      ) : (
                        <span className="text-xs text-slate-400">Not yet</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <AdminBadge
                        label={click.status}
                        tone={
                          click.status === "TRACKED"
                            ? "bg-sky-50 text-sky-700"
                            : "bg-rose-50 text-rose-600"
                        }
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </AdminTableWrap>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="clicks"
          hrefForPage={(p) => `/admin/clicks?type=${filterKey}&page=${p}${rangeQs}`}
        />
      </AdminCard>
    </div>
  );
}
