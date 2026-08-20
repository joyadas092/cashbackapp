import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/admin")) {
    if (!req.auth?.user) {
      return NextResponse.redirect(new URL(`/login?callbackUrl=${pathname}`, req.url));
    }
    if (req.auth.user.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Layouts don't receive the request path, and the public layout needs it to
  // decide whether maintenance mode applies. Passing it as a header is the
  // supported way to get it there.
  const headers = new Headers(req.headers);
  headers.set("x-pathname", pathname);
  return NextResponse.next({ request: { headers } });
});

// Maintenance mode itself is enforced in the public layout, not here:
// middleware runs on the edge runtime where the Prisma client can't load, so it
// has no way to read the setting.
export const config = {
  matcher: [
    // Everything except Next's own assets and files with an extension.
    "/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
