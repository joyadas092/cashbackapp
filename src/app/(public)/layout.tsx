import { auth } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Footer } from "@/components/layout/Footer";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // The bottom nav's destinations depend on whether there's a session — see the
  // note in BottomNav on why signed-out visitors get different items.
  const session = await auth();

  return (
    <>
      <Header />
      <main className="pb-20 sm:pb-0">{children}</main>
      <Footer />
      <BottomNav isLoggedIn={Boolean(session?.user)} />
    </>
  );
}
