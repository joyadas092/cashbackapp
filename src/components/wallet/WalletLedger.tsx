"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, Receipt } from "lucide-react";
import { formatInrExact } from "@/lib/utils";

interface LedgerRow {
  id: string;
  type: string;
  amount: number;
  isDebit: boolean;
  status: string;
  description: string | null;
  source: string | null;
  sourceTransactionId: string | null;
  createdAt: string;
}

const TABS = [
  { key: "all", label: "All Transactions" },
  { key: "cashback", label: "Cashback" },
  { key: "profit_link", label: "Profit Link Earnings" },
  { key: "referral", label: "Referral Earnings" },
  { key: "withdrawals", label: "Withdrawals" },
  { key: "bonuses", label: "Bonuses" },
] as const;

/** Human labels for ledger types — the raw enum is not user-facing copy. */
const TYPE_LABELS: Record<string, { label: string; tone: string }> = {
  CASHBACK_PENDING: { label: "Cashback", tone: "bg-cashlime-50 text-cashlime-700" },
  CASHBACK_CONFIRMED: { label: "Cashback", tone: "bg-cashlime-50 text-cashlime-700" },
  CASHBACK_REVERSED: { label: "Cashback reversed", tone: "bg-rose-50 text-rose-600" },
  PROFIT_LINK_EARNING: { label: "Profit Link", tone: "bg-violet-50 text-violet-700" },
  PROFIT_LINK_EARNING_REVERSED: { label: "Profit Link reversed", tone: "bg-rose-50 text-rose-600" },
  REFERRAL_EARNING: { label: "Referral", tone: "bg-sky-50 text-sky-700" },
  REFERRAL_EARNING_REVERSED: { label: "Referral reversed", tone: "bg-rose-50 text-rose-600" },
  WITHDRAWAL: { label: "Withdrawal", tone: "bg-amber-50 text-amber-700" },
  WITHDRAWAL_REVERSED: { label: "Withdrawal returned", tone: "bg-slate-100 text-slate-600" },
  ADJUSTMENT: { label: "Bonus", tone: "bg-amber-50 text-amber-700" },
};

