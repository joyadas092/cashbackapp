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
      className="group flex min-w-[260px] shrink-0 items-center gap-4 rounded-xl2 border border-white/10 bg-gradient-to-br from-navy-800/80 to-navy-900/80 p-5 transition-all hover:-translate-y-1 hover:border-cyan-400/40 hover:shadow-lg hover:shadow-cyan-500/10 sm:min-w-0"
    >
      <StoreLogo src={store.logoUrl} alt={store.name} size={52} />
      <div className="min-w-0 flex-1">
        <div className="truncate font-semibold text-white">{store.name}</div>
        <p className="mt-0.5 text-sm text-cashlime-400">
          Flat {store.cashbackDisplayText.replace(/^Up to /i, "")} + Extra Offers
        </p>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" tabIndex={-1}>
        Grab Deal
      </Button>
    </Link>
  );
}
