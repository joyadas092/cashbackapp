import Link from "next/link";
import { StoreLogo } from "./StoreLogo";
import { Button } from "@/components/ui/Button";

export interface DealCardData {
  slug: string;
  name: string;
  logoUrl: string;
  cashbackDisplayText: string;
}

export function DealCard({ store }: { store: DealCardData }) {
  return (
    <Link
      href={`/stores/${store.slug}`}
      className="group flex min-w-[260px] shrink-0 items-center gap-4 rounded-xl2 border border-slate-200 bg-white p-5 shadow-card transition-all hover:-translate-y-1 hover:border-violet-300 hover:shadow-lg hover:shadow-violet-600/10 sm:min-w-0"
    >
      <div className="rounded-2xl ring-1 ring-slate-200">
        <StoreLogo src={store.logoUrl} alt={store.name} size={52} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-slate-900">{store.name}</div>
        <p className="mt-0.5 text-sm font-medium text-cashlime-700">
          {store.cashbackDisplayText}
        </p>
      </div>
      <Button variant="outlineLight" size="sm" className="shrink-0" tabIndex={-1}>
        Grab Deal
      </Button>
    </Link>
  );
}
