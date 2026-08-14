import { Card } from "@/components/ui/Card";
import { StoreLogo } from "@/components/store/StoreLogo";
import { EmptyState } from "@/components/shared/EmptyState";

export interface ProfitLinkItem {
  id: string;
  code: string;
  shareUrl: string;
  clickCount: number;
  status: string;
  createdAt: string | Date;
  store: { name: string; slug: string; logoUrl: string };
}

export function ProfitLinkList({ items }: { items: ProfitLinkItem[] }) {
  if (items.length === 0) {
    return (
      <EmptyState
        message="Turn your next product recommendation into earnings."
        ctaLabel="Create your first link above"
        ctaHref="#"
      />
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {items.map((link) => (
        <Card key={link.id} className="flex items-center gap-3 p-4">
          <StoreLogo src={link.store.logoUrl} alt={link.store.name} size={40} />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white">{link.store.name}</div>
            <div className="truncate text-xs text-white/50">{link.shareUrl}</div>
          </div>
          <div className="text-right text-sm">
            <div className="font-semibold text-cyan-300">{link.clickCount}</div>
            <div className="text-xs text-white/40">clicks</div>
          </div>
        </Card>
      ))}
    </div>
  );
}
