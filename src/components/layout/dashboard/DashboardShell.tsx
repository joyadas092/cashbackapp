import { signOut } from "@/lib/auth";
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
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar user={user} onSignOut={handleSignOut} />
      {/* pt-14 clears the fixed mobile topbar rendered by Sidebar below sm */}
      <main className="min-w-0 flex-1 pt-14 sm:pt-0">{children}</main>
    </div>
  );
}
