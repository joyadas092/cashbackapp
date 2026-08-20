"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  BarChart3,
  Bell,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  LayoutDashboard,
  LifeBuoy,
  Link2,
  type LucideIcon,
  Menu,
  MousePointerClick,
  Package,
  Radar,
  Receipt,
  Settings,
  UserPlus,
  ShieldCheck,
  Store,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { cn } from "@/lib/utils";

interface AdminNavItem {
  href: string;
  icon: LucideIcon;
  label: string;
  /** Features with no data model behind them yet. */
  disabled?: boolean;
}

interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

/**
 * Grouped admin navigation.
 *
 * Items marked disabled have no model behind them yet — they are shown so the
 * shape of the panel is visible, but they are inert rather than linking to a
 * page that would 404 or render an empty shell pretending to be a feature.
 */
export const ADMIN_NAV: AdminNavGroup[] = [
  {
    title: "Main",
    items: [
      { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
      { href: "/admin/users", icon: Users, label: "Users" },
      { href: "/admin/stores", icon: Store, label: "Stores" },
      { href: "#", icon: Tag, label: "Deals", disabled: true },
      { href: "/admin/orders", icon: Package, label: "Orders" },
      { href: "/admin/transactions", icon: Receipt, label: "Transactions" },
      { href: "/admin/payouts", icon: Wallet, label: "Payouts" },
      { href: "/admin/affiliate", icon: Link2, label: "Affiliate" },
      { href: "/admin/referrals", icon: UserPlus, label: "Referrals" },
      { href: "/admin/clicks", icon: MousePointerClick, label: "Clicks" },
    ],
  },
  {
    title: "Management",
    items: [
      { href: "#", icon: ImageIcon, label: "Banners", disabled: true },
      { href: "#", icon: Bell, label: "Notifications", disabled: true },
      { href: "/admin/support", icon: LifeBuoy, label: "Help & Support" },
      { href: "/admin/help-articles", icon: FileText, label: "CMS Pages" },
      { href: "#", icon: BarChart3, label: "Reports", disabled: true },
    ],
  },
  {
    title: "System",
    items: [
      { href: "/admin/campaigns", icon: Radar, label: "Cuelinks Campaigns" },
      { href: "/admin/referral", icon: Settings, label: "Settings" },
      { href: "#", icon: ShieldCheck, label: "Roles & Permissions", disabled: true },
      { href: "/admin/activity-logs", icon: Activity, label: "Activity Logs" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger, rendered inside the topbar's flow */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open admin menu"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-900 lg:hidden"
      >
        <Menu size={20} strokeWidth={1.75} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
          aria-hidden
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-64 flex-col bg-navy-950 transition-transform duration-200 lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/admin" className="flex items-center gap-2 text-lg font-extrabold text-white">
            <LogoMark size={26} />
            Cashback<span className="text-cashlime-400">.</span>
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Close admin menu"
            className="text-white/50 lg:hidden"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 pb-4">
          {ADMIN_NAV.map((group) => (
            <div key={group.title} className="mb-5">
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-white/30">
                {group.title}
              </div>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  if (item.disabled) {
                    return (
                      <li key={item.label}>
                        <span
                          className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-white/25"
                          title="No data model behind this yet"
                        >
                          <item.icon size={17} strokeWidth={1.75} />
                          {item.label}
                          <span className="ml-auto rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
                            Soon
                          </span>
                        </span>
                      </li>
                    );
                  }

                  // /admin would otherwise light up for every child route.
                  const active =
                    item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);

                  return (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                          active
                            ? "bg-violet-600 text-white shadow-lg shadow-violet-600/25"
                            : "text-white/60 hover:bg-white/5 hover:text-white"
                        )}
                      >
                        <item.icon size={17} strokeWidth={1.75} />
                        {item.label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          <Link
            href="/"
            target="_blank"
            className="flex items-center justify-center gap-2 rounded-xl bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-white/15"
          >
            View Website
            <ExternalLink size={14} strokeWidth={2} />
          </Link>
          <p className="mt-3 text-center text-[11px] leading-relaxed text-white/30">
            CashbackApp Admin
            <br />
            All rights reserved.
          </p>
        </div>
      </aside>
    </>
  );
}
