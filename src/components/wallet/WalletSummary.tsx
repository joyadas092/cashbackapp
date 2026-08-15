import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/utils";

export interface WalletSummaryData {
  availableBalance: number;
  pendingCashback: number;
  lifetimeEarned: number;
  withdrawn: number;
}

const TILES: Array<{
  key: keyof WalletSummaryData;
  label: string;
  sub: string;
  icon: string;
  iconBg: string;
  accent: string;
}> = [
  {
    key: "lifetimeEarned",
    label: "Total Balance",
    sub: "Lifetime earnings",
    icon: "💰",
    iconBg: "bg-cashlime-50",
    accent: "text-slate-900",
  },
  {
    key: "pendingCashback",
    label: "Pending Balance",
    sub: "In confirmation",
    icon: "⏳",
    iconBg: "bg-amber-50",
    accent: "text-amber-600",
  },
  {
    key: "availableBalance",
    label: "Available to Withdraw",
    sub: "Ready to withdraw",
    icon: "👛",
    iconBg: "bg-violet-50",
    accent: "text-violet-700",
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    sub: "Total withdrawn",
    icon: "🏦",
    iconBg: "bg-cyan-50",
    accent: "text-cyan-700",
  },
];

export function WalletSummary({ wallet }: { wallet: WalletSummaryData }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {TILES.map((tile) => (
        <Card key={tile.key} variant="light" className="p-5">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-11 w-11 items-center justify-center rounded-full text-lg ${tile.iconBg}`}
            >
              {tile.icon}
            </span>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-500">{tile.label}</div>
              <div className={`text-xl font-bold ${tile.accent}`}>
                {formatInr(wallet[tile.key])}
              </div>
            </div>
          </div>
          <div className="mt-3 text-xs text-slate-400">{tile.sub}</div>
        </Card>
      ))}
    </div>
  );
}
