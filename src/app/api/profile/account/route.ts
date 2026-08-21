import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountUpdateSchema } from "@/lib/validation/schemas";
import { isHandleAvailable, isReservedUsername } from "@/lib/username";

/**
 * Update the signed-in user's own name, mobile number and goURL username.
 *
 * Email is deliberately not editable here: it's the login identifier, so
 * changing it needs a verification round-trip rather than a single PATCH.
 *
 * Changing the username does not break existing goURLs — the immutable
 * userCode keeps resolving, which is the reason the two are separate fields.
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

  const username = parsed.data.username;
  if (username !== undefined) {
    if (isReservedUsername(username)) {
      return NextResponse.json(
        { error: "That username is reserved. Please pick another." },
        { status: 409 }
      );
    }
    // Checked against userCodes too: /go/<handle> resolves against either, so a
    // username matching someone's code would divert their goURL earnings.
    if (!(await isHandleAvailable(username, session.user.id))) {
      return NextResponse.json({ error: "That username is already taken." }, { status: 409 });
    }
  }

  try {
    const user = await prisma.user.update({
      // Scoped to the session's own id — never a caller-supplied one.
      where: { id: session.user.id },
      data: {
        name: parsed.data.name,
        ...(parsed.data.phone !== undefined ? { phone: parsed.data.phone } : {}),
        ...(username !== undefined ? { username } : {}),
      },
      select: { name: true, phone: true, username: true, userCode: true },
    });

    return NextResponse.json(user);
  } catch (err) {
    // phone and username are both unique. The availability check above closes
    // the common case; this catches the race between checking and writing.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const target = (err.meta?.target as string[] | undefined)?.join(",") ?? "";
      return NextResponse.json(
        {
          error: target.includes("username")
            ? "That username was just taken. Please pick another."
            : "That mobile number is already linked to another account.",
        },
        { status: 409 }
      );
    }
    throw err;
  }
}
