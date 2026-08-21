import { redirect } from "next/navigation";
import { LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { AccountForm } from "@/components/profile/AccountForm";
import { SecurityForm } from "@/components/profile/SecurityForm";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SettingsSubNav } from "@/components/profile/SettingsSubNav";

type BankDetails = {
  accountHolder?: string;
  accountNumber?: string;
  ifsc?: string;
  pan?: string;
};

export default async function ProfilePage() {
  const session = await auth();
  // Layout guards too, but Next fetches layout and page data in parallel.
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/profile");
  }

  const [user, lastPasswordChange] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, include: { profile: true } }),
    prisma.auditLog.findFirst({
      where: { actorUserId: session.user.id, action: "password_change" },
      orderBy: { createdAt: "desc" },
      select: { createdAt: true },
    }),
  ]);
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-[1400px] px-3.5 py-5 sm:px-6 sm:py-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-slate-500 sm:text-base">
          Manage your account, payout details and password.
        </p>
      </header>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-80">
          <SettingsSubNav />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <AccountForm
            initial={{
              name: user.name,
              email: user.email,
              phone: user.phone ?? "",
              referralCode: user.referralCode,
              username: user.username ?? "",
              userCode: user.userCode,
            }}
          />

          <SecurityForm
            lastChangedAt={
              lastPasswordChange
                ? lastPasswordChange.createdAt.toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })
                : null
            }
          />

          <ProfileForm
            initial={{
              upiId: user.profile?.upiId ?? null,
              bankDetails: (user.profile?.bankDetails as BankDetails | null) ?? null,
              kycStatus: user.profile?.kycStatus ?? null,
            }}
          />

          <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-lg font-bold text-slate-900">Sign out</h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Ends your session on this device only.
            </p>
            <form
              className="mt-4"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                <LogOut size={16} strokeWidth={2} />
                Logout
              </button>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
