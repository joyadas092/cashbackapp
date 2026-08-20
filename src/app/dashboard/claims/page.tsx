import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Plus, ReceiptText } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { StoreLogo } from "@/components/store/StoreLogo";
import { LocalTime } from "@/components/shared/LocalTime";
import { CLAIM_ORDER_TYPE_META, CLAIM_STATUS_META } from "@/lib/claims";
import { shortClickId } from "@/lib/clickId";
import { formatInrExact } from "@/lib/utils";

export const metadata = {
  title: "Cashback Claims",
  description: "Track the missing-cashback claims you've raised.",
};

export default async function ClaimsPage({
  searchParams,
}: {
  searchParams: { raised?: string };
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/claims");
  }

  const claims = await prisma.cashbackClaim.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      claimNumber: true,
      orderType: true,
      claimedClickId: true,
      clickedAt: true,
      orderId: true,
      orderAmount: true,
      status: true,
      createdAt: true,
      store: { select: { name: true, slug: true, logoUrl: true } },
      attachment: { select: { id: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-3.5 py-5 sm:px-6 sm:py-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Cashback Claims
          </h1>
          <p className="mt-1 text-sm text-slate-500 sm:text-base">
            Missing cashback on an order you placed, or commission on a link you shared? Raise a
            claim and we&apos;ll chase it with the store.
          </p>
        </div>
        <Link
          href="/dashboard/claims/new"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Claim
        </Link>
      </header>

      {searchParams.raised && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-cashlime-500/30 bg-cashlime-50 px-4 py-3 text-sm text-cashlime-800">
          <CheckCircle2 size={16} strokeWidth={2} className="mt-0.5 shrink-0" />
          <span>
            Claim <span className="font-mono font-bold">{searchParams.raised}</span> raised. We
            usually have an answer within 7 working days, though the store can take longer.
          </span>
        </div>
      )}

      <div className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        {claims.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <ReceiptText size={22} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">No claims yet</p>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">
              If cashback hasn&apos;t appeared 48 hours after an order, raise a claim and we&apos;ll
              take it up with the store.
            </p>
            <Link
              href="/dashboard/claims/new"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-violet-500"
            >
              <Plus size={15} strokeWidth={2.5} />
              Raise your first claim
            </Link>
          </div>
        ) : (
          <>
            {/* Phones get cards; an eight-column table forces a sideways scroll. */}
            <ul className="divide-y divide-slate-100 sm:hidden">
              {claims.map((claim) => {
                const meta = CLAIM_STATUS_META[claim.status];
                return (
                  <li key={claim.id} className="p-3.5">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                          <StoreLogo
                            src={claim.store.logoUrl}
                            alt={claim.store.name}
                            size={26}
                            fallbackSlug={claim.store.slug}
                          />
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-semibold text-slate-900">
                            {claim.store.name}
                          </span>
                          <span className="block font-mono text-[11px] text-slate-400">
                            {claim.claimNumber}
                          </span>
                        </span>
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </div>

                    <div className="mt-2.5 flex items-end justify-between gap-3">
                      <span className="min-w-0 text-xs text-slate-500">
                        <span className="block truncate font-mono">{claim.orderId}</span>
                        <span className="block text-slate-400">
                          <LocalTime value={claim.clickedAt.toISOString()} format="date" /> ·{" "}
                          {shortClickId(claim.claimedClickId)}
                        </span>
                      </span>
                      <span className="shrink-0 text-sm font-bold text-slate-900">
                        {formatInrExact(Number(claim.orderAmount))}
                      </span>
                    </div>

                    <p className="mt-2 text-xs text-slate-400">{meta.help}</p>
                  </li>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto sm:block">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wide text-slate-400">
                  <tr className="border-b border-slate-100">
                    <th className="px-5 py-3 font-medium">Claim</th>
                    <th className="px-5 py-3 font-medium">Store</th>
                    <th className="px-5 py-3 font-medium">Type</th>
                    <th className="px-5 py-3 font-medium">Order ID</th>
                    <th className="px-5 py-3 font-medium">Click</th>
                    <th className="px-5 py-3 text-right font-medium">Amount</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                    <th className="px-5 py-3 font-medium">Raised</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {claims.map((claim) => {
                    const meta = CLAIM_STATUS_META[claim.status];
                    return (
                      <tr key={claim.id} className="hover:bg-slate-50/60">
                        <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600">
                          {claim.claimNumber}
                        </td>
                        <td className="px-5 py-3">
                          <Link
                            href={`/stores/${claim.store.slug}`}
                            className="flex items-center gap-2.5 font-medium text-slate-800 hover:text-violet-700"
                          >
                            <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                              <StoreLogo
                                src={claim.store.logoUrl}
                                alt={claim.store.name}
                                size={26}
                                fallbackSlug={claim.store.slug}
                              />
                            </span>
                            <span className="truncate">{claim.store.name}</span>
                          </Link>
                        </td>
                        <td className="px-5 py-3 text-slate-500">
                          {CLAIM_ORDER_TYPE_META[claim.orderType].label}
                        </td>
                        <td className="px-5 py-3 font-mono text-xs text-slate-600">
                          {claim.orderId}
                        </td>
                        <td
                          className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600"
                          title={claim.claimedClickId}
                        >
                          {shortClickId(claim.claimedClickId)}
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-right font-semibold text-slate-900">
                          {formatInrExact(Number(claim.orderAmount))}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}
                            title={meta.help}
                          >
                            {meta.label}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                          <LocalTime value={claim.createdAt.toISOString()} format="date" />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
