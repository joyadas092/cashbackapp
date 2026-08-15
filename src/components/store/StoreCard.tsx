import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StoreLogo } from "./StoreLogo";
import { CashbackBadge } from "./CashbackBadge";

export interface StoreCardData {
  slug: string;
  name: string;
  logoUrl: string;
  cashbackDisplayText: string;
  featured?: boolean;
}

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/stores/${store.slug}`}>
      <Card
        variant="light"
        className="group relative flex flex-col items-center gap-3 p-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-600/10"
      >
        {store.featured && (
          <span className="absolute left-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Top
          </span>
        )}
        <div className="rounded-2xl ring-1 ring-slate-200 transition-shadow group-hover:ring-violet-300">
          <StoreLogo src={store.logoUrl} alt={store.name} />
        </div>
        <div className="font-semibold text-slate-900">{store.name}</div>
        <CashbackBadge text={store.cashbackDisplayText} variant="light" />
        <span className="text-xs font-medium text-slate-400 transition-colors group-hover:text-violet-600">
          Shop Now &rarr;
        </span>
      </Card>
    </Link>
  );
}
