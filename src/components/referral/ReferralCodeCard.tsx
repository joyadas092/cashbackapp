import { Card } from "@/components/ui/Card";
import { ShareButtons } from "@/components/shared/ShareButtons";

export function ReferralCodeCard({ referralCode, shareUrl }: { referralCode: string; shareUrl: string }) {
  return (
    <Card variant="light" className="p-6">
      <h2 className="text-lg font-bold text-slate-900">Invite friends. Earn together.</h2>
      <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
        Your referral code
      </p>
      <p className="mt-1 text-2xl font-extrabold tracking-wide text-violet-700">{referralCode}</p>
      <p className="mt-3 break-all rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-600">
        {shareUrl}
      </p>
      <div className="mt-4">
        <ShareButtons url={shareUrl} message="Join me on CashbackApp and start earning!" />
      </div>
    </Card>
  );
}
