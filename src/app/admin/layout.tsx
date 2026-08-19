import Link from "next/link";
import { requireAdminSession } from "@/lib/adminAuth";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/stores", label: "Stores" },
  { href: "/admin/campaigns", label: "Cuelinks Campaigns" },
  { href: "/admin/referral", label: "Refer & Earn" },
  { href: "/admin/support", label: "Support Tickets" },
  { href: "/admin/help-articles", label: "Help Articles" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdminSession("/admin");

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-6xl gap-6 px-4 py-8">
      <aside className="w-48 shrink-0">
        <div className="mb-4 text-xs font-semibold uppercase tracking-wide text-white/40">
          Admin
        </div>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
