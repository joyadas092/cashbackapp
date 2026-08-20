import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { buildUserWhere, parseUserFilters } from "@/lib/adminUserFilters";

const MAX_ROWS = 5000;

/**
 * Escape one CSV field.
 *
 * The leading apostrophe on +, -, = and @ is deliberate: spreadsheet software
 * treats a cell starting with those as a formula, so an exported value like
 * "=cmd|..." can execute when the file is opened. Users control their own name
 * and email, so this data is not trusted.
 */
function csvCell(value: string | number | null | undefined): string {
  const raw = value === null || value === undefined ? "" : String(value);
  const guarded = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  return `"${guarded.replace(/"/g, '""')}"`;
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const filters = parseUserFilters(req.nextUrl.searchParams);
  const where = buildUserWhere(filters);

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: MAX_ROWS,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      riskStatus: true,
      referralCode: true,
      createdAt: true,
      // kycStatus only. Payout details — UPI, account number, PAN — are tax and
      // financial PII and must never leave through a bulk export.
      profile: { select: { kycStatus: true } },
      wallet: { select: { lifetimeEarned: true, availableBalance: true } },
      _count: { select: { clicks: true, referralsMade: true } },
    },
  });

  const header = [
    "Name",
    "Email",
    "Phone",
    "Role",
    "Status",
    "KYC",
    "Referral Code",
    "Lifetime Earned",
    "Available Balance",
    "Clicks",
    "Referrals",
    "Joined",
  ];

  const rows = users.map((user) =>
    [
      csvCell(user.name),
      csvCell(user.email),
      csvCell(user.phone),
      csvCell(user.role),
      csvCell(user.riskStatus),
      csvCell(user.profile?.kycStatus ?? "NOT_SUBMITTED"),
      csvCell(user.referralCode),
      csvCell(Number(user.wallet?.lifetimeEarned ?? 0).toFixed(2)),
      csvCell(Number(user.wallet?.availableBalance ?? 0).toFixed(2)),
      csvCell(user._count.clicks),
      csvCell(user._count.referralsMade),
      csvCell(user.createdAt.toISOString()),
    ].join(",")
  );

  const csv = [header.map(csvCell).join(","), ...rows].join("\r\n");
  const stamp = new Date().toISOString().slice(0, 10);

  await prisma.auditLog.create({
    data: {
      actorUserId: session.user.id,
      action: "user_export",
      entityType: "User",
      // An export copies personal data out of the system, so it's worth a
      // record of who took it and how much.
      metadata: { rows: users.length, filters: { ...filters } },
    },
  });

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="users-${stamp}.csv"`,
      // Contains personal data — never let a proxy or the browser keep a copy.
      "Cache-Control": "no-store, private",
    },
  });
}
