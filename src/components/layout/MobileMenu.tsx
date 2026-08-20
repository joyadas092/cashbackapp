"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, Search, X } from "lucide-react";
import { Avatar } from "@/components/shared/Avatar";
import { cn, formatInrExact } from "@/lib/utils";

export interface MobileMenuLink {
  href: string;
  label: string;
  disabled?: boolean;
}

export interface MobileMenuUser {
  name: string;
  availableBalance: number;
  pendingBalance: number;
}

/**
 * Slide-over navigation for screens below lg, where HeaderNav is hidden.
 *
 * This is the only navigation a signed-in visitor has on a phone, on both the
 * marketing pages and inside the dashboard, so it carries everything: the
 * wallet balance, the site sections, and the account's own pages. Splitting
 * browse and account links into labelled groups keeps a long list scannable.
 *
 * It also carries search, since the header's search field only appears from md
 * up — without it there is no way to search from a phone except by navigating
 * to the stores page first.
 */
export function MobileMenu({
  links,
  accountLinks = [],
  isLoggedIn,
  isAdmin,
  user,
  onSignOut,
}: {
  links: MobileMenuLink[];
  accountLinks?: MobileMenuLink[];
  isLoggedIn: boolean;
  isAdmin?: boolean;
  user?: MobileMenuUser | null;
  onSignOut?: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // A drawer that survives navigation would cover the page it just opened.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // The drawer scrolls on its own; letting the page behind it scroll too is
  // what makes a phone menu feel broken.
  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  const renderLink = (link: MobileMenuLink) =>
    link.disabled ? (
      <span
        key={link.label}
        className="flex cursor-not-allowed items-center rounded-lg px-3 py-2.5 text-sm font-medium text-white/25"
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
          "block rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          isActive(link.href)
            ? "bg-violet-500/15 text-white"
            : "text-white/70 hover:bg-white/5 hover:text-white"
        )}
      >
        {link.label}
      </Link>
    );

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
            {/* Identity and balance first: on a cashback app "what am I owed"
                is the question the menu is most often opened to answer. */}
            {isLoggedIn && user ? (
              <div className="border-b border-white/10 bg-violet-600/15 px-4 py-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <Avatar name={user.name} size={38} />
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white">
                        {user.name}
                      </span>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setOpen(false)}
                        className="text-xs text-white/50 hover:text-white"
                      >
                        View profile
                      </Link>
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    aria-label="Close menu"
                    className="shrink-0 rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>

                <Link
                  href="/dashboard/wallet"
                  onClick={() => setOpen(false)}
                  className="mt-3 grid grid-cols-2 gap-2 rounded-xl bg-white/10 p-3"
                >
                  <span>
                    <span className="block text-[11px] text-white/50">Available</span>
                    <span className="block text-sm font-bold text-cashlime-400">
                      {formatInrExact(user.availableBalance)}
                    </span>
                  </span>
                  <span>
                    <span className="block text-[11px] text-white/50">Pending</span>
                    <span className="block text-sm font-bold text-amber-300">
                      {formatInrExact(user.pendingBalance)}
                    </span>
                  </span>
                </Link>
              </div>
            ) : (
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
            )}

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
              <p className="px-3 pb-1 pt-1 text-[11px] font-semibold uppercase tracking-wide text-white/30">
                Browse
              </p>
              {links.map(renderLink)}

              {isLoggedIn && accountLinks.length > 0 && (
                <>
                  <p className="px-3 pb-1 pt-4 text-[11px] font-semibold uppercase tracking-wide text-white/30">
                    My Account
                  </p>
                  {accountLinks.map(renderLink)}
                </>
              )}

              {isAdmin && (
                <Link
                  href="/admin"
                  onClick={() => setOpen(false)}
                  className="mt-4 block rounded-lg bg-violet-600/20 px-3 py-2.5 text-sm font-medium text-violet-300"
                >
                  Admin Panel
                </Link>
              )}
            </nav>

            {isLoggedIn && onSignOut ? (
              <form action={onSignOut} className="border-t border-white/10 p-4">
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-white/20 py-2.5 text-sm font-semibold text-white/80 hover:bg-white/5"
                >
                  <LogOut size={15} strokeWidth={2} />
                  Logout
                </button>
              </form>
            ) : (
              !isLoggedIn && (
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
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
