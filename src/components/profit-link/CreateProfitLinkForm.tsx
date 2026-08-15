"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { StoreLogo } from "@/components/store/StoreLogo";
import { ShareButtons } from "@/components/shared/ShareButtons";

interface CreatedLink {
  code: string;
  shareUrl: string;
  store: { name: string; slug: string; logoUrl: string };
  cashbackDisplayText: string;
}

export function CreateProfitLinkForm({ onCreated }: { onCreated?: () => void }) {
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
    onCreated?.();
  }

  return (
    <Card variant="light" className="p-6">
      <h2 className="text-lg font-bold text-slate-900">Turn product links into earning links.</h2>
      <p className="mt-1 text-sm text-slate-500">We support links from our partner stores.</p>
      <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-3 sm:flex-row">
        <Input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Paste product URL here (e.g. https://www.myntra.com/...)"
          required
          variant="light"
          className="flex-1"
        />
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? "Creating..." : "Generate Profit Link"}
        </Button>
      </form>
      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {result && (
        <div className="mt-5 rounded-xl2 border border-cashlime-500/30 bg-cashlime-50 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-white ring-1 ring-slate-200">
              <StoreLogo src={result.store.logoUrl} alt={result.store.name} size={40} />
            </div>
            <div>
              <div className="font-semibold text-slate-900">{result.store.name}</div>
              <div className="text-sm font-medium text-cashlime-700">
                {result.cashbackDisplayText}
              </div>
            </div>
          </div>
          <p className="mt-3 break-all rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700">
            {result.shareUrl}
          </p>
          <p className="mt-2 text-xs text-slate-500">
            Share this link. When someone shops through it, you earn according to the store&apos;s
            earning rules.
          </p>
          <div className="mt-3">
            <ShareButtons url={result.shareUrl} message={`Check out this deal at ${result.store.name}!`} />
          </div>
        </div>
      )}
    </Card>
  );
}
