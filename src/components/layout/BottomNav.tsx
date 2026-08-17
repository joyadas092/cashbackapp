import Link from "next/link";
import { Activity, Home, Store, User, Wallet, type LucideIcon } from "lucide-react";

const ITEMS: Array<{ href: string; label: string; icon: LucideIcon }> = [
  { href: "/", label: "Home", icon: Home },
  { href: "/stores", label: "Stores", icon: Store },
  { href: "/dashboard", label: "Wallet", icon: Wallet },
  { href: "/dashboard/activity", label: "Activity", icon: Activity },
  { href: "/dashboard/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex border-t border-white/10 bg-navy-950/95 backdrop-blur-md sm:hidden">
      {ITEMS.map((item) => (
        <Link
          key={item.label}
          href={item.href}
          className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-white/60"
        >
          <item.icon size={20} strokeWidth={1.75} />
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
