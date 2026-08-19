import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { createTicketSchema } from "@/lib/validation/schemas";
import { generateTicketNumber } from "@/lib/support";

const MAX_NUMBER_ATTEMPTS = 5;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = createTicketSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid ticket" },
      { status: 400 }
    );
  }
  const { subject, category, message } = parsed.data;

  // Ticket numbers are random, so retry on the unique constraint rather than
  // pre-checking — a check-then-insert can still lose a race.
  for (let attempt = 0; attempt < MAX_NUMBER_ATTEMPTS; attempt++) {
    try {
      const ticket = await prisma.supportTicket.create({
        data: {
          ticketNumber: generateTicketNumber(),
          userId: session.user.id,
          subject,
          category,
          lastRepliedAt: new Date(),
          messages: {
            create: {
              authorUserId: session.user.id,
              body: message,
              isStaffReply: false,
            },
          },
        },
        select: { id: true, ticketNumber: true, status: true, createdAt: true },
      });

      return NextResponse.json(ticket, { status: 201 });
    } catch (err) {
      const isDuplicateNumber =
        err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002";
      if (!isDuplicateNumber) throw err;
    }
  }

  return NextResponse.json(
    { error: "Could not raise that ticket. Please try again." },
    { status: 500 }
  );
}

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tickets = await prisma.supportTicket.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
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

  return NextResponse.json({
    items: tickets.map((t) => ({
      id: t.id,
      ticketNumber: t.ticketNumber,
      subject: t.subject,
      category: t.category,
      status: t.status,
      messageCount: t._count.messages,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    })),
  });
}
