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
    <div className="mx-auto min-h-[70vh] max-w-6xl px-4 py-6 lg:flex lg:gap-6 lg:py-8">
      {/* Below lg the nav becomes a horizontal scroller above the content — a
          fixed 12rem column leaves almost nothing for the tables on a phone. */}
      <aside className="lg:w-48 lg:shrink-0">
        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-white/40">
          Admin
        </div>
        <nav className="-mx-4 flex gap-1 overflow-x-auto px-4 pb-2 lg:mx-0 lg:flex-col lg:overflow-visible lg:px-0 lg:pb-0">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 whitespace-nowrap rounded-lg border border-white/10 px-3 py-2 text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white lg:border-transparent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="min-w-0 flex-1 pt-4 lg:pt-0">{children}</main>
    </div>
  );
}
