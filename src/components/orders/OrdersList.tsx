"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, ChevronDown, Package } from "lucide-react";
import { StoreLogo } from "@/components/store/StoreLogo";
import { formatInrExact } from "@/lib/utils";

export interface OrderRow {
  id: string;
  orderId: string;
  placedAt: string;
  store: { name: string; slug: string; logoUrl: string };
  saleAmount: number;
  cashback: number;
  status: string;
  /** ISO date, or null when no store timing is configured to base it on. */
  estimatedConfirmation: string | null;
  daysRemaining: number | null;
  confirmedAt: string | null;
  reversedAt: string | null;
  trackingTime: string | null;
  paymentTime: string | null;
}

const STATUS_STYLES: Record<string, string> = {
  PENDING: "bg-amber-50 text-amber-700",
  CONFIRMED: "bg-cashlime-50 text-cashlime-700",
  PAID: "bg-violet-50 text-violet-700",
  REJECTED: "bg-rose-50 text-rose-600",
  CANCELLED: "bg-slate-100 text-slate-500",
  REVERSED: "bg-slate-100 text-slate-500",
};

const STATUS_HELP: Record<string, string> = {
  PENDING: "The store is still validating this order. Cashback is reserved, not yet confirmed.",
  CONFIRMED: "The store confirmed this order. Cashback has been credited to your wallet.",
  PAID: "This order's cashback has been paid out.",
  REJECTED: "The store rejected this order, so no cashback is due.",
  CANCELLED: "This order was cancelled.",
  REVERSED: "This order was returned or cancelled after confirmation, so the cashback was reversed.",
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** Plain-language line for the confirmation column. */
function confirmationLabel(order: OrderRow): string {
  if (order.status === "CONFIRMED" || order.status === "PAID") {
    return order.confirmedAt ? `Confirmed ${formatDate(order.confirmedAt)}` : "Confirmed";
  }
  if (order.status === "REJECTED" || order.status === "CANCELLED") return "Not applicable";
  if (order.status === "REVERSED") {
    return order.reversedAt ? `Reversed ${formatDate(order.reversedAt)}` : "Reversed";
  }
  if (!order.estimatedConfirmation) return "Awaiting store confirmation";
  if (order.daysRemaining !== null && order.daysRemaining <= 0) {
    return "Overdue — being followed up";
  }
  return `Est. ${formatDate(order.estimatedConfirmation)}`;
}

export function OrdersList({ orders }: { orders: OrderRow[] }) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (orders.length === 0) {
    return (
      <div className="px-5 py-16 text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-400">
          <Package size={22} strokeWidth={1.75} />
        </span>
        <p className="mt-3 text-sm font-medium text-slate-700">No orders here</p>
        <p className="mt-1 text-sm text-slate-500">
          Start a shopping trip from any store page and your orders show up here once tracked.
        </p>
        <Link
          href="/stores"
          className="mt-4 inline-block rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-violet-500"
        >
          Browse Stores
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="hidden grid-cols-[minmax(0,1.4fr)_150px_130px_130px_180px_120px_40px] gap-3 border-b border-slate-100 px-5 py-3 text-xs uppercase tracking-wide text-slate-400 xl:grid">
        <div>Store &amp; Order</div>
        <div>Order Date</div>
        <div className="text-right">Order Amount</div>
        <div className="text-right">Cashback</div>
        <div>Confirmation</div>
        <div>Status</div>
        <div />
      </div>

      <ul className="divide-y divide-slate-100">
        {orders.map((order) => {
          const isOpen = expanded === order.id;
          return (
            <li key={order.id}>
              <button
                type="button"
                onClick={() => setExpanded(isOpen ? null : order.id)}
                aria-expanded={isOpen}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-slate-50/60 xl:grid-cols-[minmax(0,1.4fr)_150px_130px_130px_180px_120px_40px]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="shrink-0 rounded-lg ring-1 ring-slate-200">
                    <StoreLogo
                      src={order.store.logoUrl}
                      alt={order.store.name}
                      size={34}
                      fallbackSlug={order.store.slug}
                    />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold text-slate-900">
                      {order.store.name}
                    </span>
                    <span className="block truncate font-mono text-xs text-slate-400">
                      {order.orderId}
                    </span>
                  </span>
                </span>

                <span className="hidden whitespace-nowrap text-sm text-slate-600 xl:block">
                  {formatDate(order.placedAt)}
                </span>

                <span className="hidden whitespace-nowrap text-right text-sm text-slate-700 xl:block">
                  {formatInrExact(order.saleAmount)}
                </span>

                <span className="whitespace-nowrap text-right text-sm font-bold text-cashlime-700 xl:text-right">
                  {formatInrExact(order.cashback)}
                </span>

                <span className="hidden items-center gap-1.5 text-xs text-slate-500 xl:flex">
                  <CalendarClock size={13} strokeWidth={2} className="shrink-0 text-slate-400" />
                  <span className="truncate">{confirmationLabel(order)}</span>
                </span>

                <span className="hidden xl:block">
                  <span
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      STATUS_STYLES[order.status] ?? "bg-slate-100 text-slate-600"
                    }`}
                  >
                    {order.status.charAt(0) + order.status.slice(1).toLowerCase()}
                  </span>
                </span>

                <ChevronDown
                  size={16}
                  strokeWidth={2}
                  className={`justify-self-end text-slate-400 transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="border-t border-slate-100 bg-slate-50/60 px-5 py-4">
                  <p className="text-sm text-slate-600">
                    {STATUS_HELP[order.status] ?? "This order is being processed."}
                  </p>

                  <dl className="mt-3 grid gap-x-8 gap-y-2.5 sm:grid-cols-2 lg:grid-cols-3">
                    {[
                      ["Order ID", order.orderId],
                      ["Store", order.store.name],
                      ["Order date", formatDateTime(order.placedAt)],
                      ["Order amount", formatInrExact(order.saleAmount)],
                      ["Your cashback", formatInrExact(order.cashback)],
                      ["Status", order.status],
                      [
                        "Estimated confirmation",
                        order.estimatedConfirmation
                          ? formatDate(order.estimatedConfirmation)
                          : "Not published by this store",
                      ],
                      [
                        "Confirmed on",
                        order.confirmedAt ? formatDateTime(order.confirmedAt) : "—",
                      ],
                      ["Store tracking time", order.trackingTime ?? "—"],
                      ["Store payment time", order.paymentTime ?? "—"],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between gap-4 sm:block">
                        <dt className="text-xs text-slate-500">{label}</dt>
                        <dd className="text-sm font-medium text-slate-800 sm:mt-0.5">{value}</dd>
                      </div>
                    ))}
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <Link
                      href={`/stores/${order.store.slug}`}
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      Visit {order.store.name}
                    </Link>
                    <Link
                      href="/dashboard/activity?tab=own-transactions"
                      className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
                    >
                      See in transaction history
                    </Link>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </>
  );
}
