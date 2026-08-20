import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";
import { cashbackClaimSchema } from "@/lib/validation/schemas";
import { claimEligibleBefore, claimNumberFrom, claimWindowStart } from "@/lib/claims";

export const dynamic = "force-dynamic";

/** Proof is a photo of an order page; anything larger is not a screenshot. */
const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // multipart, because the form carries a file alongside the fields.
  const form = await req.formData().catch(() => null);
  if (!form) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const parsed = cashbackClaimSchema.safeParse({
    orderType: form.get("orderType"),
    clickId: form.get("clickId"),
    orderId: form.get("orderId"),
    orderAmount: form.get("orderAmount"),
    message: form.get("message"),
  });
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Check the form and try again" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  // The click must be one of theirs. Without this check a claim could name any
  // click id in the system and quietly attach itself to someone else's order.
  const click = await prisma.click.findFirst({
    where: {
      id: data.clickId,
      ...(data.orderType === "AFFILIATE_ORDER"
        ? { profitLink: { userId } }
        : { userId, clickType: { in: ["DIRECT_CASHBACK", "VISIT_STORE"] } }),
    },
    select: {
      id: true,
      storeId: true,
      createdAt: true,
      _count: { select: { transactions: true } },
    },
  });
  if (!click) {
    return NextResponse.json(
      { error: "We couldn't find that click on your account." },
      { status: 404 }
    );
  }

  // Same window the picker enforces, re-checked here: the picker is a
  // convenience, this is the rule.
  if (click.createdAt < claimWindowStart()) {
    return NextResponse.json(
      { error: "That click is too old to claim. Stores stop accepting queries after 90 days." },
      { status: 400 }
    );
  }
  if (click.createdAt > claimEligibleBefore()) {
    return NextResponse.json(
      {
        error:
          "Tracking can take up to 48 hours. Please wait a little longer before raising a claim.",
      },
      { status: 400 }
    );
  }
  if (click._count.transactions > 0) {
    return NextResponse.json(
      { error: "This click already tracked. Check My Activity — the cashback may just be pending." },
      { status: 409 }
    );
  }

  // --- optional screenshot -------------------------------------------------
  const file = form.get("screenshot");
  let attachment: { mimeType: string; sizeBytes: number; data: Buffer } | null = null;

  if (file instanceof File && file.size > 0) {
    if (!ALLOWED_MIME.has(file.type)) {
      return NextResponse.json(
        { error: "Upload a PNG, JPG or WebP image." },
        { status: 400 }
      );
    }
    if (file.size > MAX_SCREENSHOT_BYTES) {
      return NextResponse.json({ error: "Screenshot must be under 5MB." }, { status: 400 });
    }
    attachment = {
      mimeType: file.type,
      sizeBytes: file.size,
      data: Buffer.from(await file.arrayBuffer()),
    };
  }

  try {
    const claim = await prisma.$transaction(async (tx) => {
      const created = await tx.cashbackClaim.create({
        data: {
          // Placeholder: the reference is derived from the row's own id, which
          // only exists once the row does.
          claimNumber: `PENDING-${crypto.randomUUID()}`,
          userId,
          orderType: data.orderType,
          clickId: click.id,
          claimedClickId: click.id,
          storeId: click.storeId,
          clickedAt: click.createdAt,
          orderId: data.orderId,
          orderAmount: new Prisma.Decimal(data.orderAmount),
          message: data.message,
        },
        select: { id: true },
      });

      const withNumber = await tx.cashbackClaim.update({
        where: { id: created.id },
        data: { claimNumber: claimNumberFrom(created.id) },
        select: { id: true, claimNumber: true },
      });

      if (attachment) {
        await tx.claimAttachment.create({
          data: { claimId: created.id, ...attachment },
        });
      }

      return withNumber;
    });

    return NextResponse.json({ id: claim.id, claimNumber: claim.claimNumber }, { status: 201 });
  } catch (error) {
    // The unique index on (userId, orderId) is what stops a double submit
    // becoming two queue entries.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { error: "You've already raised a claim for this order ID." },
        { status: 409 }
      );
    }
    throw error;
  }
}
