import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ClaimForm } from "@/components/claims/ClaimForm";
import { CLAIM_MIN_AGE_HOURS, CLAIM_WINDOW_DAYS } from "@/lib/claims";

export const metadata = {
  title: "Raise a Cashback Claim",
  description: "Report a missing cashback or commission and we'll chase it with the store.",
};

export default async function NewClaimPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/claims/new");
  }

  return (
    <div className="mx-auto max-w-[820px] px-3.5 py-5 sm:px-6 sm:py-6">
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-2 text-sm text-slate-500">
        <Link href="/dashboard/claims" className="hover:text-violet-700">
          Cashback Claims
        </Link>
        <span className="text-slate-300">›</span>
        <span className="font-semibold text-slate-800">New Claim</span>
      </nav>

      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Raise a Cashback Claim
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Missing cashback on an order? Tell us which click it came from and we&apos;ll chase it
          with the store.
        </p>
      </header>

      <div className="mt-6">
        <ClaimForm windowDays={CLAIM_WINDOW_DAYS} minAgeHours={CLAIM_MIN_AGE_HOURS} />
      </div>
    </div>
  );
}
