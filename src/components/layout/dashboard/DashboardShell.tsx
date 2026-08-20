import { signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Header } from "@/components/layout/Header";
import { BottomNav } from "@/components/layout/BottomNav";
import { Sidebar } from "./Sidebar";

export async function DashboardShell({
  user,
  children,
}: {
  user: { id: string; name: string; email: string };
  children: React.ReactNode;
}) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId: user.id },
    select: { availableBalance: true, pendingCashback: true },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* The same header the rest of the site uses, at every width. The
          dashboard used to hide it below sm and substitute a bare topbar with
          no search, no balance and no way back to the store pages, which is
          what made the account area feel like a separate application. */}
      <Header />
      <div className="flex">
        <Sidebar
          user={user}
          balance={{
            available: Number(wallet?.availableBalance ?? 0),
            pending: Number(wallet?.pendingCashback ?? 0),
          }}
          onSignOut={handleSignOut}
        />
        {/* pb-20 on phones clears the fixed bottom nav. */}
        <main className="min-w-0 flex-1 pb-20 sm:pb-0">{children}</main>
      </div>
      <BottomNav isLoggedIn />
    </div>
  );
}
