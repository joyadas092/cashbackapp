import { Clock, HandCoins, Landmark, Wallet, type LucideIcon } from "lucide-react";
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
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  accent: string;
}> = [
  {
    key: "lifetimeEarned",
    label: "Total Balance",
    sub: "Lifetime earnings",
    icon: Wallet,
    iconBg: "bg-cashlime-50",
    iconColor: "text-cashlime-700",
    accent: "text-slate-900",
  },
  {
    key: "pendingCashback",
    label: "Pending Balance",
    sub: "In confirmation",
    icon: Clock,
    iconBg: "bg-amber-50",
    iconColor: "text-amber-600",
    accent: "text-amber-600",
  },
  {
    key: "availableBalance",
    label: "Available to Withdraw",
    sub: "Ready to withdraw",
    icon: HandCoins,
    iconBg: "bg-violet-50",
    iconColor: "text-violet-700",
    accent: "text-violet-700",
  },
  {
    key: "withdrawn",
    label: "Withdrawn",
    sub: "Total withdrawn",
    icon: Landmark,
    iconBg: "bg-cyan-50",
    iconColor: "text-cyan-700",
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
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tile.iconBg} ${tile.iconColor}`}
            >
              <tile.icon size={20} strokeWidth={1.75} />
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