const STATUS_TONES: Record<string, string> = {
  COMPLETED: "bg-cashlime-50 text-cashlime-700",
  PENDING: "bg-amber-50 text-amber-700",
  REVERSED: "bg-slate-100 text-slate-500",
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function WalletLedger({ pendingWithdrawalIds }: { pendingWithdrawalIds: string[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<string>("all");
  const [rows, setRows] = useState<LedgerRow[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/wallet/transactions?tab=${tab}&page=${page}`).catch(() => null);
    setLoading(false);
    if (!res?.ok) return;
    const body = await res.json().catch(() => null);
    if (!body) return;
    setRows(body.items ?? []);
    setTotalPages(body.totalPages ?? 1);
    setTotal(body.total ?? 0);
  }, [tab, page]);

  useEffect(() => {
    void load();
  }, [load]);

  async function cancelWithdrawal(requestId: string) {
    setCancelling(requestId);
    setError(null);
    const res = await fetch(`/api/wallet/withdrawals/${requestId}/cancel`, { method: "POST" });
    const body = await res.json().catch(() => ({}));
    setCancelling(null);

    if (!res.ok) {
      setError(body.error ?? "Could not cancel that request.");
      return;
    }
    await load();
    router.refresh(); // balances changed
  }

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white shadow-card">
      <div
        role="tablist"
        className="flex gap-1 overflow-x-auto border-b border-slate-200 px-4 sm:px-5"
      >
        {TABS.map((t) => {
          const isActive = t.key === tab;
          return (
            <button
              key={t.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => {
                setTab(t.key);
                setPage(1);
                setExpanded(null);
              }}
              className={`-mb-px shrink-0 whitespace-nowrap border-b-2 px-3 py-3.5 text-sm font-semibold transition-colors ${
                isActive
                  ? "border-violet-600 text-violet-700"
                  : "border-transparent text-slate-500 hover:text-slate-800"
              }`}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {error && <p className="mx-5 mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="px-5 py-12 text-center text-sm text-slate-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
            <Receipt size={22} strokeWidth={1.75} />
          </span>
          <p className="mt-3 text-sm font-medium text-slate-700">Nothing here yet</p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === "all"
              ? "Shop, share a profit link, or refer a friend — earnings land here."
              : "No entries in this category."}
          </p>
        </div>
      ) : (
        <>
          <div className="hidden grid-cols-[180px_minmax(0,1fr)_150px_140px_130px_40px] gap-3 border-b border-slate-100 px-5 py-3 text-xs uppercase tracking-wide text-slate-400 lg:grid">
            <div>Date</div>
            <div>Description</div>
            <div>Type</div>
            <div>Amount</div>
            <div>Status</div>
            <div />
          </div>

          <ul className="divide-y divide-slate-100">
            {rows.map((row) => {
              const meta = TYPE_LABELS[row.type] ?? {
                label: row.type,
                tone: "bg-slate-100 text-slate-600",
              };
              const isOpen = expanded === row.id;
              const canCancel =
                row.type === "WITHDRAWAL" &&
                row.status === "PENDING" &&
                row.sourceTransactionId !== null &&
                pendingWithdrawalIds.includes(row.sourceTransactionId);

              return (
                <li key={row.id}>
                  <button
                    type="button"
                    onClick={() => setExpanded(isOpen ? null : row.id)}
                    aria-expanded={isOpen}
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/60 lg:grid-cols-[180px_minmax(0,1fr)_150px_140px_130px_40px]"
                  >
                    <span className="order-2 text-xs text-slate-500 lg:order-none lg:text-sm">
                      {formatDateTime(row.createdAt)}
                    </span>

                    <span className="order-1 min-w-0 lg:order-none">
                      <span className="block truncate text-sm font-semibold text-slate-900">
                        {row.description ?? meta.label}
                      </span>
                      <span className="block truncate text-xs text-slate-400 lg:hidden">
                        {meta.label}
                      </span>
                    </span>

                    <span className="order-3 hidden lg:order-none lg:block">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                    </span>

                    <span
                      className={`order-2 whitespace-nowrap text-sm font-bold lg:order-none ${
                        row.isDebit ? "text-rose-600" : "text-cashlime-700"
                      }`}
                    >
                      {row.isDebit ? "−" : "+"} {formatInrExact(row.amount)}
                    </span>

                    <span className="order-4 hidden lg:order-none lg:block">
                      <span
                        className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                          STATUS_TONES[row.status] ?? "bg-slate-100 text-slate-600"
                        }`}
                      >
                        {row.status === "PENDING" && row.type === "WITHDRAWAL"
                          ? "Requested"
                          : row.status.charAt(0) + row.status.slice(1).toLowerCase()}
                      </span>
                    </span>

                    <ChevronDown
                      size={16}
                      strokeWidth={2}
                      className={`order-5 justify-self-end text-slate-400 transition-transform lg:order-none ${
                        isOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-3.5 text-sm">
                      <dl className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
                        <div className="flex justify-between gap-4 sm:justify-start">
                          <dt className="text-slate-500">Type</dt>
                          <dd className="font-medium text-slate-800 sm:ml-auto">{meta.label}</dd>
                        </div>
                        <div className="flex justify-between gap-4 sm:justify-start">
                          <dt className="text-slate-500">Status</dt>
                          <dd className="font-medium text-slate-800 sm:ml-auto">{row.status}</dd>
                        </div>
                        {row.source && (
                          <div className="flex justify-between gap-4 sm:justify-start">
                            <dt className="text-slate-500">Source</dt>
                            <dd className="font-medium text-slate-800 sm:ml-auto">{row.source}</dd>
                          </div>
                        )}
                        <div className="flex justify-between gap-4 sm:justify-start">
                          <dt className="text-slate-500">Reference</dt>
                          <dd className="truncate font-mono text-xs text-slate-600 sm:ml-auto">
                            {row.sourceTransactionId ?? row.id}
                          </dd>
                        </div>
                      </dl>

                      {canCancel && (
                        <button
                          type="button"
                          onClick={() => cancelWithdrawal(row.sourceTransactionId!)}
                          disabled={cancelling === row.sourceTransactionId}
                          className="mt-3 rounded-lg border border-rose-200 px-3.5 py-2 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50 disabled:opacity-50"
                        >
                          {cancelling === row.sourceTransactionId
                            ? "Cancelling..."
                            : "Cancel this withdrawal"}
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="flex items-center justify-between gap-4 border-t border-slate-100 px-5 py-3">
              <span className="text-xs text-slate-400">
                Page {page} of {totalPages} · {total} entries
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
