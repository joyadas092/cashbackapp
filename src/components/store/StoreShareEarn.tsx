"use client";

import { useState } from "react";
import Link from "next/link";
import { Link2, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ShareButtons } from "@/components/shared/ShareButtons";

interface CreatedLink {
  shareUrl: string;
  store: { name: string };
}

export interface StoreShareEarnProps {
  storeName: string;
  storeSlug: string;
  /** Primary merchant domain, used to show a realistic placeholder URL. */
  sampleDomain: string | null;
  isLoggedIn: boolean;
  /** Stores that Cuelinks lets us deep-link can carry profit links; others can't. */
  profitLinkEligible: boolean;
}

export function StoreShareEarn({
  storeName,
  storeSlug,
  sampleDomain,
  isLoggedIn,
  profitLinkEligible,
}: StoreShareEarnProps) {
  const [url, setUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedLink | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

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
  }

  return (
    <div className="rounded-xl2 border border-violet-200 bg-gradient-to-br from-violet-50 to-white p-5 shadow-card sm:p-6">
      <div className="flex items-start gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-white">
          <Link2 size={20} strokeWidth={2} />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg font-bold text-slate-900">Share &amp; Earn from {storeName}</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Turn any {storeName} product link into your own earning link. When someone buys
            through it, you earn — even if they never sign up.
          </p>
        </div>
      </div>

      {!profitLinkEligible ? (
        <p className="mt-4 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
          Profit links aren&apos;t available for {storeName} yet. You still earn cashback on your
          own purchases here.
        </p>
      ) : !isLoggedIn ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Link href={`/login?callbackUrl=/stores/${storeSlug}`}>
            <Button variant="primary" size="md">
              <Sparkles size={16} strokeWidth={2} />
              Log in to create your link
            </Button>
          </Link>
          <Link
            href={`/register?callbackUrl=/stores/${storeSlug}`}
            className="text-sm font-semibold text-violet-700 hover:underline"
          >
            Create a free account
          </Link>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-2.5 sm:flex-row">
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={
                sampleDomain
                  ? `Paste a ${sampleDomain} product link`
                  : `Paste a ${storeName} product link`
              }
              required
              variant="light"
              className="flex-1"
            />
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? "Creating..." : "Generate Link"}
            </Button>
          </form>

          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

          {result && (
            <div className="mt-4 rounded-xl border border-cashlime-500/30 bg-cashlime-50 p-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-cashlime-700">
                Your earning link
              </div>
              <p className="mt-1.5 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
                {result.shareUrl}
              </p>
              <div className="mt-3">
                <ShareButtons
                  url={result.shareUrl}
                  message={`Check out this deal at ${result.store.name}!`}
                />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
