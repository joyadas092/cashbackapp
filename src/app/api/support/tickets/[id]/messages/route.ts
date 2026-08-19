import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ticketReplySchema } from "@/lib/validation/schemas";
import { isTicketOpen } from "@/lib/support";

/**
 * Post a reply on a ticket.
 *
 * Serves both sides. The ticket's owner may reply to their own ticket; an admin
 * may reply to any. Anyone else gets a 404 rather than a 403 — a 403 would
 * confirm that a ticket with that id exists, which is more than a stranger
 * should learn.
 */
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = ticketReplySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid reply" },
      { status: 400 }
    );
  }

  const isAdmin = session.user.role === "ADMIN";

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    select: { id: true, userId: true, status: true },
  });

  if (!ticket || (!isAdmin && ticket.userId !== session.user.id)) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (!isTicketOpen(ticket.status)) {
    return NextResponse.json(
      { error: "This ticket is closed. Raise a new one if you still need help." },
      { status: 409 }
    );
  }

  const message = await prisma.$transaction(async (tx) => {
    const created = await tx.supportTicketMessage.create({
      data: {
        ticketId: ticket.id,
        authorUserId: session.user.id,
        body: parsed.data.body,
        // Recorded now rather than derived later from the author's role, so a
        // user promoted to admin doesn't turn their old messages into staff
        // replies retroactively.
        isStaffReply: isAdmin,
      },
      select: { id: true, body: true, isStaffReply: true, createdAt: true },
    });

    await tx.supportTicket.update({
      where: { id: ticket.id },
      data: {
        lastRepliedAt: new Date(),
        // A staff reply moves an untouched ticket into progress; a user reply
        // never changes status, so support keeps control of the queue.
        ...(isAdmin && ticket.status === "OPEN" ? { status: "IN_PROGRESS" as const } : {}),
      },
    });

    return created;
  });

  return NextResponse.json(message, { status: 201 });
}
