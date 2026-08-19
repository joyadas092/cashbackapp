"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Copy, Link2, MoreHorizontal } from "lucide-react";

const SOCIALS = [
  { label: "WhatsApp", tone: "bg-[#25D366]", glyph: "W", href: (u: string, t: string) => `https://wa.me/?text=${t}%20${u}` },
  { label: "Telegram", tone: "bg-[#229ED9]", glyph: "T", href: (u: string, t: string) => `https://t.me/share/url?url=${u}&text=${t}` },
  { label: "Facebook", tone: "bg-[#1877F2]", glyph: "f", href: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${u}` },
  { label: "X", tone: "bg-slate-900", glyph: "X", href: (u: string, t: string) => `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
];

/**
 * The overlapping "share your link" bar.
 *
 * A logged-out visitor has no referral link — there is no code to show and
 * nothing to copy. Rather than rendering a fake or placeholder URL that copies
 * something broken, the bar switches to a sign-up prompt in that case.
 */
export function PublicShareBar({ shareUrl }: { shareUrl: string | null }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const message = "Join me on CashbackApp and start earning cashback!";
  const encodedUrl = shareUrl ? encodeURIComponent(shareUrl) : "";
  const encodedText = encodeURIComponent(message);

  async function shareMore() {
    if (!shareUrl) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "CashbackApp", text: message, url: shareUrl });
        return;
      } catch {
        // Dismissed — fall through to copying.
      }
    }
    await copy();
  }

  return (
    <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center">
        <div className="lg:w-72 lg:shrink-0">
          <h2 className="text-lg font-bold text-slate-900">Share your link and start earning</h2>
          <p className="mt-1 text-sm text-slate-500">
            Share your unique link with friends or share via social media.
          </p>
        </div>

        {shareUrl ? (
          <>
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-1.5 pl-4">
              <Link2 size={16} strokeWidth={2} className="shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{shareUrl}</span>
              <button
                type="button"
                onClick={copy}
                className="flex shrink-0 items-center gap-1.5 rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-violet-500"
              >
                {copied ? (
                  <>
                    <Check size={14} strokeWidth={2.5} />
                    Copied
                  </>
                ) : (
                  <>
                    <Copy size={14} strokeWidth={2} />
                    Copy Link
                  </>
                )}
              </button>
            </div>

            <div className="flex shrink-0 items-center gap-2.5">
              <span className="whitespace-nowrap text-sm text-slate-500">or share via</span>
              {SOCIALS.map((social) => (
                <a
                  key={social.label}
                  href={social.href(encodedUrl, encodedText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={social.label}
                  aria-label={`Share on ${social.label}`}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white transition-transform hover:scale-105 ${social.tone}`}
                >
                  {social.glyph}
                </a>
              ))}
              <button
                type="button"
                onClick={shareMore}
                aria-label="More share options"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 text-slate-500 transition-transform hover:scale-105"
              >
                <MoreHorizontal size={16} strokeWidth={2.5} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3">
            <div className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-3.5 text-sm text-slate-400">
              <Link2 size={16} strokeWidth={2} className="shrink-0" />
              Your referral link appears here once you sign up
            </div>
            <Link
              href="/register?callbackUrl=/refer-earn"
              className="shrink-0 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500"
            >
              Get My Link
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
