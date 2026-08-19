import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

const patchSchema = z.object({
  status: z.enum(["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]).optional(),
  priority: z.enum(["LOW", "NORMAL", "HIGH", "URGENT"]).optional(),
});

/** Update a ticket's status or priority. Admin only. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success || (!parsed.data.status && !parsed.data.priority)) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }

  const ticket = await prisma.supportTicket.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, priority: true },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const nextStatus = parsed.data.status;
  const closing = nextStatus === "RESOLVED" || nextStatus === "CLOSED";

  const updated = await prisma.supportTicket.update({
    where: { id: ticket.id },
    data: {
      ...(nextStatus ? { status: nextStatus } : {}),
      ...(parsed.data.priority ? { priority: parsed.data.priority } : {}),
      // Stamped on the way out and cleared on reopen, so resolution time stays
      // measurable and never reflects a stale close.
      ...(nextStatus ? { resolvedAt: closing ? new Date() : null } : {}),
    },
    select: { id: true, status: true, priority: true, resolvedAt: true },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "support_ticket_update",
      entityType: "SupportTicket",
      entityId: ticket.id,
      metadata: {
        statusFrom: ticket.status,
        statusTo: updated.status,
        priorityFrom: ticket.priority,
        priorityTo: updated.priority,
      },
    },
  });

  return NextResponse.json(updated);
}
