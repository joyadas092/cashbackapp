"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, Copy, Gift, MoreHorizontal } from "lucide-react";

export interface ReferralLinkCardProps {
  referralCode: string;
  shareUrl: string;
  /** Rendered in the promo box. Comes from the active ReferralRule. */
  friendPerk: { headline: string; sub: string };
}

const SHARE_TARGETS = [
  { label: "WhatsApp", tone: "bg-[#25D366]", glyph: "W", href: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}` },
  { label: "Telegram", tone: "bg-[#229ED9]", glyph: "T", href: (u: string, t: string) => `https://t.me/share/url?url=${u}&text=${t}` },
  { label: "Facebook", tone: "bg-[#1877F2]", glyph: "f", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { label: "Twitter", tone: "bg-slate-900", glyph: "X", href: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
];

export function ReferralLinkCard({ referralCode, shareUrl, friendPerk }: ReferralLinkCardProps) {
  const [copied, setCopied] = useState<"link" | "code" | null>(null);

  async function copy(value: string, which: "link" | "code") {
    await navigator.clipboard.writeText(value);
    setCopied(which);
    setTimeout(() => setCopied(null), 2000);
  }

  const message = "Join me on CashbackApp and start earning cashback!";
  const encodedUrl = encodeURIComponent(shareUrl);
  const encodedText = encodeURIComponent(message);

  async function shareMore() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "CashbackApp", text: message, url: shareUrl });
        return;
      } catch {
        // Dismissed — fall back to copying.
      }
    }
    await copy(shareUrl, "link");
  }

  return (
    <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <h2 className="text-lg font-bold text-slate-900">Your Referral Link &amp; Code</h2>

      <div className="mt-5 grid gap-6 lg:grid-cols-2 lg:divide-x lg:divide-slate-100">
        {/* --- Link + code --- */}
        <div className="space-y-5 lg:pr-6">
          <div>
            <label className="text-sm text-slate-500">Your Referral Link</label>
            <div className="mt-1.5 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5 pl-3.5">
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{shareUrl}</span>
              <button
                type="button"
                onClick={() => copy(shareUrl, "link")}
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                {copied === "link" ? (
                  <>
                    <Check size={13} strokeWidth={2.5} className="text-cashlime-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-slate-500">Your Referral Code</label>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1 rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-center text-base font-extrabold tracking-widest text-violet-700">
                {referralCode}
              </div>
              <button
                type="button"
                onClick={() => copy(referralCode, "code")}
                className="flex shrink-0 items-center gap-1.5 rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:text-violet-700"
              >
                {copied === "code" ? (
                  <>
                    <Check size={13} strokeWidth={2.5} className="text-cashlime-600" />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={13} strokeWidth={2} />
                    Copy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* --- Share targets + perk --- */}
        <div className="lg:pl-6">
          <div className="text-sm text-slate-500">Share your link on</div>

          <div className="mt-3 flex flex-wrap gap-4">
            {SHARE_TARGETS.map((target) => (
              <a
                key={target.label}
                href={target.href(encodedUrl, encodedText)}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex w-16 flex-col items-center gap-1.5"
              >
                <span
                  className={`flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white transition-transform group-hover:scale-105 ${target.tone}`}
                >
                  {target.glyph}
                </span>
                <span className="text-xs text-slate-500">{target.label}</span>
              </a>
            ))}

            <button
              type="button"
              onClick={shareMore}
              className="group flex w-16 flex-col items-center gap-1.5"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform group-hover:scale-105">
                <MoreHorizontal size={18} strokeWidth={2.5} />
              </span>
              <span className="text-xs text-slate-500">More</span>
            </button>
          </div>

          <div className="mt-5 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3.5">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
              <Gift size={19} strokeWidth={1.75} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="text-sm font-bold text-slate-900">{friendPerk.headline}</div>
              <div className="text-xs text-slate-500">{friendPerk.sub}</div>
            </div>
            <Link
              href="#how-refer-earn-works"
              className="flex shrink-0 items-center gap-1 text-xs font-semibold text-violet-700 hover:underline"
            >
              How it works?
              <ArrowRight size={13} strokeWidth={2.5} />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
