import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  ChevronRight,
  CircleHelp,
  FileText,
  Mail,
  MessageCircle,
  MessagesSquare,
  Phone,
  Ticket,
} from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { HelpSearch } from "@/components/support/HelpSearch";
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

export default async function HelpPage() {
  const session = await auth();
  // Layout guards too, but Next fetches layout and page data in parallel.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/help");
  }

  const [popular, tickets, openCount, settings, articleCount, faqCount] = await Promise.all([
    prisma.helpArticle.findMany({
      where: { isPublished: true, isFaq: false, isPopular: true },
      orderBy: { sortOrder: "asc" },
      take: 5,
      select: { id: true, slug: true, title: true, excerpt: true },
    }),
    prisma.supportTicket.findMany({
      where: { userId: session.user.id },
      orderBy: { updatedAt: "desc" },
      take: 3,
      select: {
        id: true,
        ticketNumber: true,
        subject: true,
        status: true,
        updatedAt: true,
      },
    }),
    prisma.supportTicket.count({
      where: { userId: session.user.id, status: { in: ["OPEN", "IN_PROGRESS"] } },
    }),
    prisma.supportSettings.findFirst({ where: { isActive: true } }),
    prisma.helpArticle.count({ where: { isPublished: true, isFaq: false } }),
    prisma.helpArticle.count({ where: { isPublished: true, isFaq: true } }),
  ]);

  const cards = [
    {
      icon: FileText,
      title: "Help Center",
      body: "Browse articles and guides to find answers to common questions.",
      cta: "Browse Articles",
      href: "/dashboard/help/articles",
      tone: "bg-violet-50 text-violet-600",
      cardTone: "border-slate-200",
      ctaTone: "border-violet-200 text-violet-700 hover:bg-violet-50",
    },
    {
      icon: MessagesSquare,
      title: "Contact Us",
      body: "Can't find what you're looking for? Get in touch with our support team.",
      cta: "Contact Support",
      href: "/dashboard/help/tickets/new",
      tone: "bg-sky-50 text-sky-600",
      cardTone: "border-sky-100 bg-sky-50/30",
      ctaTone: "border-sky-200 text-sky-700 hover:bg-sky-50",
    },
    {
      icon: Ticket,
      title: "My Tickets",
      body: "View your support tickets and check their status.",
      cta: "View My Tickets",
      href: "/dashboard/help/tickets",
      tone: "bg-cashlime-50 text-cashlime-700",
      cardTone: "border-cashlime-500/20 bg-cashlime-50/30",
      ctaTone: "border-cashlime-500/30 text-cashlime-700 hover:bg-cashlime-50",
    },
    {
      icon: CircleHelp,
      title: "FAQs",
      body: "Quick answers to the most frequently asked questions.",
      cta: "View FAQs",
      href: "/dashboard/help/faqs",
      tone: "bg-amber-50 text-amber-600",
      cardTone: "border-amber-100 bg-amber-50/30",
      ctaTone: "border-amber-200 text-amber-700 hover:bg-amber-50",
    },
  ];

  // Only channels that are actually configured — an empty phone number would
  // otherwise render as a support option that goes nowhere.
  const channels = [
    settings?.liveChatEnabled
      ? {
          icon: MessageCircle,
          title: "Live Chat",
          value: null,
          note: settings.liveChatNote ?? "Chat with our support team",
          online: true,
          href: "/dashboard/help/tickets/new",
          tone: "bg-violet-50 text-violet-600",
        }
      : null,
    settings?.email
      ? {
          icon: Mail,
          title: "Email Support",
          value: settings.email,
          note: settings.responseNote ?? "We usually reply within 24 hours",
          online: false,
          href: `mailto:${settings.email}`,
          tone: "bg-sky-50 text-sky-600",
        }
      : null,
    settings?.phone
      ? {
          icon: Phone,
          title: "Phone Support",
          value: settings.phone,
          note: settings.hours ?? null,
          online: false,
          href: `tel:${settings.phone.replace(/\s/g, "")}`,
          tone: "bg-cashlime-50 text-cashlime-700",
        }
      : null,
    settings?.whatsapp
      ? {
          icon: MessageCircle,
          title: "WhatsApp Support",
          value: settings.whatsapp,
          note: settings.hours ?? null,
          online: false,
          href: `https://wa.me/${settings.whatsapp.replace(/[^\d]/g, "")}`,
          tone: "bg-cashlime-50 text-cashlime-700",
        }
      : null,
  ].filter((c): c is NonNullable<typeof c> => c !== null);

  return (
    <div className="mx-auto max-w-[1400px] px-4 py-6 sm:px-6">
      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Help &amp; Support</h1>
        <p className="mt-1 text-slate-500">
          We&apos;re here to help you. Find answers, get support and resolve your queries.
        </p>
      </header>

      <div className="mt-5 max-w-3xl">
        <HelpSearch />
      </div>

      {/* Four entry points */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`flex flex-col rounded-xl2 border bg-white p-5 shadow-card ${card.cardTone}`}
          >
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.tone}`}
            >
              <card.icon size={20} strokeWidth={1.75} />
            </span>
            <h2 className="mt-3.5 font-bold text-slate-900">
              {card.title}
              {card.title === "My Tickets" && openCount > 0 && (
                <span className="ml-2 rounded-full bg-cashlime-600 px-2 py-0.5 text-[10px] font-bold text-white">
                  {openCount} open
                </span>
              )}
            </h2>
            <p className="mt-1 flex-1 text-sm text-slate-500">{card.body}</p>
            <Link
              href={card.href}
              className={`mt-4 flex items-center justify-center gap-1.5 rounded-lg border px-4 py-2 text-sm font-semibold transition-colors ${card.ctaTone}`}
            >
              {card.cta}
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        {/* Popular topics */}
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-lg font-bold text-slate-900">Popular Help Topics</h2>
            <Link
              href="/dashboard/help/articles"
              className="flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
            >
              View All Articles
              <ArrowRight size={14} strokeWidth={2.5} />
            </Link>
          </div>

          {popular.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
              {articleCount > 0
                ? "No topics have been marked popular yet."
                : "No help articles published yet."}
            </p>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {popular.map((article) => (
                <li key={article.id}>
                  <Link
                    href={`/dashboard/help/articles/${article.slug}`}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/60"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-50 text-violet-600">
                      <FileText size={16} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {article.title}
                      </span>
                      {article.excerpt && (
                        <span className="block truncate text-xs text-slate-500">
                          {article.excerpt}
                        </span>
                      )}
                    </span>
                    <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-slate-300" />
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-3">
            <span className="text-sm text-slate-500">
              Still can&apos;t find what you&apos;re looking for?
            </span>
            <Link
              href="/dashboard/help/articles"
              className="text-sm font-semibold text-violet-700 hover:underline"
            >
              Search {articleCount + faqCount} articles
            </Link>
          </div>
        </section>

        {/* Contact channels */}
        <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
          <h2 className="text-lg font-bold text-slate-900">We&apos;re Here to Help</h2>
          <p className="mt-1 text-sm text-slate-500">
            {settings?.hours
              ? `Our support team is available ${settings.hours}.`
              : "Raise a ticket and our support team will get back to you."}
          </p>

          {channels.length === 0 ? (
            <Link
              href="/dashboard/help/tickets/new"
              className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-violet-500"
            >
              Raise a Support Ticket
              <ArrowRight size={15} strokeWidth={2.5} />
            </Link>
          ) : (
            <ul className="mt-4 divide-y divide-slate-100">
              {channels.map((channel) => (
                <li key={channel.title}>
                  <a
                    href={channel.href}
                    target={channel.href.startsWith("http") ? "_blank" : undefined}
                    rel={channel.href.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex items-center gap-3 py-3 transition-colors hover:bg-slate-50/60"
                  >
                    <span
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${channel.tone}`}
                    >
                      <channel.icon size={18} strokeWidth={1.75} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-slate-900">
                          {channel.title}
                        </span>
                        {channel.online && (
                          <span className="flex items-center gap-1 text-[11px] font-semibold text-cashlime-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-cashlime-500" />
                            Online
                          </span>
                        )}
                      </span>
                      {channel.value && (
                        <span className="block truncate text-sm text-violet-700">
                          {channel.value}
                        </span>
                      )}
                      {channel.note && (
                        <span className="block truncate text-xs text-slate-500">
                          {channel.note}
                        </span>
                      )}
                    </span>
                    <ChevronRight size={16} strokeWidth={2} className="shrink-0 text-slate-300" />
                  </a>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Recent tickets */}
      <section className="mt-6 rounded-xl2 border border-slate-200 bg-white shadow-card">
        <div className="flex items-center justify-between gap-4 p-5 pb-3">
          <h2 className="text-lg font-bold text-slate-900">My Recent Tickets</h2>
          <Link
            href="/dashboard/help/tickets"
            className="flex shrink-0 items-center gap-1 text-sm font-medium text-violet-700 hover:underline"
          >
            View All Tickets
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </div>

        {tickets.length === 0 ? (
          <div className="px-5 pb-8 pt-2 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
              <Ticket size={22} strokeWidth={1.75} />
            </span>
            <p className="mt-3 text-sm font-medium text-slate-700">No tickets yet</p>
            <p className="mt-1 text-sm text-slate-500">
              If something looks wrong with your cashback, raise a ticket and we&apos;ll look into
              it.
            </p>
            <Link
              href="/dashboard/help/tickets/new"
              className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
            >
              Contact Support
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-slate-400">
                <tr className="border-b border-slate-100">
                  <th className="px-5 py-3 font-medium">Ticket ID</th>
                  <th className="px-5 py-3 font-medium">Subject</th>
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
                        <Link
                          href={`/dashboard/help/tickets/${ticket.id}`}
                          aria-label={`Open ticket ${ticket.ticketNumber}`}
                        >
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
      </section>
    </div>
  );
}
