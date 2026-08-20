import Link from "next/link";
import type { TicketStatus } from "@prisma/client";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { TICKET_STATUS_META } from "@/lib/support";

const PAGE_SIZE = 25;

const FILTERS: Array<{ key: string; label: string; statuses: TicketStatus[] | null }> = [
  { key: "open", label: "Needs attention", statuses: ["OPEN", "IN_PROGRESS"] },
  { key: "all", label: "All", statuses: null },
  { key: "resolved", label: "Resolved", statuses: ["RESOLVED"] },
  { key: "closed", label: "Closed", statuses: ["CLOSED"] },
];

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminSupportPage({
  searchParams,
}: {
  searchParams: { status?: string; page?: string };
}) {
  await requireAdminSession("/admin/support");

  // Defaults to the queue that actually needs work, not everything ever raised.
  const filterKey = FILTERS.some((f) => f.key === searchParams.status)
    ? (searchParams.status as string)
    : "open";
  const filter = FILTERS.find((f) => f.key === filterKey)!;
  const page = Math.max(1, parseInt(searchParams.page ?? "1", 10) || 1);

  const where = filter.statuses ? { status: { in: filter.statuses } } : {};

  const [tickets, total, counts] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      orderBy: [{ priority: "desc" }, { updatedAt: "desc" }],
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: {
        user: { select: { name: true, email: true } },
        _count: { select: { messages: true } },
      },
    }),
    prisma.supportTicket.count({ where }),
    prisma.supportTicket.groupBy({ by: ["status"], _count: { _all: true } }),
  ]);

  const countByStatus = new Map(counts.map((c) => [c.status, c._count._all]));
  const countFor = (statuses: TicketStatus[] | null) =>
    statuses === null
      ? counts.reduce((sum, c) => sum + c._count._all, 0)
      : statuses.reduce((sum, s) => sum + (countByStatus.get(s) ?? 0), 0);

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="mt-1 text-sm text-slate-500">
            Tickets raised by users, newest and highest priority first.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/help-articles"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Help Articles
          </Link>
          <Link
            href="/admin/support/settings"
            className="rounded-full border border-slate-300 px-4 py-2 text-sm font-medium hover:bg-slate-50"
          >
            Contact Settings
          </Link>
        </div>
      </div>

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-slate-200">
        {FILTERS.map((f) => {
          const isActive = f.key === filterKey;
          return (
            <Link
              key={f.key}
              href={`/admin/support?status=${f.key}`}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
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

      {tickets.length === 0 ? (
        <p className="mt-8 rounded-xl2 border border-slate-200 px-5 py-12 text-center text-sm text-slate-500">
          Nothing in this queue.
        </p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-xl2 border border-slate-200">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-4 py-3">Ticket</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Priority</th>
                <th className="px-4 py-3">Replies</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {tickets.map((ticket) => {
                const meta = TICKET_STATUS_META[ticket.status];
                return (
                  <tr key={ticket.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <Link
                        href={`/admin/support/${ticket.id}`}
                        className="font-medium text-slate-900 hover:text-violet-700"
                      >
                        {ticket.subject}
                      </Link>
                      <div className="font-mono text-xs text-slate-400">#{ticket.ticketNumber}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-slate-700">{ticket.user.name}</div>
                      <div className="text-xs text-slate-400">{ticket.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ticket.category}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          ticket.priority === "URGENT" || ticket.priority === "HIGH"
                            ? "bg-red-500/15 text-red-600"
                            : "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {ticket.priority}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{ticket._count.messages}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">
                      {formatDateTime(ticket.updatedAt)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between gap-4">
          <span className="text-xs text-slate-400">
            Page {page} of {totalPages} · {total} tickets
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/support?status=${filterKey}&page=${page - 1}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/support?status=${filterKey}&page=${page + 1}`}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold hover:bg-slate-50"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
