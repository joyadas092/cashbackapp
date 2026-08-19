import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight, Plus, Ticket } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { TICKET_STATUS_META } from "@/lib/support";

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function MyTicketsPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/help/tickets");
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true,
      ticketNumber: true,
      subject: true,
      category: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">My Tickets</span>
      </nav>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">My Tickets</h1>
          <p className="mt-1 text-slate-500">Everything you&apos;ve raised with our support team.</p>
        </div>
        <Link
          href="/dashboard/help/tickets/new"
          className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
        >
          <Plus size={15} strokeWidth={2.5} />
          New Ticket
        </Link>
      </header>

      <div className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        {tickets.length === 0 ? (
          <div className="px-5 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Ticket size={22} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">No tickets yet</p>
            <p className="mt-1 text-sm text-slate-500">
              Raise one if a cashback, withdrawal or link isn&apos;t behaving as expected.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Ticket ID</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
                  <th className="px-5 py-3 font-medium">Category</th>
                  <th className="px-5 py-3 font-medium">Replies</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Last Updated</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tickets.map((ticket) => {
                  const meta = TICKET_STATUS_META[ticket.status];
                  return (
                    <tr key={ticket.id} className="transition-colors hover:bg-slate-50/60">
                      <td className="whitespace-nowrap px-5 py-3 font-mono text-xs text-slate-600">
                        #{ticket.ticketNumber}
                      </td>
                      <td className="px-5 py-3">
                        <Link
                          href={`/dashboard/help/tickets/${ticket.id}`}
                          className="font-medium text-slate-800 hover:text-violet-700"
                        >
                          {ticket.subject}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-slate-500">{ticket.category}</td>
                      <td className="px-5 py-3 text-slate-600">{ticket._count.messages}</td>
                      <td className="px-5 py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}
                        >
                          {meta.label}
                        </span>
                      </td>
                      <td className="whitespace-nowrap px-5 py-3 text-slate-500">
                        {formatDateTime(ticket.updatedAt)}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <Link href={`/dashboard/help/tickets/${ticket.id}`} aria-label="Open ticket">
                          <ChevronRight size={16} strokeWidth={2} className="text-slate-300" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
