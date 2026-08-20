import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // The bottom nav's destinations depend on whether there's a session — see the
  // note in BottomNav on why signed-out visitors get different items.
  const [session, settings] = await Promise.all([auth(), getSettings()]);

  // Maintenance mode lives here rather than in middleware: middleware runs on
  // the edge runtime and can't read the database. /maintenance itself sits
  // outside this route group, so redirecting to it can't loop.
  //
  // Two exemptions, both so the switch stays reversible from inside the app:
  // admins keep browsing normally, and /login stays reachable — otherwise an
  // admin who wasn't already signed in would be locked out and would have to
  // edit the database to get the site back.
  if (settings.maintenanceMode && session?.user?.role !== "ADMIN") {
    const pathname = headers().get("x-pathname") ?? "";
    if (!pathname.startsWith("/login")) {
      redirect("/maintenance");
    }
  }

  return (
    <>
      <Header />
      <main className="pb-20 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav isLoggedIn={Boolean(session?.user)} />
    </>
  );
}
