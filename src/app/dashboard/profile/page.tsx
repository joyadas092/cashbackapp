import { redirect } from "next/navigation";
import { auth, signOut } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProfileForm } from "@/components/profile/ProfileForm";

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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Profile</h1>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold">Account</h2>
        <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-white/50">Name</dt>
            <dd className="text-white">{user.name}</dd>
          </div>
          <div>
            <dt className="text-white/50">Email</dt>
            <dd className="text-white">{user.email}</dd>
          </div>
          <div>
            <dt className="text-white/50">Mobile</dt>
            <dd className="text-white">{user.phone ?? "Not added"}</dd>
          </div>
          <div>
            <dt className="text-white/50">Referral Code</dt>
            <dd className="font-semibold text-cashlime-400">{user.referralCode}</dd>
          </div>
        </dl>
      </Card>

      <div className="mt-6">
        <ProfileForm
          initial={{
            upiId: user.profile?.upiId ?? null,
            bankDetails: (user.profile?.bankDetails as ProfileFormBankDetails | null) ?? null,
            kycStatus: user.profile?.kycStatus ?? null,
          }}
        />
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-lg font-bold">Security</h2>
        <form
          className="mt-3"
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <Button variant="outline" type="submit">
            Logout
          </Button>
        </form>
      </Card>
    </div>
  );
}

type ProfileFormBankDetails = { accountHolder?: string; accountNumber?: string; ifsc?: string };
