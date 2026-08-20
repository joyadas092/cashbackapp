import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { shortClickId } from "@/lib/clickId";
import { claimEligibleBefore, claimWindowStart } from "@/lib/claims";

export const dynamic = "force-dynamic";

/**
 * The clicks a user can raise a claim against on a given day.
 *
 * Drives the claim form's cascade: pick a date, see which stores you visited,
 * then pick the exact click. Scoped to the caller's own clicks — for an
 * affiliate claim that means clicks on links they own, never clicks they made
 * themselves, since the buyer there is a stranger.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const date = searchParams.get("date") ?? "";
  const orderType = searchParams.get("orderType") === "AFFILIATE_ORDER" ? "AFFILIATE_ORDER" : "OWN_ORDER";

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: "Pick a date first." }, { status: 400 });
  }

  const dayStart = new Date(`${date}T00:00:00`);
  if (Number.isNaN(dayStart.getTime())) {
    return NextResponse.json({ error: "That date isn't valid." }, { status: 400 });
  }
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  // Both bounds enforced here, not only in the UI: the window is what makes a
  // claim actionable with the network, and a hand-crafted request must not
  // slip past it.
  const windowStart = claimWindowStart();
  const eligibleBefore = claimEligibleBefore();

  if (dayEnd <= windowStart) {
    return NextResponse.json({ items: [], reason: "outside-window" });
  }

  const where: Prisma.ClickWhereInput =
    orderType === "AFFILIATE_ORDER"
      ? // Clicks on links this user shared. The clicker is someone else, so
        // this filters on the link's owner, never on Click.userId.
        { profitLink: { userId: session.user.id } }
      : { userId: session.user.id, clickType: { in: ["DIRECT_CASHBACK", "VISIT_STORE"] } };

  const clicks = await prisma.click.findMany({
    where: {
      ...where,
      status: "TRACKED",
      createdAt: {
        gte: dayStart < windowStart ? windowStart : dayStart,
        lt: dayEnd < eligibleBefore ? dayEnd : eligibleBefore,
      },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
    select: {
      id: true,
      createdAt: true,
      clickType: true,
      store: { select: { id: true, name: true, slug: true, logoUrl: true } },
      profitLink: { select: { code: true } },
      // A click that already converted is not missing cashback, and a click
      // already claimed shouldn't be offered twice.
      _count: { select: { transactions: true, claims: true } },
    },
  });

  return NextResponse.json({
    items: clicks.map((click) => ({
      id: click.id,
      shortId: shortClickId(click.id),
      createdAt: click.createdAt.toISOString(),
      store: click.store,
      linkCode: click.profitLink?.code ?? null,
      alreadyTracked: click._count.transactions > 0,
      alreadyClaimed: click._count.claims > 0,
    })),
  });
}
