import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { supportSettingsSchema } from "@/lib/validation/schemas";

/** Blank strings mean "not offered", not an empty channel. */
function blankToNull(value: string | null | undefined): string | null {
  if (value === undefined || value === null) return null;
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

/**
 * The single active SupportSettings row, which drives the contact channels on
 * the Help page. Singleton like ReferralRule — the save deactivates any other
 * active row so the page can never depend on which one findFirst returns.
 */
export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const parsed = supportSettingsSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid support settings" },
      { status: 400 }
    );
  }

  const data = {
    email: blankToNull(parsed.data.email),
    phone: blankToNull(parsed.data.phone),
    whatsapp: blankToNull(parsed.data.whatsapp),
    hours: blankToNull(parsed.data.hours),
    liveChatEnabled: parsed.data.liveChatEnabled,
    liveChatNote: blankToNull(parsed.data.liveChatNote),
    responseNote: blankToNull(parsed.data.responseNote),
  };

  const saved = await prisma.$transaction(async (tx) => {
    const existing = await tx.supportSettings.findFirst({ where: { isActive: true } });

    const row = existing
      ? await tx.supportSettings.update({ where: { id: existing.id }, data })
      : await tx.supportSettings.create({ data: { ...data, isActive: true } });

    await tx.supportSettings.updateMany({
      where: { isActive: true, id: { not: row.id } },
      data: { isActive: false },
    });

    await tx.auditLog.create({
      data: {
        actorUserId: session.user.id,
        action: "support_settings_update",
        entityType: "SupportSettings",
        entityId: row.id,
        metadata: { liveChatEnabled: data.liveChatEnabled },
      },
    });

    return row;
  });

  return NextResponse.json({ ok: true, id: saved.id });
}
