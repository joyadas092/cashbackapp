import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * Serves a claim's uploaded proof.
 *
 * Readable by the claim's owner and by admins, nobody else: these are order
 * confirmations and often carry a name, address and card tail. Served with
 * no-store and private so it never lands in a shared cache, and with
 * Content-Disposition: attachment plus nosniff so an uploaded file can't be
 * coaxed into executing as HTML on our origin.
 */
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const claim = await prisma.cashbackClaim.findUnique({
    where: { id: params.id },
    select: {
      userId: true,
      attachment: { select: { mimeType: true, data: true, sizeBytes: true } },
    },
  });

  if (!claim || !claim.attachment) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const isOwner = claim.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    // 404, not 403: whether a given claim exists is itself not their business.
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return new NextResponse(Buffer.from(claim.attachment.data), {
    headers: {
      "Content-Type": claim.attachment.mimeType,
      "Content-Length": String(claim.attachment.sizeBytes),
      "Content-Disposition": "inline",
      "X-Content-Type-Options": "nosniff",
      "Cache-Control": "no-store, private",
    },
  });
}
