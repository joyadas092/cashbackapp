import Link from "next/link";
import type { WithdrawalStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import {
  AdminBadge,
  AdminCard,
  AdminEmpty,
  AdminPageHeader,
  AdminPagination,
  AdminTableWrap,
  AdminTh,
} from "@/components/admin/ui";
import { PayoutActions } from "@/components/admin/PayoutActions";
import { Avatar } from "@/components/shared/Avatar";
import { formatInrExact } from "@/lib/utils";

const PAGE_SIZE = 25;

const FILTERS: Array<{ key: string; label: string; statuses: WithdrawalStatus[] | null }> = [
  { key: "pending", label: "Needs action", statuses: ["REQUESTED", "PROCESSING"] },
  { key: "all", label: "All", statuses: null },
  { key: "completed", label: "Paid", statuses: ["COMPLETED"] },
  { key: "rejected", label: "Rejected / Cancelled", statuses: ["REJECTED", "CANCELLED"] },
];

const TONES: Record<string, string> = {
  REQUESTED: "bg-amber-50 text-amber-700",
  PROCESSING: "bg-sky-50 text-sky-700",
  COMPLETED: "bg-cashlime-50 text-cashlime-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
};

const METHOD_LABELS: Record<string, string> = {
  UPI: "UPI",
  BANK_TRANSFER: "Bank Transfer",
  PAYTM: "Paytm",
  AMAZON_PAY: "Amazon Pay",
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

export default async function AdminPayoutsPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdminSession("/admin/payouts");

  const filterKey = FILTERS.some((f) => f.key === searchParams.status)
    ? (searchParams.status as string)
    : "pending";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = filter.statuses ? { status: { in: filter.statuses } } : {};

  const [requests, total, counts, reserved] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where,
      orderBy: { requestedAt: "asc" }, // oldest first: a payout queue is FIFO
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            wallet: { select: { availableBalance: true } },
          },
        },
      },
    }),
    prisma.withdrawalRequest.count({ where }),
    prisma.withdrawalRequest.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.withdrawalRequest.aggregate({
      where: { status: { in: ["REQUESTED", "PROCESSING"] } },
      _sum: { amount: true },
    }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: WithdrawalStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <AdminPageHeader
        title="Payouts"
        subtitle="Withdrawal requests from users. Money is reserved when requested and only leaves the wallet when you mark it paid."
        actions={
          <span className="rounded-lg border border-amber-200 bg-amber-50 px-3.5 py-2 text-sm font-semibold text-amber-800">
            {formatInrExact(Number(reserved._sum.amount ?? 0))} reserved
          </span>
        }
      />

      <AdminCard padded={false}>
        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5">
          {FILTERS.map((f) => {
            const isActive = f.key === filterKey;
            return (
              <Link
                key={f.key}
                href={`/admin/payouts?status=${f.key}`}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                  isActive
                    ? "border-violet-600 text-violet-700"
                    : "border-transparent text-slate-500 hover:text-slate-800"
                }`}
              >
                {f.label} ({countFor(f.statuses)})
              </Link>
            );
          })}
        </nav>

        {requests.length === 0 ? (
          <AdminEmpty
            title="Nothing in this queue"
            body="Withdrawal requests appear here as soon as users submit them."
          />
        ) : (
          <AdminTableWrap minWidth={980}>
            <thead>
              <tr className="border-b border-slate-100">
                <AdminTh>User</AdminTh>
                <AdminTh>Requested</AdminTh>
                <AdminTh>Method</AdminTh>
                <AdminTh>Destination</AdminTh>
                <AdminTh align="right">Amount</AdminTh>
                <AdminTh>Status</AdminTh>
                <AdminTh>Action</AdminTh>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/60">
                  <td className="px-5 py-3">
                    <Link
                      href={`/admin/users/${request.user.id}`}
                      className="flex items-center gap-2.5 hover:text-violet-700"
                    >
                      <Avatar name={request.user.name} seed={request.user.id} size={30} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-slate-900">
                          {request.user.name}
                        </span>
                        <span className="block truncate text-xs text-slate-400">
                          {request.user.email}
                        </span>
                      </span>
                    </Link>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                    {dateTime(request.requestedAt)}
                  </td>
                  <td className="px-5 py-3 text-slate-600">
                    {METHOD_LABELS[request.method] ?? request.method}
                  </td>
                  <td className="px-5 py-3">
                    <span className="font-mono text-xs text-slate-600">{request.destination}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3 text-right font-bold text-slate-900">
                    {formatInrExact(Number(request.amount))}
                  </td>
                  <td className="px-5 py-3">
                    <AdminBadge
                      label={request.status.charAt(0) + request.status.slice(1).toLowerCase()}
                      tone={TONES[request.status] ?? "bg-slate-100 text-slate-600"}
                    />
                  </td>
                  <td className="px-5 py-3">
                    <PayoutActions
                      id={request.id}
                      status={request.status}
                      amount={Number(request.amount)}
                      destination={request.destination}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </AdminTableWrap>
        )}

        <AdminPagination
          page={page}
          totalPages={totalPages}
          total={total}
          noun="requests"
          hrefForPage={(p) => `/admin/payouts?status=${filterKey}&page=${p}`}
        />
      </AdminCard>

      <p className="mt-4 text-xs text-slate-500">
        Marking a payout paid records that the money left your account — this app does not move
        funds itself. Rejecting returns the amount to the user&apos;s available balance and records
        the reversal in their ledger.
      </p>
    </div>
  );
}
