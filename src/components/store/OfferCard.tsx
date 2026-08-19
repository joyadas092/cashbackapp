"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

export interface OfferCardData {
  id: string;
  badge: string | null;
  title: string;
  description: string | null;
  code: string | null;
  validTill: string | null;
}

/**
 * One card in the store page's "Best Offers for You" panel. The code pill is a
 * copy button — the reference shows it styled like a coupon stub, and copying is
 * the only thing a user ever wants to do with it.
 */
export function OfferCard({ offer }: { offer: OfferCardData }) {
  const [copied, setCopied] = useState(false);

  async function copyCode() {
    if (!offer.code) return;
    await navigator.clipboard.writeText(offer.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex items-start gap-3 rounded-xl border border-slate-200 p-3">
      {offer.badge && (
        <span className="mt-0.5 shrink-0 rounded bg-violet-100 px-1.5 py-1 text-[9px] font-bold uppercase leading-none tracking-wide text-violet-700">
          {offer.badge}
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="text-sm font-bold text-slate-900">{offer.title}</div>
        {offer.description && (
          <div className="mt-0.5 text-xs text-slate-500">{offer.description}</div>
        )}
        {offer.validTill && (
          <div className="mt-0.5 text-xs text-slate-400">Valid till {offer.validTill}</div>
        )}
      </div>

      {offer.code && (
        <button
          type="button"
          onClick={copyCode}
          title={`Copy code ${offer.code}`}
          className="group flex shrink-0 items-center gap-1 rounded-lg border border-dashed border-rose-300 bg-rose-50/50 px-2.5 py-1.5 text-xs font-bold text-rose-600 transition-colors hover:bg-rose-50"
        >
          {copied ? (
            <>
              <Check size={12} strokeWidth={3} />
              Copied
            </>
          ) : (
            <>
              {offer.code}
              <Copy
                size={11}
                strokeWidth={2.5}
                className="opacity-0 transition-opacity group-hover:opacity-100"
              />
            </>
          )}
        </button>
      )}
    </div>
  );
}
