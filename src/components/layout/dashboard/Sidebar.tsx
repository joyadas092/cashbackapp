"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Activity,
  Bell,
  Gift,
  Home,
  LifeBuoy,
  Link2,
  type LucideIcon,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Sparkles,
  Store,
  Tag,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SidebarNavItem } from "./SidebarNavItem";
import { SidebarNavGroup, type SidebarSubItem } from "./SidebarNavGroup";
import { ACTIVITY_TABS } from "@/components/activity/ActivityTabs";
import { formatInrExact } from "@/lib/utils";

// My Activity is the app's home now — it already carries the wallet-wide
// numbers the old Dashboard summarised, so a separate overview page was just
// one more click to the same figures.
const ACTIVITY_SUB_ITEMS: SidebarSubItem[] = ACTIVITY_TABS.map((tab) => ({
  tab: tab.key,
  label: tab.label,
  href:
    tab.key === "overview" ? "/dashboard/activity" : `/dashboard/activity?tab=${tab.key}`,
}));

/** The site itself, reachable from inside the account area. */
const BROWSE_ITEMS: Array<{
  href: string;
  icon: LucideIcon;
  label: string;
  disabled?: boolean;
}> = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/stores", icon: Store, label: "All Stores" },
  { href: "/share-earn", icon: Sparkles, label: "Share & Earn" },
  { href: "#", icon: Tag, label: "Top Deals", disabled: true },
];

const NAV_ITEMS: Array<{ href: string; icon: LucideIcon; label: string; disabled?: boolean }> = [
  { href: "/dashboard/wallet", icon: Wallet, label: "Wallet" },
  { href: "/dashboard/orders", icon: Package, label: "Orders" },
  { href: "/dashboard/claims", icon: ReceiptText, label: "Cashback Claims" },
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
  balance,
  onSignOut,
}: {
  user: { name: string; email: string };
  balance: { available: number; pending: number };
  onSignOut: () => Promise<void>;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Desktop only. On phones the header's slide-over carries the same links
  // alongside the site's own, so there is one menu rather than two that
  // disagree about where you are.
  return (
    <>
      <aside
        // Sits below the h-16 sticky Header, so top-16 / 100vh-4rem.
        className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 bg-chrome-gradient sm:block"
      >
        <div className="flex h-full flex-col overflow-y-auto px-3 py-5">
          {/* What am I owed — the question this panel exists to answer. */}
          <Link
            href="/dashboard/wallet"
            className="mb-5 grid grid-cols-2 gap-2 rounded-xl2 border border-white/10 bg-white/5 p-3.5 transition-colors hover:border-violet-400/40"
          >
            <span>
              <span className="block text-[11px] text-white/50">Available</span>
              <span className="block text-sm font-bold text-cashlime-400">
                {formatInrExact(balance.available)}
              </span>
            </span>
            <span>
              <span className="block text-[11px] text-white/50">Pending</span>
              <span className="block text-sm font-bold text-amber-300">
                {formatInrExact(balance.pending)}
              </span>
            </span>
          </Link>

          {/* Browse links first. Without these the panel was a dead end: every
              destination was another account page. */}
          <nav className="mb-4 flex flex-col gap-1 border-b border-white/10 pb-4">
            {BROWSE_ITEMS.map((item) => (
              <SidebarNavItem
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={!item.disabled && pathname === item.href}
                disabled={item.disabled}
              />
            ))}
          </nav>

          <nav className="flex flex-col gap-1">
            <SidebarNavGroup
              href="/dashboard/activity"
              icon={Activity}
              label="My Activity"
              items={ACTIVITY_SUB_ITEMS}
              sectionActive={pathname === "/dashboard/activity"}
              activeTab={searchParams.get("tab") ?? "overview"}
            />

            {[...NAV_ITEMS, ...NAV_ITEMS_AFTER].map((item) => (
              <SidebarNavItem
                key={item.label}
                href={item.href}
                icon={item.icon}
                label={item.label}
                active={!item.disabled && pathname === item.href}
                disabled={item.disabled}
              />
            ))}

            <SidebarNavGroup
              href="/dashboard/help"
              icon={LifeBuoy}
              label="Help & Support"
              items={HELP_SUB_ITEMS}
              sectionActive={pathname.startsWith("/dashboard/help")}
              activeTab={helpTabFor(pathname)}
            />
          </nav>

          {/* Invite promo — mirrors the reference's sidebar CTA card */}
          <div className="mt-6 rounded-xl2 border border-white/10 bg-white/5 p-4 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Gift size={20} strokeWidth={1.75} />
            </span>
            <div className="mt-3 text-sm font-bold text-white">Invite Friends & Earn More</div>
            <p className="mt-1 text-xs text-white/50">Earn from your friends&apos; activity.</p>
            <Link href="/dashboard/refer">
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
