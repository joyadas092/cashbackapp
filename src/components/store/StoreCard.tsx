import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StoreLogo } from "./StoreLogo";

export interface StoreCardData {
  slug: string;
  name: string;
  logoUrl: string;
  cashbackDisplayText: string;
  featured?: boolean;
}

export function StoreCard({ store }: { store: StoreCardData }) {
  return (
    <Link href={`/stores/${store.slug}`} className="block">
      <Card
        variant="light"
        className="group relative flex h-full flex-col p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-600/10"
      >
        {store.featured && (
          <span className="absolute right-3 top-3 rounded-full bg-violet-600 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Top
          </span>
        )}

        {/* Logo left, name + rate right — matches the reference's card anatomy */}
        <div className="flex items-center gap-3">
          <div className="rounded-2xl ring-1 ring-slate-200 transition-shadow group-hover:ring-violet-300">
            <StoreLogo src={store.logoUrl} alt={store.name} size={48} fallbackSlug={store.slug} />
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-slate-900">{store.name}</div>
            <div className="mt-0.5 text-sm font-semibold text-cashlime-700">
              {store.cashbackDisplayText}
            </div>
          </div>
        </div>

        <span className="mt-4 block rounded-full bg-violet-50 py-2 text-center text-sm font-semibold text-violet-700 transition-colors group-hover:bg-violet-600 group-hover:text-white">
          Shop Now
        </span>
      </Card>
    </Link>
  );
}
