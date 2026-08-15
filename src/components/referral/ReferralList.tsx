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
    <Card variant="light" className="p-4">
      <ul className="divide-y divide-slate-100">
        {referrals.map((r, i) => (
          <li key={i} className="flex items-center justify-between py-3 text-sm">
            <span className="font-medium text-slate-900">{r.name}</span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              {r.status}
            </span>
            <span className="font-semibold text-cashlime-700">{formatInr(r.totalEarned)}</span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
