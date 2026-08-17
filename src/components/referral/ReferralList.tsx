import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { Avatar } from "@/components/shared/Avatar";
import { formatInr } from "@/lib/utils";

export interface ReferralItem {
  name: string;
  joinedAt: string | Date;
  status: string;
  totalEarned: number;
}

const STATUS_TONE: Record<string, string> = {
  ACTIVE: "bg-cashlime-50 text-cashlime-700",
  EXPIRED: "bg-slate-100 text-slate-600",
  BLOCKED: "bg-red-50 text-red-700",
};

export function ReferralList({ referrals }: { referrals: ReferralItem[] }) {
  if (referrals.length === 0) {
    return <EmptyState message="Your network is empty. Start sharing." />;
  }

  return (
    <Card variant="light" className="p-2">
      <ul className="divide-y divide-slate-100">
        {referrals.map((r, i) => (
          <li key={i} className="flex items-center gap-3 px-3 py-3 text-sm">
            <Avatar name={r.name} />
            <div className="min-w-0 flex-1">
              <div className="truncate font-medium text-slate-900">{r.name}</div>
              <div className="text-xs text-slate-400">
                Joined{" "}
                {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(
                  new Date(r.joinedAt)
                )}
              </div>
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                STATUS_TONE[r.status] ?? "bg-slate-100 text-slate-600"
              }`}
            >
              {r.status}
            </span>
            <span className="w-20 text-right font-semibold text-cashlime-700">
              {formatInr(r.totalEarned)}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
