import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { registerSchema } from "@/lib/validation/schemas";
import { generateUniqueReferralCode } from "@/lib/referralCode";
import { generateUniqueUserCode } from "@/lib/username";
import { getSetting } from "@/lib/settings";

export async function POST(req: NextRequest) {
  // Enforced here, not only by hiding the form — otherwise "registration off"
  // would just mean "registration off unless you POST directly".
  if (!(await getSetting("registrationEnabled"))) {
    return NextResponse.json(
      { error: "New sign-ups are closed at the moment. Please check back later." },
      { status: 403 }
    );
  }

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

  const referralCode = await generateUniqueReferralCode();
  // Assigned up front so every account has a working goURL from day one.
  const userCode = await generateUniqueUserCode();

  // Referral attribution: an explicit code in the request body wins; falls
  // back to the referral_code cookie set by /refer/[code] for users who
  // browsed before registering. An unresolvable/self-referential code is
  // silently ignored rather than failing registration — referral capture is
  // a bonus, not a hard registration requirement (spec section 4: prevent
  // self-referral and manipulation, don't block signup over it).
  // Referral capture can be switched off platform-wide; when it is, a code in
  // the request or cookie is simply ignored rather than creating a referral
  // that would never pay out.
  const referralEnabled = await getSetting("referralEnabled");
  const submittedCode = referralEnabled
    ? (parsed.data.referralCode ?? req.cookies.get("referral_code")?.value)
    : undefined;
  const referrer = submittedCode
    ? await prisma.user.findUnique({ where: { referralCode: submittedCode.toUpperCase() } })
    : null;

  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: { name, email, passwordHash, referralCode, userCode },
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
