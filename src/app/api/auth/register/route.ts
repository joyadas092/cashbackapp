import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomBytes } from "node:crypto";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/schemas";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex").toUpperCase();
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const { name, email, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  let referralCode = generateReferralCode();
  // Extremely unlikely to collide, but guard anyway since it's a unique column.
  while (await prisma.user.findUnique({ where: { referralCode } })) {
    referralCode = generateReferralCode();
  }

  // Referral attribution: an explicit code in the request body wins; falls
  // back to the referral_code cookie set by /refer/[code] for users who
  // browsed before registering. An unresolvable/self-referential code is
  // silently ignored rather than failing registration — referral capture is
  // a bonus, not a hard registration requirement (spec section 4: prevent
  // self-referral and manipulation, don't block signup over it).
  const submittedCode = parsed.data.referralCode ?? req.cookies.get("referral_code")?.value;
  const referrer = submittedCode
    ? await prisma.user.findUnique({ where: { referralCode: submittedCode.toUpperCase() } })
    : null;

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash, referralCode },
    });
    await tx.wallet.create({ data: { userId: created.id } });

    if (referrer && referrer.id !== created.id) {
      await tx.referral.create({
        data: {
          referrerId: referrer.id,
          referredUserId: created.id,
          code: referrer.referralCode,
        },
      });
    }

    return created;
  });

  const res = NextResponse.json({ id: user.id, email: user.email }, { status: 201 });
  res.cookies.delete("referral_code");
  return res;
}
