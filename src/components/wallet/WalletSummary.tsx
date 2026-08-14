import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/utils";

export interface WalletSummaryData {
  availableBalance: number;
  pendingCashback: number;
  lifetimeEarned: number;
  withdrawn: number;
}

const TILES: Array<{ key: keyof WalletSummaryData; label: string; accent: string }> = [
  { key: "availableBalance", label: "Available Cashback", accent: "text-cashlime-400" },
  { key: "pendingCashback", label: "Pending", accent: "text-cyan-300" },
  { key: "lifetimeEarned", label: "Lifetime Earned", accent: "text-white" },
  { key: "withdrawn", label: "Withdrawn", accent: "text-white/60" },
];

export function WalletSummary({ wallet }: { wallet: WalletSummaryData }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {TILES.map((tile) => (
        <Card key={tile.key} className="p-5">
          <div className="text-xs font-medium uppercase tracking-wide text-white/50">
            {tile.label}
          </div>
          <div className={`mt-2 text-2xl font-bold ${tile.accent}`}>
            {formatInr(wallet[tile.key])}
          </div>
        </Card>
      ))}
    </div>
  );
}
