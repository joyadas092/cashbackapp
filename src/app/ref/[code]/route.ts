import { NextRequest, NextResponse } from "next/server";

/** Thin alias — spec mentions both /refer/:code and /ref/:code forms. */
export async function GET(req: NextRequest, { params }: { params: { code: string } }) {
  return NextResponse.redirect(new URL(`/refer/${params.code}`, req.url));
}
