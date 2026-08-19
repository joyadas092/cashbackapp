"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  Copy,
  Link2,
  Lock,
  MoreHorizontal,
  ShieldCheck,
  Sparkles,
  Store,
  Trophy,
  Wallet,
  X as XIcon,
} from "lucide-react";
import { LoginRequiredModal } from "./LoginRequiredModal";
import { RecentLinksPanel } from "./RecentLinksPanel";

interface GeneratedLink {
  id: string;
  code: string;
  shareUrl: string;
  cashbackDisplayText: string;
  createdAt: string;
  store: {
    name: string;
    slug: string;
    logoUrl: string;
    category: string;
    trackingTime: string | null;
  };
}

export interface ShareEarnWorkspaceProps {
  isLoggedIn: boolean;
  /** Highest profit-link share across active stores, for the earnings card. */
  topShareText: string;
  sampleUrl: string;
}

const HOW_IT_WORKS = [
  {
    icon: Link2,
    title: "Paste Link",
    body: "Paste any product link from any store",
    tone: "bg-violet-100 text-violet-600",
  },
  {
    icon: Store,
    title: "We Process",
    body: "We convert it into our earning link",
    tone: "bg-orange-100 text-orange-600",
  },
  {
    icon: Sparkles,
    title: "Share It",
    body: "Share with friends, family or on social media",
    tone: "bg-cashlime-100 text-cashlime-700",
  },
  {
    icon: Wallet,
    title: "Earn Money",
    body: "Earn cashback when someone buys through your link",
    tone: "bg-amber-100 text-amber-600",
  },
];

const TIPS = [
  "Share in WhatsApp groups for maximum reach",
  "Post on Instagram stories with a swipe-up",
  "Share with friends looking to buy something",
  "More shares means more chances to earn",
];

