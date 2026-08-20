import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateUniqueReferralCode } from "@/lib/referralCode";

const BCRYPT_COST = 10;

const createSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().toLowerCase().email(),
  phone: z
    .string()
    .trim()
    .transform((v) => v.replace(/[\s-]/g, ""))
    .refine((v) => v === "" || /^(\+91)?[6-9]\d{9}$/.test(v), "Enter a valid 10-digit mobile number")
    .transform((v) => (v === "" ? null : v.replace(/^\+91/, "")))
    .nullable()
    .optional(),
  // Matches registration: bcrypt silently truncates past 72 bytes.
  password: z.string().min(8, "Use at least 8 characters").max(72),
});

/**
 * Create a user from the admin panel.
 *
 * The admin sets an initial password and is expected to hand it over out of
 * band — there is no email delivery in this app yet, so generating a secret the
 * admin never sees would create an account nobody can sign into. The password
 * is never written to the audit log.
 */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 }
    );
  }
  const { name, email, phone, password } = parsed.data;

  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const referralCode = await generateUniqueReferralCode();

  try {
    const user = await prisma.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          name,
          email,
          phone: phone ?? null,
          passwordHash,
          role: "USER",
          referralCode,
          // Every account needs a wallet; creating it here keeps the invariant
          // that a user always has one, same as registration does.
          wallet: { create: {} },
        },
        select: { id: true, email: true },
      });

      await tx.auditLog.create({
        data: {
          actorUserId: session.user.id,
          action: "user_create",
          entityType: "User",
          entityId: created.id,
          // Deliberately no password material of any kind.
          metadata: { email: created.email, createdByAdmin: true },
        },
      });

      return created;
    });

    return NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(", ") ?? "field";
      return NextResponse.json(
        { error: `That ${target.includes("phone") ? "mobile number" : "email"} is already in use.` },
        { status: 409 }
      );
    }
    throw err;
  }
}
