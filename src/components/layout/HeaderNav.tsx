"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { primaryNavLinks } from "./navLinks";

export function HeaderNav({
  isAdmin,
  isLoggedIn,
}: {
  isAdmin?: boolean;
  isLoggedIn: boolean;
}) {
  const pathname = usePathname();
  const items = primaryNavLinks(isLoggedIn);

  return (
    <nav className="hidden items-center gap-1 lg:flex">
      {items.map((item) => {
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

        const active = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

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
