import { requireAdminSession } from "@/lib/adminAuth";
import { prisma } from "@/lib/db";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAdminSession("/admin");

  // Drives the topbar's badge — the one number an admin wants to see on arrival
  // regardless of which page they're on.
  const openTickets = await prisma.supportTicket.count({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
  });

  return (
    <div className="min-h-screen bg-slate-50">
      {/* The sidebar is fixed at lg and up, so the content column is offset
          rather than being a flex sibling — that keeps the sticky topbar
          spanning the full content width. */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-white px-4 sm:px-6">
          <AdminTopbar name={session.user.name ?? "Admin"} openTickets={openTickets} />
        </header>

        <main className="px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
