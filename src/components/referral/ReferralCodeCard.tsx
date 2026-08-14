import { Card } from "@/components/ui/Card";
import { ShareButtons } from "@/components/shared/ShareButtons";

export function ReferralCodeCard({ referralCode, shareUrl }: { referralCode: string; shareUrl: string }) {
  return (
    <Card className="p-6">
      <h2 className="text-lg font-bold">Invite friends. Earn together.</h2>
      <p className="mt-1 text-sm text-white/60">Your referral code</p>
      <p className="mt-1 text-2xl font-extrabold tracking-wide text-cashlime-400">{referralCode}</p>
      <p className="mt-3 break-all rounded-lg bg-black/30 px-3 py-2 text-sm text-white/70">{shareUrl}</p>
      <div className="mt-4">
        <ShareButtons url={shareUrl} message="Join me on CashbackApp and start earning!" />
      </div>
    </Card>
  );
}
