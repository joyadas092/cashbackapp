"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, X } from "lucide-react";
import { formatInrExact } from "@/lib/utils";

/**
 * Approve / reject controls for one payout request.
 *
 * Completing and rejecting both move real money, so each asks for confirmation
 * first rather than acting on a single click in a dense table.
 */
export function PayoutActions({
  id,
  status,
  amount,
  destination,
}: {
  id: string;
  status: string;
  amount: number;
  destination: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<"COMPLETED" | "REJECTED" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const actionable = status === "REQUESTED" || status === "PROCESSING";
  if (!actionable) {
    return <span className="text-xs text-slate-400">No action needed</span>;
  }

  async function apply(next: "PROCESSING" | "COMPLETED" | "REJECTED") {
    setPending(next);
    setError(null);

    const res = await fetch(`/api/admin/payouts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    const body = await res.json().catch(() => ({}));
    setPending(null);
    setConfirming(null);

    if (!res.ok) {
      setError(body.error ?? "Could not update that payout.");
      return;
    }
    router.refresh();
  }

  if (confirming) {
    const isPay = confirming === "COMPLETED";
    return (
      <div className="min-w-0">
        <p className="text-xs text-slate-600">
          {isPay
            ? `Confirm you've paid ${formatInrExact(amount)} to ${destination}?`
            : `Reject and return ${formatInrExact(amount)} to their balance?`}
        </p>
        <div className="mt-2 flex gap-2">
          <button
            type="button"
            onClick={() => apply(confirming)}
            disabled={pending !== null}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold text-white disabled:opacity-60 ${
              isPay ? "bg-cashlime-600 hover:bg-cashlime-500" : "bg-rose-600 hover:bg-rose-500"
            }`}
          >
            {pending ? "Working..." : isPay ? "Yes, mark paid" : "Yes, reject"}
          </button>
          <button
            type="button"
            onClick={() => setConfirming(null)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-w-0">
      <div className="flex flex-wrap gap-2">
        {status === "REQUESTED" && (
          <button
            type="button"
            onClick={() => apply("PROCESSING")}
            disabled={pending !== null}
            className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            {pending === "PROCESSING" && <Loader2 size={12} className="animate-spin" />}
            Start
          </button>
        )}
        <button
          type="button"
          onClick={() => setConfirming("COMPLETED")}
          className="flex items-center gap-1.5 rounded-lg bg-cashlime-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-cashlime-500"
        >
          <Check size={12} strokeWidth={3} />
          Mark paid
        </button>
        <button
          type="button"
          onClick={() => setConfirming("REJECTED")}
          className="flex items-center gap-1.5 rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50"
        >
          <X size={12} strokeWidth={3} />
          Reject
        </button>
      </div>
      {error && <p className="mt-1.5 text-xs text-rose-600">{error}</p>}
    </div>
  );
}
