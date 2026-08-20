import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { isClaimClosed } from "@/lib/claims";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  status: z.enum(["SUBMITTED", "UNDER_REVIEW", "ESCALATED", "APPROVED", "REJECTED"]),
  adminNote: z.string().trim().max(2000).nullable().optional(),
});

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid request" },
      { status: 400 }
    );
  }
  const { status, adminNote } = parsed.data;

  const claim = await prisma.cashbackClaim.findUnique({
    where: { id: params.id },
    select: { id: true, status: true, claimNumber: true },
  });
  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  // A decided claim stays decided. Reopening one would let an approval be
  // quietly walked back after the user has been told, so it needs a new claim
  // rather than an edit to this one.
  if (isClaimClosed(claim.status)) {
    return NextResponse.json(
      { error: `This claim is already ${claim.status.toLowerCase()}.` },
      { status: 409 }
    );
  }

  // Compare-and-swap on the status we read, so two admins acting at once
  // can't both believe they made the decision.
  const updated = await prisma.cashbackClaim.updateMany({
    where: { id: claim.id, status: claim.status },
    data: {
      status,
      adminNote: adminNote ?? undefined,
      resolvedAt: isClaimClosed(status) ? new Date() : null,
      resolvedById: isClaimClosed(status) ? session.user.id : null,
    },
  });

  if (updated.count === 0) {
    return NextResponse.json(
      { error: "Someone else updated this claim just now. Reload and try again." },
      { status: 409 }
    );
  }

  return NextResponse.json({ ok: true, status });
}
