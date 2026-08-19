"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Home,
  Link2,
  LogIn,
  Store,
  User,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Mobile bottom navigation.
 *
 * The destinations differ by session on purpose. Wallet, Activity and Profile
 * all live under /dashboard and bounce a logged-out visitor straight to the
 * login page, so showing them to someone who isn't signed in offers three taps
 * that all dead-end. Signed-out visitors get the two things they can actually
 * use and act on — Share & Earn and Refer & Earn — plus a way in.
 */
const SIGNED_IN: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/dashboard/wallet", label: "Wallet", icon: Wallet },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

const SIGNED_OUT: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/share-earn", label: "Share", icon: Link2 },
  { href: "/refer-earn", label: "Refer", icon: Users },
  { href: "/login", label: "Login", icon: LogIn },
];

export function BottomNav({ isLoggedIn }: { isLoggedIn: boolean }) {
  const pathname = usePathname();
  const items = isLoggedIn ? SIGNED_IN : SIGNED_OUT;

  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-navy-950/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md sm:hidden"
    >
      {items.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors",
              active ? "text-white" : "text-white/50 hover:text-white/80"
            )}
          >
            <item.icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
