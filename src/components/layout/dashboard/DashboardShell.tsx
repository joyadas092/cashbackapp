import { signOut } from "@/lib/auth";
import { Header } from "@/components/layout/Header";
import { Sidebar } from "./Sidebar";

export async function DashboardShell({
  user,
  children,
}: {
  user: { name: string; email: string };
  children: React.ReactNode;
}) {
  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* The reference keeps the global top nav AND a left sidebar on logged-in
          pages. Header is hidden below sm, where Sidebar renders its own topbar. */}
      <div className="hidden sm:block">
        <Header />
      </div>
      <div className="flex">
        <Sidebar user={user} onSignOut={handleSignOut} />
        {/* pt-14 clears the fixed mobile topbar rendered by Sidebar below sm */}
        <main className="min-w-0 flex-1 pt-14 sm:pt-0">{children}</main>
      </div>
    </div>
  );
}
