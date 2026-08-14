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
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold">Refer & Earn</h1>
      <p className="mt-1 text-white/60">Invite people and earn from their eligible activity.</p>

      <div className="mt-6">
        <ReferralCodeCard referralCode={user.referralCode} shareUrl={shareUrl} />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-4">
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-white">{referrals.length}</div>
          <div className="text-xs text-white/50">Friends Joined</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-cyan-300">{formatInr(pendingEarned)}</div>
          <div className="text-xs text-white/50">Active Referrals</div>
        </Card>
        <Card className="p-4 text-center">
          <div className="text-xl font-bold text-cashlime-400">{formatInr(totalEarned)}</div>
          <div className="text-xs text-white/50">Lifetime Earnings</div>
        </Card>
      </div>

      <div className="mt-8">
        <h2 className="mb-3 text-lg font-bold">Your Referrals</h2>
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
