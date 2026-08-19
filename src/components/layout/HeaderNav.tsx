"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const ITEMS: Array<{ href: string; label: string; disabled?: boolean }> = [
  { href: "/", label: "Home" },
  { href: "/stores", label: "Stores" },
  { href: "/share-earn", label: "Share & Earn" },
  { href: "/dashboard/refer", label: "Refer & Earn" },
  { href: "#", label: "Deals", disabled: true },
  { href: "#", label: "Help", disabled: true },
];

export function HeaderNav({ isAdmin }: { isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {ITEMS.map((item) => {
        if (item.disabled) {
          return (
            <span
              key={item.label}
              className="cursor-not-allowed px-3 py-2 text-sm font-medium text-white/25"
              title="Coming in a later phase"
            >
              {item.label}
            </span>
          );
        }

        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

        return (
          <Link
            key={item.label}
            href={item.href}
            className={cn(
              "relative px-3 py-2 text-sm font-medium transition-colors",
              active ? "text-white" : "text-white/70 hover:text-white"
            )}
          >
            {item.label}
            {active && (
              <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-violet-500" />
            )}
          </Link>
        );
      })}
      {isAdmin && (
        <Link
          href="/admin"
          className="ml-1 rounded-full bg-violet-600/20 px-3 py-1.5 text-sm font-medium text-violet-300 transition-colors hover:bg-violet-600/30"
        >
          Admin
        </Link>
      )}
    </nav>
  );
}
