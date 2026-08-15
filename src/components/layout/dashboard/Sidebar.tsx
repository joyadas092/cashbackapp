"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/shared/LogoMark";
import { Button } from "@/components/ui/Button";
import { SidebarNavItem } from "./SidebarNavItem";
import { cn } from "@/lib/utils";

const NAV_ITEMS: Array<{ href: string; icon: string; label: string; disabled?: boolean }> = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/dashboard/activity", icon: "📊", label: "My Activity" },
  { href: "/dashboard/share-earn", icon: "🔗", label: "Share & Earn" },
  { href: "/dashboard/refer", icon: "👥", label: "Refer & Earn" },
  { href: "/dashboard/profile", icon: "⚙️", label: "Settings" },
  { href: "#", icon: "📦", label: "Orders", disabled: true },
  { href: "#", icon: "🏷️", label: "Deals", disabled: true },
  { href: "#", icon: "🔔", label: "Notifications", disabled: true },
  { href: "#", icon: "❓", label: "Help & Support", disabled: true },
];

export function Sidebar({
  user,
  onSignOut,
}: {
  user: { name: string; email: string };
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar — only rendered below sm, where the sidebar is a drawer */}
      <div className="fixed inset-x-0 top-0 z-30 flex items-center gap-3 border-b border-white/10 bg-chrome-gradient px-4 py-3 sm:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-white/80">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2 font-extrabold text-white">
          <LogoMark size={22} />
          Cashback<span className="text-cashlime-400">.</span>
        </Link>
      </div>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 sm:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 shrink-0 bg-chrome-gradient transition-transform duration-200",
          "sm:sticky sm:top-0 sm:h-screen sm:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-5">
          <Link href="/" className="mb-6 flex items-center gap-2 px-2 font-extrabold text-white">
            <LogoMark size={26} />
            Cashback<span className="text-cashlime-400">.</span>
          </Link>

          <Link href="/stores" onClick={() => setOpen(false)} className="mb-4 px-2">
            <Button variant="primary" size="sm" className="w-full">
              Shop &amp; Earn
            </Button>
          </Link>

          <nav className="flex flex-1 flex-col gap-1">
            {NAV_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={!item.disabled && pathname === item.href}
                disabled={item.disabled}
                onClick={() => setOpen(false)}
              />
            ))}
          </nav>

          <div className="mt-6 border-t border-white/10 pt-4">
            <div className="px-2 text-sm font-semibold text-white">{user.name}</div>
            <div className="truncate px-2 text-xs text-white/40">{user.email}</div>
            <form action={onSignOut} className="mt-3 px-2">
              <Button variant="outline" size="sm" type="submit" className="w-full">
                Logout
              </Button>
            </form>
          </div>
        </div>
      </aside>
    </>
  );
}
