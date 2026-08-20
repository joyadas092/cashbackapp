import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Everything the store page renders that isn't derivable from Cuelinks.
 *
 * Cuelinks gives one flat payout per campaign and no category breakdown, no
 * coupons and no payout timelines, so this endpoint is the only way that content
 * gets set. Rates and offers are sent as complete lists and replaced wholesale
 * inside a transaction — simpler and less error-prone than diffing ids, and the
 * lists are small (tens of rows at most).
 */

const trimmedOrNull = z
  .string()
  .trim()
  .max(4000)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable();

const rateSchema = z.object({
  label: z.string().trim().min(1).max(120),
  displayText: z.string().trim().min(1).max(60),
});

const offerSchema = z.object({
  badge: z.string().trim().max(20).nullable().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().max(300).nullable().optional(),
  code: z.string().trim().max(40).nullable().optional(),
  // Accepts a plain yyyy-mm-dd from the date input, or null for "no expiry".
  validTill: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Use a yyyy-mm-dd date")
    .nullable()
    .optional(),
});

/**
 * Where /go sends a shopper. Must be an absolute http(s) URL: a relative or
 * javascript: value here would turn every store click into an open redirect.
 */
const homepageUrlSchema = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v.length === 0 ? null : v))
  .nullable()
  .refine(
    (value) => {
      if (value === null) return true;
      try {
        const url = new URL(value);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    { message: "Enter a full URL starting with https://" }
  );

const bodySchema = z.object({
  homepageUrl: homepageUrlSchema.optional(),
  tagline: trimmedOrNull.optional(),
  description: trimmedOrNull.optional(),
  terms: trimmedOrNull.optional(),
  storePolicies: trimmedOrNull.optional(),
  visitTime: trimmedOrNull.optional(),
  trackingTime: trimmedOrNull.optional(),
  paymentTime: trimmedOrNull.optional(),
  previousRate: z.coerce.number().min(0).max(999.99).nullable().optional(),
  importantTips: z.array(z.string().trim().min(1).max(300)).max(20).optional(),
  categoryRates: z.array(rateSchema).max(50).optional(),
  offers: z.array(offerSchema).max(50).optional(),
});

function emptyToNull(value: string | null | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  return value.length === 0 ? null : value;
}

export async function PUT(req: NextRequest, { params }: { params: { storeId: string } }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const store = await prisma.store.findUnique({
    where: { id: params.storeId },
    select: { id: true, slug: true },
  });
  if (!store) {
    return NextResponse.json({ error: "Store not found" }, { status: 404 });
  }

  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid store content" },
      { status: 400 }
    );
  }
  const data = parsed.data;

  await prisma.$transaction(async (tx) => {
    await tx.store.update({
      where: { id: store.id },
      data: {
        homepageUrl: data.homepageUrl,
        tagline: data.tagline,
        description: data.description,
        terms: data.terms,
        storePolicies: data.storePolicies,
        visitTime: data.visitTime,
        trackingTime: data.trackingTime,
        paymentTime: data.paymentTime,
        previousRate: data.previousRate,
        ...(data.importantTips ? { importantTips: data.importantTips } : {}),
      },
    });

    if (data.categoryRates) {
      await tx.storeCashbackRate.deleteMany({ where: { storeId: store.id } });
      if (data.categoryRates.length > 0) {
        await tx.storeCashbackRate.createMany({
          data: data.categoryRates.map((rate, i) => ({
            storeId: store.id,
            label: rate.label,
            displayText: rate.displayText,
            sortOrder: i,
          })),
        });
      }
    }

    if (data.offers) {
      await tx.storeOffer.deleteMany({ where: { storeId: store.id } });
      if (data.offers.length > 0) {
        await tx.storeOffer.createMany({
          data: data.offers.map((offer, i) => ({
            storeId: store.id,
            badge: emptyToNull(offer.badge) ?? null,
            title: offer.title,
            description: emptyToNull(offer.description) ?? null,
            code: emptyToNull(offer.code) ?? null,
            validTill: offer.validTill ? new Date(`${offer.validTill}T00:00:00.000Z`) : null,
            sortOrder: i,
          })),
        });
      }
    }

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "store_page_content_update",
        entityType: "Store",
        entityId: store.id,
        metadata: {
          rateRows: data.categoryRates?.length ?? null,
          offerRows: data.offers?.length ?? null,
          tipRows: data.importantTips?.length ?? null,
        },
      },
    });
  });

  return NextResponse.json({ ok: true, slug: store.slug });
}
