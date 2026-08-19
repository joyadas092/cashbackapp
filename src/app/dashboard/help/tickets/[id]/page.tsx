import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Headphones, Lock } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Avatar } from "@/components/shared/Avatar";
import { TicketReplyForm } from "@/components/support/TicketReplyForm";
import { TICKET_STATUS_META, isTicketOpen } from "@/lib/support";

function formatDateTime(date: Date): string {
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function TicketThreadPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=/dashboard/help/tickets/${params.id}`);
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    include: {
      messages: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true } } },
      },
    },
  });

  // Scoped to the owner even for admins: admins read tickets in the admin
  // panel, so a stray id here shouldn't open someone else's thread.
  if (!ticket || ticket.userId !== session.user.id) notFound();

  const meta = TICKET_STATUS_META[ticket.status];
  const open = isTicketOpen(ticket.status);

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <Link href="/dashboard/help/tickets" className="hover:text-violet-700">
          My Tickets
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-mono font-semibold text-slate-800">#{ticket.ticketNumber}</span>
      </nav>

      <header className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
              {ticket.subject}
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              {ticket.category} · Raised {formatDateTime(ticket.createdAt)}
            </p>
          </div>
          <span className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold ${meta.tone}`}>
            {meta.label}
          </span>
        </div>
      </header>

      <ol className="mt-5 space-y-4">
        {ticket.messages.map((message) => {
          const isStaff = message.isStaffReply;
          return (
            <li
              key={message.id}
              className={`flex gap-3 ${isStaff ? "" : "flex-row-reverse"}`}
            >
              {isStaff ? (
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                  <Headphones size={16} strokeWidth={2} />
                </span>
              ) : (
                <Avatar
                  name={message.author?.name ?? "You"}
                  seed={message.authorUserId ?? message.id}
                  size={36}
                />
              )}

              <div className={`min-w-0 max-w-[85%] ${isStaff ? "" : "text-right"}`}>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <span className="font-semibold text-slate-600">
                    {isStaff ? "Support Team" : message.author?.name ?? "You"}
                  </span>
                  {formatDateTime(message.createdAt)}
                </div>
                <div
                  className={`mt-1 whitespace-pre-line rounded-xl2 px-4 py-3 text-left text-sm leading-relaxed ${
                    isStaff
                      ? "border border-slate-200 bg-white text-slate-700 shadow-card"
                      : "bg-violet-600 text-white"
                  }`}
                >
                  {message.body}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <div className="mt-6">
        {open ? (
          <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-sm font-bold text-slate-900">Add a reply</h2>
            <div className="mt-3">
              <TicketReplyForm ticketId={ticket.id} />
            </div>
          </div>
        ) : (
          <div className="flex items-start gap-3 rounded-xl2 border border-slate-200 bg-slate-50 p-5">
            <Lock size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-slate-400" />
            <div>
              <p className="text-sm font-semibold text-slate-800">
                This ticket is {meta.label.toLowerCase()}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">
                It no longer accepts replies.{" "}
                <Link
                  href="/dashboard/help/tickets/new"
                  className="font-semibold text-violet-700 hover:underline"
                >
                  Raise a new ticket
                </Link>{" "}
                if you still need help.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
