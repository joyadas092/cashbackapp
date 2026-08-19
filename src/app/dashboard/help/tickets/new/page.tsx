import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { NewTicketForm } from "@/components/support/NewTicketForm";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/help/tickets/new");
  }

  return (
    <div className="mx-auto max-w-[900px] px-4 py-6 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/help" className="hover:text-violet-700">
          Help &amp; Support
        </Link>
        <span className="text-slate-300">›</span>
        <Link href="/dashboard/help/tickets" className="hover:text-violet-700">
          My Tickets
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">New</span>
      </nav>

      <header>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Contact Support</h1>
        <p className="mt-1 text-slate-500">
          Tell us what went wrong and we&apos;ll look into your account directly.
        </p>
      </header>

      <div className="mt-6">
        <NewTicketForm />
      </div>
    </div>
  );
}
