import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { SettingsSubNav } from "@/components/profile/SettingsSubNav";

type ProfileFormBankDetails = { accountHolder?: string; accountNumber?: string; ifsc?: string };

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/profile");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { profile: true },
  });
  if (!user) redirect("/login");

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Settings</h1>
      <p className="mt-1 text-slate-500">Manage your account, preferences and payout details.</p>

      <div className="mt-6 flex flex-col gap-6 lg:flex-row">
        <div className="w-full shrink-0 lg:w-80">
          <SettingsSubNav />
        </div>

        <div className="min-w-0 flex-1 space-y-6">
          <Card variant="light" className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Profile Settings</h2>
            <p className="mt-0.5 text-sm text-slate-500">Your personal information</p>
            <dl className="mt-4 grid grid-cols-1 gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs font-medium text-slate-500">Full Name</dt>
                <dd className="mt-1 font-medium text-slate-900">{user.name}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Email Address</dt>
                <dd className="mt-1 flex items-center gap-2 font-medium text-slate-900">
                  {user.email}
                  <span className="rounded-full bg-cashlime-50 px-2 py-0.5 text-[10px] font-semibold text-cashlime-700">
                    Verified
                  </span>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Mobile Number</dt>
                <dd className="mt-1 font-medium text-slate-900">{user.phone ?? "Not added"}</dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-slate-500">Referral Code</dt>
                <dd className="mt-1 font-bold tracking-wide text-violet-700">
                  {user.referralCode}
                </dd>
              </div>
            </dl>
          </Card>

          <ProfileForm
            initial={{
              upiId: user.profile?.upiId ?? null,
              bankDetails: (user.profile?.bankDetails as ProfileFormBankDetails | null) ?? null,
              kycStatus: user.profile?.kycStatus ?? null,
            }}
          />

          <Card variant="light" className="p-6">
            <h2 className="text-lg font-bold text-slate-900">Account</h2>
            <p className="mt-0.5 text-sm text-slate-500">Sign out of this device.</p>
            <form
              className="mt-4"
              action={async () => {
                "use server";
                await signOut({ redirectTo: "/" });
              }}
            >
              <Button variant="outlineLight" type="submit">
                Logout
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
