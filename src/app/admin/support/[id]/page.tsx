import Link from "next/link";
import { notFound } from "next/navigation";
import { Headphones, Lock } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { TicketStatusControls } from "@/components/admin/TicketStatusControls";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TICKET_STATUS_META, isTicketOpen } from "@/lib/support";
import { formatInrExact } from "@/lib/utils";

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AdminTicketPage({ params }: { params: { id: string } }) {
  await requireAdminSession(`/admin/support/${params.id}`);

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
          riskStatus: true,
          wallet: {
            select: { availableBalance: true, pendingCashback: true, lifetimeEarned: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { name: true } } },
      },
    },
  });
  if (!ticket) notFound();

  const meta = TICKET_STATUS_META[ticket.status];
  const open = isTicketOpen(ticket.status);

  // Context an agent needs to answer a cashback question without leaving the
  // page. Read-only — money is never moved from here.
  const userFacts: Array<[string, string]> = [
    ["Email", ticket.user.email],
    ["Phone", ticket.user.phone ?? "—"],
    ["Member since", ticket.user.createdAt.toLocaleDateString("en-IN")],
    ["Risk status", ticket.user.riskStatus],
    ["Available balance", formatInrExact(Number(ticket.user.wallet?.availableBalance ?? 0))],
    ["Pending cashback", formatInrExact(Number(ticket.user.wallet?.pendingCashback ?? 0))],
    ["Lifetime earned", formatInrExact(Number(ticket.user.wallet?.lifetimeEarned ?? 0))],
  ];

  return (
    <div>
      <Link href="/admin/support" className="text-sm text-violet-600 hover:underline">
        &larr; Back to tickets
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-slate-500">
            <span className="font-mono">#{ticket.ticketNumber}</span> · {ticket.category} · raised{" "}
            {formatDateTime(ticket.createdAt)}
          </p>
        </div>
        <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>
          {meta.label}
        </span>
      </div>

      <div className="mt-5 rounded-xl2 border border-slate-200 p-4">
        <TicketStatusControls
          ticketId={ticket.id}
          status={ticket.status}
          priority={ticket.priority}
        />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          <ol className="space-y-4">
            {ticket.messages.map((message) => (
              <li key={message.id} className="flex gap-3">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    message.isStaffReply
                      ? "bg-violet-600 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {message.isStaffReply ? (
                    <Headphones size={16} strokeWidth={2} />
                  ) : (
                    (message.author?.name ?? "U").charAt(0).toUpperCase()
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                    <span className="font-semibold text-slate-700">
                      {message.isStaffReply ? "Support" : message.author?.name ?? "User"}
                    </span>
                    {formatDateTime(message.createdAt)}
                  </div>
                  <div
                    className={`mt-1 whitespace-pre-line rounded-xl px-4 py-3 text-sm leading-relaxed ${
                      message.isStaffReply
                        ? "border border-violet-500/30 bg-violet-500/10 text-slate-800"
                        : "border border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    {message.body}
                  </div>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-6 rounded-xl2 border border-slate-200 p-4">
            {open ? (
              <>
                <h2 className="text-sm font-semibold">Reply to the user</h2>
                <p className="mt-1 text-xs text-slate-400">
                  Sent as Support. Never ask for a password or a full account number.
                </p>
                <div className="mt-3">
                  <TicketReplyForm
                    ticketId={ticket.id}
                    variant="dark"
                    placeholder="Write your reply to the user..."
                  />
                </div>
              </>
            ) : (
              <div className="flex items-start gap-3">
                <Lock size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-400" />
                <p className="text-sm text-slate-600">
                  This ticket is {meta.label.toLowerCase()} and accepts no further replies. Reopen it
                  above to continue the conversation.
                </p>
              </div>
            )}
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-xl2 border border-slate-200 p-4">
            <h2 className="text-sm font-semibold">{ticket.user.name}</h2>
            <dl className="mt-3 space-y-2 text-sm">
              {userFacts.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">{label}</dt>
                  <dd className="min-w-0 truncate text-slate-700">{value}</dd>
                </div>
              ))}
            </dl>
            <Link
              href={`/admin/users/${ticket.user.id}`}
              className="mt-4 block rounded-lg border border-slate-300 px-4 py-2 text-center text-xs font-semibold hover:bg-slate-50"
            >
              Open full user record
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
