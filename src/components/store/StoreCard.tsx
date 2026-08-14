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
      <Card className="group flex flex-col items-center gap-3 p-5 text-center transition-transform hover:-translate-y-1 hover:border-violet-500/50">
        <StoreLogo src={store.logoUrl} alt={store.name} />
        <div className="font-semibold text-white">{store.name}</div>
        <CashbackBadge text={store.cashbackDisplayText} />
        <span className="text-xs font-medium text-white/50 transition-colors group-hover:text-violet-400">
          Shop Now &rarr;
        </span>
      </Card>
    </Link>
  );
}
