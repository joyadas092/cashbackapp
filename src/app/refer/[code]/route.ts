import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Captures a referral code before the visitor registers (spec section 4).
 * Sets an HttpOnly cookie as a fallback for users who browse before signing
 * up; POST /api/auth/register also accepts an explicit ?ref= value directly
 * if the register page passed it through.
 */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  const code = params.code.toUpperCase();

  const referrer = await prisma.user.findUnique({ where: { referralCode: code } });
  const url = new URL("/register", req.url);
  if (referrer) {
    url.searchParams.set("ref", code);
  }

  const res = NextResponse.redirect(url);
  if (referrer) {
    res.cookies.set("referral_code", code, {
      httpOnly: true,
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 30,
      path: "/",
    });
  }
  return res;
}
