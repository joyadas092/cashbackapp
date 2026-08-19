import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountUpdateSchema } from "@/lib/validation/schemas";

/**
 * Update the signed-in user's own name and mobile number.
 *
 * Email is deliberately not editable here: it's the login identifier, so
 * changing it needs a verification round-trip rather than a single PATCH.
 */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = accountUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid details" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.update({
      // Scoped to the session's own id — never a caller-supplied one.
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
      },
      select: { name: true, phone: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    // User.phone is unique, so a number already on another account lands here.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json(
        { error: "That mobile number is already linked to another account." },
        { status: 409 }
      );
    }
    throw err;
  }
}
