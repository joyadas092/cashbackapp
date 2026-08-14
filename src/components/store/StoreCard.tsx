import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StoreLogo } from "./StoreLogo";
import { CashbackBadge } from "./CashbackBadge";

export interface StoreCardData {
  slug: string;
  name: string;
  logoUrl: string;
  cashbackDisplayText: string;
}

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/stores/${store.slug}`}>
      <Card className="group flex flex-col items-center gap-3 p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-600/10">
        <div className="rounded-2xl shadow-md shadow-black/20 ring-1 ring-white/10 transition-shadow group-hover:shadow-cyan-400/20 group-hover:ring-cyan-400/30">
          <StoreLogo src={store.logoUrl} alt={store.name} />
        </div>
        <div className="font-semibold text-white">{store.name}</div>
        <CashbackBadge text={store.cashbackDisplayText} />
        <span className="text-xs font-medium text-white/50 transition-colors group-hover:text-violet-400">
          Shop Now &rarr;
        </span>
      </Card>
    </Link>
  );
}
