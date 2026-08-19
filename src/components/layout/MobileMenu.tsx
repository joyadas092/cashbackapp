"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface MobileMenuLink {
  href: string;
  label: string;
  disabled?: boolean;
}

/**
 * Slide-over navigation for screens below lg, where HeaderNav is hidden.
 *
 * Also carries search: the header's search field only appears from md up, so
 * without this there is no way to search from a phone except by navigating to
 * the stores page first.
 */
export function MobileMenu({
  links,
  isLoggedIn,
  isAdmin,
}: {
  links: MobileMenuLink[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        aria-expanded={open}
        className="rounded-lg p-2 text-white/70 hover:bg-white/10 hover:text-white lg:hidden"
      >
        <Menu size={22} strokeWidth={1.75} />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setOpen(false)}
            aria-hidden
          />

          <div className="absolute inset-y-0 left-0 flex w-[85%] max-w-xs flex-col bg-navy-950 shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
              <span className="text-sm font-bold text-white">Menu</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close menu"
                className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
              >
                <X size={18} strokeWidth={2} />
              </button>
            </div>

            <form action="/stores" className="relative border-b border-white/10 p-4">
              <Search
                size={15}
                strokeWidth={2}
                className="pointer-events-none absolute left-8 top-1/2 -translate-y-1/2 text-white/40"
              />
              <input
                type="search"
                name="q"
                placeholder="Search stores..."
                aria-label="Search stores"
                className="w-full rounded-full border border-white/15 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-violet-500"
              />
            </form>

            <nav className="flex-1 overflow-y-auto p-3">
              {links.map((link) =>
                link.disabled ? (
                  <span
                    key={link.label}
                    className="block cursor-not-allowed rounded-lg px-3 py-3 text-sm font-medium text-white/25"
                    title="Coming in a later phase"
                  >
                    {link.label}
                    <span className="ml-2 rounded-full bg-white/5 px-2 py-0.5 text-[10px] text-white/30">
                      Soon
                    </span>
                  </span>
                ) : (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "block rounded-lg px-3 py-3 text-sm font-medium transition-colors",
                      (link.href === "/" ? pathname === "/" : pathname.startsWith(link.href))
                        ? "bg-violet-500/15 text-white"
                        : "text-white/70 hover:bg-white/5 hover:text-white"
                    )}
                  >
                    {link.label}
                  </Link>
                )
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="mt-2 block rounded-lg bg-violet-600/20 px-3 py-3 text-sm font-medium text-violet-300"
                >
                  Admin
                </Link>
              )}
            </nav>

            {!isLoggedIn && (
              <div className="grid grid-cols-2 gap-2 border-t border-white/10 p-4">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="rounded-full border border-white/20 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Login
                </Link>
                <Link
                  href="/register"
                  onClick={() => setOpen(false)}
                  className="rounded-full bg-violet-600 py-2.5 text-center text-sm font-semibold text-white"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