export function ShareEarnWorkspace({
  isLoggedIn,
  topShareText,
  sampleUrl,
}: ShareEarnWorkspaceProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GeneratedLink | null>(null);
  const [copied, setCopied] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();

    // The account is what earnings attach to, so stop here rather than calling
    // the API and surfacing a raw 401.
    if (!isLoggedIn) {
      setShowLogin(true);
      return;
    }

    setLoading(true);
    setError(null);

    const res = await fetch("/api/profit-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const body = await res.json().catch(() => ({}));
    setLoading(false);

    if (!res.ok) {
      setError(body.error ?? "Could not create an earning link for that URL.");
      return;
    }

    setResult(body);
    setUrl("");
    setRefreshKey((k) => k + 1);
  }

  async function copyLink() {
    if (!result) return;
    await navigator.clipboard.writeText(result.shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = result
    ? `Check out this deal at ${result.store.name}!`
    : "Check out this deal!";
  const encodedText = encodeURIComponent(shareText);
  const encodedUrl = result ? encodeURIComponent(result.shareUrl) : "";

  const shareTargets = [
    {
      label: "WhatsApp",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      tone: "bg-[#25D366]",
      glyph: "W",
    },
    {
      label: "Telegram",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      tone: "bg-[#229ED9]",
      glyph: "T",
    },
    {
      label: "Facebook",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      tone: "bg-[#1877F2]",
      glyph: "f",
    },
    {
      label: "X (Twitter)",
      href: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      tone: "bg-slate-900",
      glyph: "X",
    },
  ];

  async function shareMore() {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: result.store.name, text: shareText, url: result.shareUrl });
        return;
      } catch {
        // Dismissed — fall through to copying.
      }
    }
    await copyLink();
  }

  const detailRows: Array<[string, string]> = [
    ["Merchant", result?.store.name ?? "—"],
    ["Category", result?.store.category ?? "—"],
    ["Tracking", result?.store.trackingTime ?? (result ? "24 - 48 Hours" : "—")],
    [
      "Link Created On",
      result
        ? new Date(result.createdAt).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric",
          })
        : "—",
    ],
    ["Your Link ID", result?.code ?? "—"],
  ];

  return (
    <>
      <LoginRequiredModal
        open={showLogin}
        onClose={() => setShowLogin(false)}
        callbackUrl="/share-earn"
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ================= Left: the three steps ================= */}
        <div className="space-y-6">
          {/* --- 1. Paste --- */}
          <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-base font-bold text-slate-900">1. Paste any product link</h2>
            <p className="mt-0.5 text-sm text-slate-500">We support links from 1000+ stores</p>

            <form onSubmit={handleGenerate} className="mt-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Link2
                  size={16}
                  strokeWidth={2}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  required
                  placeholder={`Paste product URL here (e.g. ${sampleUrl})`}
                  aria-label="Product URL"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 py-3.5 pl-11 pr-10 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-violet-400 focus:bg-white"
                />
                {url && (
                  <button
                    type="button"
                    onClick={() => setUrl("")}
                    aria-label="Clear"
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  >
                    <XIcon size={14} strokeWidth={2.5} />
                  </button>
                )}
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-colors hover:bg-violet-500 disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate Profit Link"}
                {!loading && <ArrowRight size={16} strokeWidth={2.5} />}
              </button>
            </form>

            <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
              <Lock size={11} strokeWidth={2} />
              We&apos;ll create your earning link in seconds
            </p>

            {error && (
              <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
            )}

            {/* How it works */}
            <div className="mt-7 border-t border-slate-100 pt-5">
              <h3 className="text-sm font-bold text-slate-900">How it works</h3>
              <ol className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
                {HOW_IT_WORKS.map((step, i, arr) => (
                  <li key={step.title} className="relative text-center">
                    <span
                      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full ${step.tone}`}
                    >
                      <step.icon size={22} strokeWidth={1.75} />
                    </span>
                    <div className="mt-2.5 text-sm font-bold text-slate-900">
                      {i + 1}. {step.title}
                    </div>
                    <p className="mt-0.5 text-xs leading-relaxed text-slate-500">{step.body}</p>

                    {i < arr.length - 1 && (
                      <span
                        aria-hidden
                        className="absolute right-0 top-7 hidden w-full translate-x-1/2 border-t border-dashed border-slate-300 sm:block"
                      />
                    )}
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* --- 2. Generated link --- */}
          <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-base font-bold text-slate-900">2. Your Generated Profit Link</h2>
              <button
                type="button"
                onClick={copyLink}
                disabled={!result}
                className="rounded-lg border border-violet-200 px-3 py-1.5 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50 disabled:opacity-40"
              >
                {copied ? "Copied" : "Copy"}
              </button>
            </div>

            {result ? (
              <>
                <div className="mt-4 flex flex-col gap-3 rounded-xl border border-cashlime-500/30 bg-cashlime-50 p-3 sm:flex-row sm:items-center">
                  <Link2
                    size={16}
                    strokeWidth={2}
                    className="hidden shrink-0 text-cashlime-700 sm:block"
                  />
                  <code className="min-w-0 flex-1 break-all text-sm text-slate-800">
                    {result.shareUrl}
                  </code>
                  <button
                    type="button"
                    onClick={copyLink}
                    className="flex shrink-0 items-center justify-center gap-1.5 rounded-lg bg-cashlime-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cashlime-500"
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
                <p className="mt-2 text-xs text-slate-400">
                  This is your unique link. Share it anywhere!
                </p>
              </>
            ) : (
              <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-center text-sm text-slate-500">
                Your earning link will appear here once you generate it.
              </div>
            )}
          </section>

          {/* --- 3. Share --- */}
          <section className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card sm:p-6">
            <h2 className="text-base font-bold text-slate-900">3. Share your link</h2>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {shareTargets.map((target) =>
                result ? (
                  <a
                    key={target.label}
                    href={target.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50/40"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${target.tone}`}
                    >
                      {target.glyph}
                    </span>
                    {target.label}
                  </a>
                ) : (
                  <span
                    key={target.label}
                    aria-disabled
                    className="flex cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-400 opacity-60"
                  >
                    <span
                      className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white ${target.tone}`}
                    >
                      {target.glyph}
                    </span>
                    {target.label}
                  </span>
                )
              )}

              <button
                type="button"
                onClick={shareMore}
                disabled={!result}
                className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:border-violet-300 hover:bg-violet-50/40 disabled:cursor-not-allowed disabled:text-slate-400 disabled:opacity-60"
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                  <MoreHorizontal size={15} strokeWidth={2.5} />
                </span>
                More
              </button>
            </div>

            {/* Pro tip */}
            <div className="mt-5 flex flex-col gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-4 sm:flex-row sm:items-center">
              <Trophy size={18} strokeWidth={2} className="shrink-0 text-violet-600" />
              <p className="min-w-0 flex-1 text-sm text-slate-700">
                <span className="font-bold text-slate-900">Pro Tip:</span> Share in groups, with
                friends &amp; on social media to maximize your earnings!
              </p>
              <Link
                href="/stores"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-violet-200 bg-white px-3.5 py-2 text-xs font-semibold text-violet-700 transition-colors hover:bg-violet-50"
              >
                Browse Stores
                <ArrowRight size={13} strokeWidth={2.5} />
              </Link>
            </div>
          </section>
        </div>

        {/* ================= Right sidebar ================= */}
        <aside className="space-y-6">
          <RecentLinksPanel isLoggedIn={isLoggedIn} refreshKey={refreshKey} />

          {/* Earnings */}
          <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-slate-900">Earnings You Get</h2>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-violet-100 bg-violet-50/70 p-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
                <Wallet size={20} strokeWidth={2} />
              </span>
              <div className="min-w-0">
                <div className="text-xs text-slate-500">Up to</div>
                <div className="text-xl font-extrabold text-violet-700">
                  {result?.cashbackDisplayText ?? topShareText}
                </div>
              </div>
            </div>
            <p className="mt-3 flex items-start gap-1.5 text-xs text-slate-500">
              <ShieldCheck size={13} strokeWidth={2} className="mt-0.5 shrink-0 text-cashlime-600" />
              Earnings are credited once the store confirms the order.
            </p>
          </div>

          {/* Link details */}
          <div className="rounded-xl2 border border-slate-200 bg-white p-5 shadow-card">
            <h2 className="text-base font-bold text-slate-900">Link Details</h2>
            <dl className="mt-3 divide-y divide-slate-100">
              {detailRows.map(([label, value]) => (
                <div key={label} className="flex items-center justify-between gap-4 py-2.5">
                  <dt className="text-sm text-slate-500">{label}</dt>
                  <dd className="min-w-0 truncate text-sm font-semibold text-slate-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>

          {/* Tips */}
          <div className="rounded-xl2 border border-cashlime-500/25 bg-cashlime-50/60 p-5">
            <h2 className="text-base font-bold text-slate-900">Tips to Earn More</h2>
            <ul className="mt-3 space-y-2.5">
              {TIPS.map((tip) => (
                <li key={tip} className="flex gap-2.5 text-sm text-slate-700">
                  <Check size={15} strokeWidth={2.5} className="mt-0.5 shrink-0 text-cashlime-600" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}
