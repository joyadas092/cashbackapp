"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Bell,
  Gift,
  LifeBuoy,
  Link2,
  type LucideIcon,
  Menu,
  Package,
  Settings,
  Tag,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { LogoMark } from "@/components/shared/LogoMark";
import { Button } from "@/components/ui/Button";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarNavGroup, type SidebarSubItem } from "./SidebarNavGroup";
import { ACTIVITY_TABS } from "@/components/activity/ActivityTabs";
import { cn } from "@/lib/utils";

// My Activity is the app's home now — it already carries the wallet-wide
// numbers the old Dashboard summarised, so a separate overview page was just
// one more click to the same figures.
const ACTIVITY_SUB_ITEMS: SidebarSubItem[] = ACTIVITY_TABS.map((tab) => ({
  tab: tab.key,
  label: tab.label,
  href:
    tab.key === "overview" ? "/dashboard/activity" : `/dashboard/activity?tab=${tab.key}`,
}));

const NAV_ITEMS: Array<{ href: string; icon: LucideIcon; label: string; disabled?: boolean }> = [
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/orders", icon: Package, label: "Orders" },
  { href: "/share-earn", icon: Link2, label: "Profit Links" },
  { href: "/dashboard/refer", icon: Users, label: "Refer & Earn" },
];

const HELP_SUB_ITEMS: SidebarSubItem[] = [
  { tab: "center", label: "Help Center", href: "/dashboard/help/articles" },
  { tab: "contact", label: "Contact Us", href: "/dashboard/help/tickets/new" },
  { tab: "tickets", label: "My Tickets", href: "/dashboard/help/tickets" },
  { tab: "faqs", label: "FAQs", href: "/dashboard/help/faqs" },
];

const NAV_ITEMS_AFTER: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}> = [
  { href: "/dashboard/profile", icon: Settings, label: "Settings" },
  { href: "#", icon: Tag, label: "Deals", disabled: true },
  { href: "#", icon: Bell, label: "Notifications", disabled: true },
];

/** Which Help sub-item the current path corresponds to. */
function helpTabFor(pathname: string): string | undefined {
  if (pathname.startsWith("/dashboard/help/articles")) return "center";
  if (pathname === "/dashboard/help/tickets/new") return "contact";
  if (pathname.startsWith("/dashboard/help/tickets")) return "tickets";
  if (pathname.startsWith("/dashboard/help/faqs")) return "faqs";
  return undefined;
}

export function Sidebar({
  user,
  onSignOut,
}: {
  user: { name: string; email: string };
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile topbar — the desktop header is hidden below sm, so this carries the menu toggle */}
      <div className="fixed inset-x-0 top-0 z-40 flex items-center gap-3 border-b border-white/10 bg-chrome-gradient px-4 py-3 sm:hidden">
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="text-white/80">
          <Menu size={24} strokeWidth={1.75} />
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
          // Desktop: sits below the h-16 sticky Header, so top-16 / 100vh-4rem.
          "fixed inset-y-0 left-0 z-50 w-64 bg-chrome-gradient transition-transform duration-200 sm:sticky sm:top-16 sm:h-[calc(100vh-4rem)] sm:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-5">
          <div className="mb-6 flex items-center justify-between px-2">
            <Link href="/" className="flex items-center gap-2 font-extrabold text-white">
              <LogoMark size={26} />
              Cashback<span className="text-cashlime-400">.</span>
            </Link>
            <button
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="text-white/50 sm:hidden"
            >
              <X size={20} strokeWidth={1.75} />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            <SidebarNavGroup
              href="/dashboard/activity"
              icon={Activity}
              label="My Activity"
              items={ACTIVITY_SUB_ITEMS}
              sectionActive={pathname === "/dashboard/activity"}
              activeTab={searchParams.get("tab") ?? "overview"}
              onNavigate={() => setOpen(false)}
            />

            {[...NAV_ITEMS, ...NAV_ITEMS_AFTER].map((item) => (
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

            <SidebarNavGroup
              href="/dashboard/help"
              icon={LifeBuoy}
              label="Help & Support"
              items={HELP_SUB_ITEMS}
              sectionActive={pathname.startsWith("/dashboard/help")}
              activeTab={helpTabFor(pathname)}
              onNavigate={() => setOpen(false)}
            />
          </nav>

          {/* Invite promo — mirrors the reference's sidebar CTA card */}
          <div className="mt-6 rounded-xl2 border border-white/10 bg-white/5 p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Gift size={20} strokeWidth={1.75} />
            </span>
            <div className="mt-3 text-sm font-bold text-white">Invite Friends & Earn More</div>
            <p className="mt-1 text-xs text-white/50">Earn from your friends&apos; activity.</p>
            <Link href="/dashboard/refer" onClick={() => setOpen(false)}>
              <Button variant="primary" size="sm" className="mt-3 w-full">
                Invite Now
              </Button>
            </Link>
          </div>

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
