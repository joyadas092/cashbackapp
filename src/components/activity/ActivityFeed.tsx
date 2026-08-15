"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/shared/EmptyState";
import { formatInr, cn } from "@/lib/utils";

type Tab = "all" | "clicks" | "cashback" | "profit_link" | "referral";

const TABS: Array<{ key: Tab; label: string }> = [
  { key: "all", label: "All" },
  { key: "clicks", label: "Clicks" },
  { key: "cashback", label: "Cashback" },
  { key: "profit_link", label: "Profit Link" },
  { key: "referral", label: "Referral" },
];

const TYPE_PARAM: Record<Exclude<Tab, "all" | "clicks">, string> = {
  cashback: "CASHBACK_PENDING,CASHBACK_CONFIRMED,CASHBACK_REVERSED",
  profit_link: "PROFIT_LINK_EARNING,PROFIT_LINK_EARNING_REVERSED",
  referral: "REFERRAL_EARNING,REFERRAL_EARNING_REVERSED",
};

interface ClickItem {
  id: string;
  clickType: string;
  status: string;
  store: { name: string };
  createdAt: string;
}

interface LedgerItem {
  id: string;
  type: string;
  amount: number;
  status: string;
  description: string | null;
  createdAt: string;
}

export function ActivityFeed() {
  const [tab, setTab] = useState<Tab>("all");
  const [clicks, setClicks] = useState<ClickItem[] | null>(null);
  const [ledger, setLedger] = useState<LedgerItem[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    async function load() {
      const requests: Promise<void>[] = [];

      if (tab === "all" || tab === "clicks") {
        requests.push(
          fetch("/api/clicks?page=1")
            .then((r) => r.json())
            .then((body) => {
              if (!cancelled) setClicks(body.items ?? []);
            })
        );
      } else {
        setClicks(null);
      }

      if (tab !== "clicks") {
        const qs = tab === "all" ? "" : `?type=${TYPE_PARAM[tab]}`;
        requests.push(
          fetch(`/api/transactions${qs}`)
            .then((r) => r.json())
            .then((body) => {
              if (!cancelled) setLedger(body.items ?? []);
            })
        );
      } else {
        setLedger(null);
      }

      await Promise.all(requests);
      if (!cancelled) setLoading(false);
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [tab]);

  const hasAnyData = (clicks && clicks.length > 0) || (ledger && ledger.length > 0);

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              tab === t.key
                ? "bg-violet-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            )}
          >
            {t.label}
          </button>
        ))}
        <span
          className="cursor-not-allowed rounded-full bg-slate-50 px-4 py-1.5 text-sm font-medium text-slate-300"
          title="Coming in a later phase"
        >
          Withdrawals
        </span>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {loading && <p className="text-sm text-slate-400">Loading...</p>}

        {!loading && !hasAnyData && (
          <EmptyState message="No activity yet." ctaLabel="Explore Stores" ctaHref="/stores" />
        )}

        {!loading &&
          clicks?.map((c) => (
            <Card
              key={`click-${c.id}`}
              variant="light"
              className="flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium text-slate-900">{c.store.name}</span>
              <span className="text-slate-500">
                {c.clickType === "DIRECT_CASHBACK"
                  ? "Direct Cashback"
                  : c.clickType === "PROFIT_LINK"
                    ? "Profit Link"
                    : "Visit Store"}
              </span>
              <span className="hidden text-slate-400 sm:inline">
                {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(c.createdAt))}
              </span>
            </Card>
          ))}

        {!loading &&
          ledger?.map((w) => (
            <Card
              key={`wtx-${w.id}`}
              variant="light"
              className="flex items-center justify-between p-4 text-sm"
            >
              <span className="font-medium text-slate-900">{w.type.replace(/_/g, " ")}</span>
              <span className="font-semibold text-cashlime-700">{formatInr(w.amount)}</span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
                {w.status}
              </span>
              <span className="hidden text-slate-400 sm:inline">
                {new Intl.DateTimeFormat("en-IN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(w.createdAt))}
              </span>
            </Card>
          ))}
      </div>
    </div>
  );
}
