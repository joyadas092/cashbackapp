import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

/**
 * Page-level admin guard. src/middleware.ts also redirects for /admin/**,
 * but every admin page calls this too — Next.js fetches a layout and its
 * page's data in parallel, so a page relying solely on a parent layout's
 * (or middleware's) redirect can still render with a null/non-admin
 * session before that redirect takes effect. Same rationale as
 * dashboard/page.tsx's double-guard.
 */
export async function requireAdminSession(pathname: string) {
  const session = await auth();
  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
  }
  if (session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }
  return session;
}
