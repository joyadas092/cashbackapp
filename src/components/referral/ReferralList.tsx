import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatInr } from "@/lib/utils";

export interface ReferralItem {
  name: string;
  joinedAt: string | Date;
  status: string;
  totalEarned: number;
}

export function ReferralList({ referrals }: { referrals: ReferralItem[] }) {
  if (referrals.length === 0) {
    return <EmptyState message="Your network is empty. Start sharing." />;
  }

  return (
    <Card className="p-4">
      <ul className="divide-y divide-white/10">
        {referrals.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-3 text-sm">
            <span className="font-medium text-white">{r.name}</span>
            <span className="text-white/50">{r.status}</span>
            <span className="font-semibold text-cashlime-400">{formatInr(r.totalEarned)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
