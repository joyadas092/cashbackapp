import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ReferralCodeCard } from "@/components/referral/ReferralCodeCard";
import { ReferralList } from "@/components/referral/ReferralList";
import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/utils";

export default async function ReferPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard/refer");
  }

  const [user, referrals] = await Promise.all([
    prisma.user.findUnique({ where: { id: session.user.id }, select: { referralCode: true } }),
    prisma.referral.findMany({
      where: { referrerId: session.user.id },
      orderBy: { createdAt: "desc" },
      include: { referredUser: { select: { name: true } } },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  const host = headers().get("host") ?? "localhost:3000";
  const protocol = host.startsWith("localhost") ? "http" : "https";
  const shareUrl = `${protocol}://${host}/refer/${user.referralCode}`;

  const totalEarned = referrals.reduce((sum, r) => sum + Number(r.totalEarned), 0);
  const pendingEarned = referrals
    .filter((r) => r.status === "ACTIVE")
    .reduce((sum, r) => sum + Number(r.totalEarned), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-8">
      <h1 className="text-2xl font-extrabold text-slate-900">Refer &amp; Earn</h1>
      <p className="mt-1 text-slate-500">
        Invite your friends and earn rewards when they shop and earn cashback.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Total Referrals</div>
          <div className="mt-1 text-2xl font-bold text-slate-900">{referrals.length}</div>
        </Card>
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Active Referral Earnings</div>
          <div className="mt-1 text-2xl font-bold text-violet-700">{formatInr(pendingEarned)}</div>
        </Card>
        <Card variant="light" className="p-5">
          <div className="text-xs font-medium text-slate-500">Lifetime Earnings</div>
          <div className="mt-1 text-2xl font-bold text-cashlime-700">{formatInr(totalEarned)}</div>
        </Card>
      </div>

      <div className="mt-6">
        <ReferralCodeCard referralCode={user.referralCode} shareUrl={shareUrl} />
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold text-slate-900">Your Referred Users</h2>
        <ReferralList
          referrals={referrals.map((r) => ({
            name: r.referredUser.name,
            joinedAt: r.createdAt,
            status: r.status,
            totalEarned: Number(r.totalEarned),
          }))}
        />
      </div>
    </div>
  );
}
