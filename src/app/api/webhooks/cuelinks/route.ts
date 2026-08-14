import { NextRequest, NextResponse } from "next/server";
import { processCuelinksPostback, type RawPostbackParams } from "@/lib/postback/processor";

/**
 * Cuelinks Global Postback endpoint (spec section 12).
 *
 * Accepts both GET and POST: Cuelinks Global Postback is very likely a
 * server-initiated GET with templated query params (matching how the
 * user's live postback config screen worked), not a POST — but that wasn't
 * independently verified against live Cuelinks docs, same caveat noted on
 * src/lib/cuelinks/realClient.ts. Both are wired up so whichever method
 * Cuelinks actually uses works without a code change.
 */
async function handle(req: NextRequest): Promise<NextResponse> {
  const params: RawPostbackParams = Object.fromEntries(req.nextUrl.searchParams.entries());

  if (req.method === "POST") {
    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("application/json")) {
      const body = await req.json().catch(() => ({}));
      Object.assign(params, body);
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        for (const [key, value] of form.entries()) {
          params[key] = String(value);
        }
      }
    }
  }

  const result = await processCuelinksPostback(params);
  return NextResponse.json(result.body, { status: result.httpStatus });
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
