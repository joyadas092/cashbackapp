import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { DashboardShell } from "@/components/layout/dashboard/DashboardShell";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  return (
    <DashboardShell
      user={{ name: session.user.name ?? "there", email: session.user.email ?? "" }}
    >
      {children}
    </DashboardShell>
  );
}
