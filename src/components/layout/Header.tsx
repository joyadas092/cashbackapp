import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/Button";

export async function Header() {
  const session = await auth();

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="text-xl font-extrabold tracking-tight text-white">
          Cashback<span className="text-cashlime-400">.</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-white/70 sm:flex">
          <Link href="/stores" className="hover:text-white">
            Stores
          </Link>
          <Link href="/dashboard" className="hover:text-white">
            Dashboard
          </Link>
        </nav>

        {session?.user ? (
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button variant="outline" size="sm" type="submit">
              Logout
            </Button>
          </form>
        ) : (
          <Link href="/login">
            <Button variant="primary" size="sm">
              Login
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
