import Link from "next/link";
import { Bell, Search } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { LogoMark } from "@/components/shared/LogoMark";
import { UserMenu } from "./UserMenu";
import { HeaderNav } from "./HeaderNav";
import { MobileMenu } from "./MobileMenu";
import { primaryNavLinks } from "./navLinks";

export async function Header() {
  const session = await auth();

  const wallet = session?.user
    ? await prisma.wallet.findUnique({
        where: { userId: session.user.id },
        select: { availableBalance: true },
      })
    : null;

  async function handleSignOut() {
    "use server";
    await signOut({ redirectTo: "/" });
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/95 backdrop-blur-md">
      {/* Fixed h-16 so DashboardShell's sidebar can offset below it predictably */}
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-2 px-4 sm:gap-4">
        <MobileMenu
          links={primaryNavLinks(Boolean(session?.user))}
          isLoggedIn={Boolean(session?.user)}
          isAdmin={session?.user?.role === "ADMIN"}
        />

        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 text-base font-extrabold tracking-tight text-white sm:text-lg"
        >
          <LogoMark size={26} />
          Cashback<span className="text-cashlime-400">.</span>
        </Link>

        <HeaderNav
          isAdmin={session?.user?.role === "ADMIN"}
          isLoggedIn={Boolean(session?.user)}
        />

        {/* Search — visible from md up, matching the reference's persistent search */}
        <form action="/stores" className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search
            size={16}
            strokeWidth={2}
            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-white/40"
          />
          <input
            type="search"
            name="q"
            placeholder="Search for stores or products..."
            aria-label="Search stores"
            className="w-full rounded-full border border-white/15 bg-white/5 py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40 outline-none focus:border-violet-500"
          />
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:ml-0">
          {session?.user ? (
            <>
              <span
                className="relative hidden rounded-full p-2 text-white/60 sm:block"
                title="Notifications — coming in a later phase"
              >
                <Bell size={19} strokeWidth={1.75} />
              </span>
              <UserMenu
                name={session.user.name ?? "there"}
                balance={Number(wallet?.availableBalance ?? 0)}
                onSignOut={handleSignOut}
              />
            </>
          ) : (
            <>
              {/* Login is hidden on phones — the slide-over menu carries it, and
                  two buttons plus the hamburger crowds a narrow header. */}
              <Link href="/login" className="hidden sm:block">
                <Button variant="outline" size="sm">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button variant="primary" size="sm">
                  Sign Up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
